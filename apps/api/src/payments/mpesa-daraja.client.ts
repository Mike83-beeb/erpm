import { createHash, randomBytes } from "node:crypto";
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { MpesaEnvironment, MpesaShortcodeType } from "@scace/db";
import { getEnv } from "../config/env.js";
import { RedisService } from "../redis/redis.service.js";
import {
  formatDarajaTimestamp,
  generateDarajaStkPassword,
} from "./mpesa-security.utils.js";

export interface DarajaCredentialsContext {
  organizationId: string;
  environment: MpesaEnvironment;
  shortcodeType: MpesaShortcodeType;
  businessShortCode: string;
  partyB: string | null;
  consumerKey: string | null;
  consumerSecret: string | null;
  passkey: string | null;
}

export interface InitiateStkPushParams {
  credentials: DarajaCredentialsContext;
  amountWholeUnits: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

export interface StkPushResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
  simulated: boolean;
}

export interface StkQueryResponse {
  responseCode: string;
  responseDescription: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: string;
  resultDesc: string;
  simulated: boolean;
}

export interface C2bRegisterUrlResponse {
  originatorCoversationID?: string;
  responseCode: string;
  responseDescription: string;
  simulated: boolean;
}

@Injectable()
export class MpesaDarajaClient {
  private readonly logger = new Logger(MpesaDarajaClient.name);

  constructor(
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  private resolveBaseUrl(environment: MpesaEnvironment): string {
    if (environment === MpesaEnvironment.PRODUCTION) {
      return "https://api.safaricom.co.ke";
    }
    return "https://sandbox.safaricom.co.ke";
  }

  private assertLiveCredentials(creds: DarajaCredentialsContext): {
    consumerKey: string;
    consumerSecret: string;
  } {
    if (!creds.consumerKey || !creds.consumerSecret) {
      throw new BadRequestException(
        "M-Pesa consumerKey and consumerSecret must be configured for SANDBOX or PRODUCTION environments.",
      );
    }
    return {
      consumerKey: creds.consumerKey,
      consumerSecret: creds.consumerSecret,
    };
  }

  async getAccessToken(
    creds: DarajaCredentialsContext,
    forceRefresh = false,
  ): Promise<{ accessToken: string; cached: boolean; simulated: boolean }> {
    if (creds.environment === MpesaEnvironment.LOCAL_SIMULATOR) {
      return {
        accessToken: "sim_daraja_access_token",
        cached: false,
        simulated: true,
      };
    }

    const { consumerKey, consumerSecret } = this.assertLiveCredentials(creds);
    const credFingerprint = createHash("sha256")
      .update(`${creds.environment}:${consumerKey}:${consumerSecret}`)
      .digest("hex")
      .slice(0, 16);
    const cacheKey = `mpesa:oauth:${creds.organizationId}:${credFingerprint}`;

    if (!forceRefresh) {
      try {
        const cached = await this.redisService.getJson<{
          accessToken: string;
          expiresAtMs: number;
        }>(cacheKey);
        if (cached && cached.accessToken && cached.expiresAtMs > Date.now() + 60_000) {
          return {
            accessToken: cached.accessToken,
            cached: true,
            simulated: false,
          };
        }
      } catch {
        // Fallback cleanly to live token fetch
      }
    }

    const env = getEnv();
    const baseUrl = this.resolveBaseUrl(creds.environment);
    const basic = Buffer.from(`${consumerKey}:${consumerSecret}`, "utf8").toString(
      "base64",
    );

    const response = await this.fetchJson<{
      access_token?: string;
      expires_in?: string | number;
      errorMessage?: string;
    }>(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
      },
      signal: AbortSignal.timeout(env.MPESA_REQUEST_TIMEOUT_MS),
    });

    if (!response.access_token) {
      throw new BadGatewayException(
        response.errorMessage || "Safaricom Daraja OAuth did not return an access_token.",
      );
    }

