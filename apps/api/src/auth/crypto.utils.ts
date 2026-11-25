import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type JsonWebKey,
  type KeyObject,
  randomBytes,
  sign as cryptoSign,
  timingSafeEqual,
  verify as cryptoVerify,
} from "node:crypto";
import { isIP } from "node:net";
import { BadRequestException } from "@nestjs/common";
import { getEnv } from "../config/env.js";
import { assertSafeResolvedTarget, validateCustomerMatesBaseUrl } from "../crm/crm-security.utils.js";

export type SupportedJwtAlg = "ES256" | "RS256" | "EdDSA";

function deriveAuthCipherKey(): Buffer {
  const env = getEnv();
  const material = env.AUTH_TOKEN_ENCRYPTION_KEY ?? `scace-auth:${env.BETTER_AUTH_SECRET}`;
  return createHash("sha256").update(material).digest();
}

export function encryptAuthSecret(plaintext: string): string {
  const key = deriveAuthCipherKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("scace-auth-v1", "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptAuthSecret(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported auth secret ciphertext format.");
  }
  const [, ivHex, tagHex, dataHex] = parts;
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Malformed auth secret ciphertext.");
  }
  const key = deriveAuthCipherKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAAD(Buffer.from("scace-auth-v1", "utf8"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
    return false;
  }
  const computed = sha256Base64Url(codeVerifier);
  return safeEqualStrings(computed, codeChallenge);
}

export function generateRandomToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

const USER_CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXZ";

export function generateRfc8628UserCode(): string {
  const bytes = randomBytes(8);
  let chars = "";
  for (let i = 0; i < 8; i++) {
    chars += USER_CODE_ALPHABET[(bytes[i] ?? 0) % USER_CODE_ALPHABET.length];
  }
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function normalizeIp(rawIp: string | undefined): string {
  if (!rawIp) {
    return "";
  }
  const first = rawIp.split(",")[0]?.trim() ?? "";
  if (first.startsWith("::ffff:")) {
    return first.slice(7);
  }
  return first;
}

export function matchesIpAllowlist(
  clientIp: string | undefined,
  allowlist: readonly string[] | undefined,
): boolean {
  if (!allowlist || allowlist.length === 0) {
    return true;
  }
  const ip = normalizeIp(clientIp);
  if (!ip) {
    return false;
  }
  const ipVersion = isIP(ip);
  if (!ipVersion) {
    return false;
  }

  for (const ruleRaw of allowlist) {
    const rule = ruleRaw.trim();
    if (!rule) {
      continue;
    }
    if (rule === ip) {
      return true;
    }
    if (rule.includes("/") && ipVersion === 4) {
      const [baseIp, bitsRaw] = rule.split("/");
      const bits = Number(bitsRaw);
      if (baseIp && isIP(baseIp) === 4 && Number.isInteger(bits) && bits >= 0 && bits <= 32) {
        const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
        if ((ipv4ToInt(ip) & mask) === (ipv4ToInt(baseIp) & mask)) {
          return true;
        }
      }
    }
  }

  return false;
}

export async function validateSafeExternalEndpoint(rawUrl: string): Promise<string> {
  const env = getEnv();
  const normalized = validateCustomerMatesBaseUrl(rawUrl, env.CRM_ALLOW_PRIVATE_URLS, false);
  await assertSafeResolvedTarget(normalized, env.CRM_ALLOW_PRIVATE_URLS);
  return normalized;
}

export function toJwtAlg(alg: "RS256" | "ES256" | "EDDSA" | SupportedJwtAlg): SupportedJwtAlg {
  return alg === "EDDSA" ? "EdDSA" : alg;
}

export function fromJwtAlg(alg: SupportedJwtAlg): "RS256" | "ES256" | "EDDSA" {
  return alg === "EdDSA" ? "EDDSA" : alg;
}

export function generateAsymmetricKeyPair(algorithm: "ES256" | "RS256" | "EDDSA", kid: string): {
  kid: string;
  algorithm: "ES256" | "RS256" | "EDDSA";
  publicKeyPem: string;
  privateKeyPem: string;
  publicJwk: Record<string, unknown>;
} {
  let publicKey: KeyObject;
  let privateKey: KeyObject;

  if (algorithm === "ES256") {
    ({ publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" }));
  } else if (algorithm === "RS256") {
    ({ publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 }));
  } else {
    ({ publicKey, privateKey } = generateKeyPairSync("ed25519"));
  }

  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const exportedJwk = publicKey.export({ format: "jwk" }) as Record<string, unknown>;

  return {
    kid,
    algorithm,
    publicKeyPem,
    privateKeyPem,
    publicJwk: {
      ...exportedJwk,
      kid,
      use: "sig",
      alg: toJwtAlg(algorithm),
    },
  };
}

export function parseClientPublicKey(params: {
  publicKeyPem?: string;
  publicJwk?: Record<string, unknown>;
  algorithm: "ES256" | "RS256" | "EDDSA";
  kid: string;
}): { publicKeyPem: string; publicJwk: Record<string, unknown> } {
  let keyObj: KeyObject;
  try {
    if (params.publicKeyPem) {
      keyObj = createPublicKey(params.publicKeyPem);
    } else if (params.publicJwk) {
      keyObj = createPublicKey({
        key: params.publicJwk as JsonWebKey,
        format: "jwk",
      });
    } else {
      throw new BadRequestException("Provide either publicKeyPem or publicJwk.");
    }
  } catch (err) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    throw new BadRequestException(
      `Invalid public key material: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const expectedType =
    params.algorithm === "ES256" ? "ec" : params.algorithm === "RS256" ? "rsa" : "ed25519";
  if (keyObj.asymmetricKeyType !== expectedType) {
    throw new BadRequestException(
      `Public key type (${keyObj.asymmetricKeyType ?? "unknown"}) does not match algorithm ${params.algorithm}.`,
    );
  }

  const publicKeyPem = keyObj.export({ type: "spki", format: "pem" }).toString();
  const jwk = keyObj.export({ format: "jwk" }) as Record<string, unknown>;

  return {
    publicKeyPem,
    publicJwk: {
      ...jwk,
      kid: params.kid,
      use: "sig",
      alg: toJwtAlg(params.algorithm),
    },
  };
}

export function signJwt(params: {
  payload: Record<string, unknown>;
  privateKeyPem: string;
  kid: string;
  algorithm: "ES256" | "RS256" | "EDDSA";
  typ?: string;
}): string {
  const jwtAlg = toJwtAlg(params.algorithm);
  const header = {
    alg: jwtAlg,
    typ: params.typ ?? "JWT",
    kid: params.kid,
  };
  const headerB64 = Buffer.from(JSON.stringify(header), "utf8").toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(params.payload), "utf8").toString("base64url");
  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, "utf8");
  const privateKey = createPrivateKey(params.privateKeyPem);

  let signature: Buffer;
  if (jwtAlg === "ES256") {
    signature = cryptoSign("sha256", signingInput, {
      key: privateKey,
      dsaEncoding: "ieee-p1363",
    });
  } else if (jwtAlg === "RS256") {
    signature = cryptoSign("RSA-SHA256", signingInput, privateKey);
  } else {
    signature = cryptoSign(null, signingInput, privateKey);
  }

  return `${headerB64}.${payloadB64}.${signature.toString("base64url")}`;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signingInput: Buffer;
  signature: Buffer;
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) {
    return null;
  }
  try {
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    if (!header || typeof header !== "object" || !payload || typeof payload !== "object") {
      return null;
    }
    return {
      header,
      payload,
      signingInput: Buffer.from(`${headerB64}.${payloadB64}`, "utf8"),
      signature: Buffer.from(sigB64, "base64url"),
    };
  } catch {
    return null;
  }
}

export function verifyJwtSignature(
  decoded: DecodedJwt,
  publicKeyInput: string | Record<string, unknown>,
  expectedAlg?: SupportedJwtAlg,
): boolean {
  const alg = typeof decoded.header.alg === "string" ? decoded.header.alg : "";
  if (expectedAlg && alg !== expectedAlg) {
    return false;
  }
  if (alg !== "ES256" && alg !== "RS256" && alg !== "EdDSA") {
    return false;
  }

  try {
    const publicKey =
      typeof publicKeyInput === "string"
        ? createPublicKey(publicKeyInput)
        : createPublicKey({
            key: publicKeyInput as JsonWebKey,
            format: "jwk",
          });

    if (alg === "ES256") {
      return cryptoVerify(
        "sha256",
        decoded.signingInput,
        { key: publicKey, dsaEncoding: "ieee-p1363" },
        decoded.signature,
      );
    }
    if (alg === "RS256") {
      return cryptoVerify("RSA-SHA256", decoded.signingInput, publicKey, decoded.signature);
    }
    return cryptoVerify(null, decoded.signingInput, publicKey, decoded.signature);
  } catch {
    return false;
  }
}