    const expiresInSec = Math.max(120, Number(response.expires_in ?? 3599) || 3599);
    const ttlSec = Math.max(60, expiresInSec - 300);
    try {
      await this.redisService.setJson(
        cacheKey,
        {
          accessToken: response.access_token,
          expiresAtMs: Date.now() + ttlSec * 1000,
        },
        ttlSec,
      );
    } catch {
      // Non-fatal cache write failure
    }

    return {
      accessToken: response.access_token,
      cached: false,
      simulated: false,
    };
  }

  async initiateStkPush(params: InitiateStkPushParams): Promise<StkPushResponse> {
    const { credentials } = params;
    if (credentials.environment === MpesaEnvironment.LOCAL_SIMULATOR) {
      const suffix = randomBytes(6).toString("hex");
      return {
        merchantRequestId: `SIM-MR-${Date.now()}-${suffix.slice(0, 6)}`,
        checkoutRequestId: `ws_CO_SIM_${Date.now()}_${suffix}`,
        responseCode: "0",
        responseDescription: "Success. Request accepted for processing",
        customerMessage: "Success. Request accepted for processing",
        simulated: true,
      };
    }

    if (!credentials.passkey) {
      throw new BadRequestException(
        "M-Pesa passkey must be configured for STK Push in SANDBOX or PRODUCTION environments.",
      );
    }

    const { accessToken } = await this.getAccessToken(credentials);
    const timestamp = formatDarajaTimestamp();
    const password = generateDarajaStkPassword(
      credentials.businessShortCode,
      credentials.passkey,
      timestamp,
    );
    const transactionType =
      credentials.shortcodeType === MpesaShortcodeType.TILL
        ? "CustomerBuyGoodsOnline"
        : "CustomerPayBillOnline";
    const partyB =
      credentials.shortcodeType === MpesaShortcodeType.TILL && credentials.partyB
        ? credentials.partyB
        : credentials.businessShortCode;

    const env = getEnv();
    const baseUrl = this.resolveBaseUrl(credentials.environment);

    const payload = {
      BusinessShortCode: credentials.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: params.amountWholeUnits,
      PartyA: params.phoneNumber,
      PartyB: partyB,
      PhoneNumber: params.phoneNumber,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    const res = await this.fetchJson<{
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
      CustomerMessage?: string;
      errorMessage?: string;
      errorCode?: string;
    }>(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(env.MPESA_REQUEST_TIMEOUT_MS),
    });

    if (res.errorCode || res.errorMessage) {
      throw new BadGatewayException(
        res.errorMessage || `Daraja STK Push error (${res.errorCode})`,
      );
    }
    if (!res.CheckoutRequestID || !res.MerchantRequestID || res.ResponseCode !== "0") {
      throw new BadGatewayException(
        res.ResponseDescription ||
          "Safaricom Daraja rejected the STK Push request.",
      );
    }

    return {
      merchantRequestId: res.MerchantRequestID,
      checkoutRequestId: res.CheckoutRequestID,
      responseCode: res.ResponseCode,
      responseDescription: res.ResponseDescription ?? "Accepted",
      customerMessage: res.CustomerMessage ?? "Accepted",
      simulated: false,
    };
  }

  async queryStkPushStatus(params: {
    credentials: DarajaCredentialsContext;
    checkoutRequestId: string;
  }): Promise<StkQueryResponse> {
    const { credentials, checkoutRequestId } = params;
    if (credentials.environment === MpesaEnvironment.LOCAL_SIMULATOR) {
      return {
        responseCode: "0",
        responseDescription: "Simulated STK transaction still awaiting callback or use simulator endpoint.",
        merchantRequestId: `SIM-MR-${checkoutRequestId.slice(-8)}`,
        checkoutRequestId,
        resultCode: "PENDING",
        resultDesc: "Pending simulated customer confirmation.",
        simulated: true,
      };
    }

    if (!credentials.passkey) {
      throw new BadRequestException(
        "M-Pesa passkey must be configured to query STK Push status.",
      );
    }

    const { accessToken } = await this.getAccessToken(credentials);
    const timestamp = formatDarajaTimestamp();
    const password = generateDarajaStkPassword(
      credentials.businessShortCode,
      credentials.passkey,
      timestamp,
    );
    const env = getEnv();
    const baseUrl = this.resolveBaseUrl(credentials.environment);

    const res = await this.fetchJson<{
      ResponseCode?: string;
      ResponseDescription?: string;
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: string | number;
      ResultDesc?: string;
      errorMessage?: string;
      errorCode?: string;
    }>(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: credentials.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
      signal: AbortSignal.timeout(env.MPESA_REQUEST_TIMEOUT_MS),
    });

    if (res.errorCode || res.errorMessage) {
      throw new BadGatewayException(
        res.errorMessage || `Daraja STK Query error (${res.errorCode})`,
      );
    }

    return {
      responseCode: String(res.ResponseCode ?? "0"),
      responseDescription: String(res.ResponseDescription ?? ""),
      merchantRequestId: String(res.MerchantRequestID ?? ""),
      checkoutRequestId: String(res.CheckoutRequestID ?? checkoutRequestId),
      resultCode:
        res.ResultCode !== undefined && res.ResultCode !== null
          ? String(res.ResultCode)
          : "PENDING",
      resultDesc: String(res.ResultDesc ?? ""),
      simulated: false,
    };
  }

  async registerC2bUrls(params: {
    credentials: DarajaCredentialsContext;
    confirmationUrl: string;
    validationUrl: string;
    responseType: "Completed" | "Cancelled";
  }): Promise<C2bRegisterUrlResponse> {
    const { credentials } = params;
    if (credentials.environment === MpesaEnvironment.LOCAL_SIMULATOR) {
      return {
        responseCode: "00000000",
        responseDescription: "Simulated C2B URLs registered successfully.",
        simulated: true,
      };
    }

    const { accessToken } = await this.getAccessToken(credentials);
    const env = getEnv();
    const baseUrl = this.resolveBaseUrl(credentials.environment);
    const endpoint =
      credentials.environment === MpesaEnvironment.PRODUCTION
        ? `${baseUrl}/mpesa/c2b/v2/registerurl`
        : `${baseUrl}/mpesa/c2b/v1/registerurl`;

    const res = await this.fetchJson<{
      OriginatorCoversationID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
      errorMessage?: string;
      errorCode?: string;
    }>(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ShortCode: credentials.businessShortCode,
        ResponseType: params.responseType,
        ConfirmationURL: params.confirmationUrl,
        ValidationURL: params.validationUrl,
      }),
      signal: AbortSignal.timeout(env.MPESA_REQUEST_TIMEOUT_MS),
    });

    if (res.errorCode || res.errorMessage) {
      throw new BadGatewayException(
        res.errorMessage || `Daraja C2B registration error (${res.errorCode})`,
      );
    }

    return {
      originatorCoversationID: res.OriginatorCoversationID,
      responseCode: String(res.ResponseCode ?? "0"),
      responseDescription: String(res.ResponseDescription ?? "Success"),
      simulated: false,
    };
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      this.logger.warn(
        `Daraja network request failed for ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadGatewayException(
        "Unable to reach Safaricom Daraja API. Verify environment settings and network connectivity.",
      );
    }

    const text = await response.text();
    let parsed: Record<string, unknown> = {};
    if (text.trim().length > 0) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new BadGatewayException(
          `Safaricom Daraja returned non-JSON response (HTTP ${response.status}).`,
        );
      }
    }

    if (!response.ok) {
      const msg =
        (typeof parsed.errorMessage === "string" && parsed.errorMessage) ||
        (typeof parsed.ResponseDescription === "string" && parsed.ResponseDescription) ||
        `Safaricom Daraja returned HTTP ${response.status}.`;
      throw new BadGatewayException(msg);
    }

    return parsed as T;
  }
}
