import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { BadRequestException } from "@nestjs/common";
import { getEnv, type AppEnv } from "../config/env.js";

function deriveCipherKey(env: AppEnv): Buffer {
  const material = env.CRM_ENCRYPTION_KEY ?? `scace-crm:${env.BETTER_AUTH_SECRET}`;
  return createHash("sha256").update(material).digest();
}

export function encryptCrmSecret(plaintext: string): string {
  const env = getEnv();
  const key = deriveCipherKey(env);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("scace-crm-v1", "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptCrmSecret(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported CRM secret ciphertext format.");
  }
  const [, ivHex, tagHex, dataHex] = parts;
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Malformed CRM secret ciphertext.");
  }
  const env = getEnv();
  const key = deriveCipherKey(env);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAAD(Buffer.from("scace-crm-v1", "utf8"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function maskSecretTail(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  return trimmed.slice(-4);
}

function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isBlockedIpAddress(
  ip: string,
  allowPrivateUrls: boolean,
): { blocked: boolean; reason?: string } {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const mappedV4 = normalized.startsWith("::ffff:")
    ? normalized.slice(7)
    : normalized;

  const version = isIP(mappedV4);
  if (version === 4) {
    const n = ipv4ToInt(mappedV4);
    const inRange = (cidrBase: string, bits: number) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(cidrBase) & mask);
    };

    // Always block link-local / cloud metadata and unspecified/broadcast addresses
    if (inRange("169.254.0.0", 16) || inRange("0.0.0.0", 8)) {
      return { blocked: true, reason: "Link-local and metadata IPs are forbidden." };
    }

    if (!allowPrivateUrls) {
      if (
        inRange("127.0.0.0", 8) ||
        inRange("10.0.0.0", 8) ||
        inRange("172.16.0.0", 12) ||
        inRange("192.168.0.0", 16) ||
        inRange("100.64.0.0", 10)
      ) {
        return {
          blocked: true,
          reason: "Loopback and private network IP addresses are not allowed.",
        };
      }
    }
    return { blocked: false };
  }

  if (version === 6) {
    if (
      normalized === "::" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    ) {
      return { blocked: true, reason: "Link-local IPv6 addresses are forbidden." };
    }
    if (!allowPrivateUrls) {
      if (
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd")
      ) {
        return {
          blocked: true,
          reason: "Loopback and private IPv6 addresses are not allowed.",
        };
      }
    }
    return { blocked: false };
  }

  return { blocked: false };
}

export function validateCustomerMatesBaseUrl(
  rawUrl: string,
  allowPrivateUrls: boolean,
  sandboxMode = false,
): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new BadRequestException("Invalid CustomerMates baseUrl.");
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException(
      "CustomerMates baseUrl must not contain embedded credentials.",
    );
  }
  if (parsed.search || parsed.hash) {
    throw new BadRequestException(
      "CustomerMates baseUrl must not contain query parameters or fragments.",
    );
  }

  const allowedProtocols =
    allowPrivateUrls || sandboxMode ? ["https:", "http:"] : ["https:"];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new BadRequestException(
      allowPrivateUrls || sandboxMode
        ? "CustomerMates baseUrl must use https:// or http://."
        : "CustomerMates baseUrl must use https://.",
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new BadRequestException("CustomerMates baseUrl must include a hostname.");
  }

  if (
    hostname === "metadata.google.internal" ||
    hostname === "metadata" ||
    hostname.endsWith(".internal")
  ) {
    if (!allowPrivateUrls || hostname.includes("metadata")) {
      throw new BadRequestException(
        "Internal metadata hostnames are not permitted for CustomerMates baseUrl.",
      );
    }
  }

  if (!sandboxMode) {
    if (
      !allowPrivateUrls &&
      (hostname === "localhost" || hostname.endsWith(".localhost"))
    ) {
      throw new BadRequestException(
        "Localhost URLs are not permitted unless CRM_ALLOW_PRIVATE_URLS=true or sandboxMode=true.",
      );
    }

    if (isIP(hostname.replace(/^\[|\]$/g, ""))) {
      const check = isBlockedIpAddress(hostname, allowPrivateUrls);
      if (check.blocked) {
        throw new BadRequestException(check.reason ?? "Blocked CustomerMates IP.");
      }
    }
  }

  const cleanPath = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${cleanPath === "/" ? "" : cleanPath}`;
}

export async function assertSafeResolvedTarget(
  baseUrl: string,
  allowPrivateUrls: boolean,
): Promise<void> {
  const parsed = new URL(baseUrl);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname)) {
    const check = isBlockedIpAddress(hostname, allowPrivateUrls);
    if (check.blocked) {
      throw new BadRequestException(check.reason ?? "Blocked target IP.");
    }
    return;
  }

  if (!allowPrivateUrls && (hostname === "localhost" || hostname.endsWith(".localhost"))) {
    throw new BadRequestException("Localhost targets are not permitted.");
  }

  try {
    const records = await lookup(hostname, { all: true });
    for (const record of records) {
      const check = isBlockedIpAddress(record.address, allowPrivateUrls);
      if (check.blocked) {
        throw new BadRequestException(
          check.reason ?? "CustomerMates hostname resolves to a restricted IP.",
        );
      }
    }
  } catch (err) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    // DNS failures will surface cleanly on the subsequent fetch attempt
  }
}

export function verifyHmacSha256Signature(
  rawBody: Buffer,
  secret: string,
  signatureHeader: string | undefined,
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const trimmed = signatureHeader.trim();
  let candidateHex = trimmed;

  if (trimmed.includes("v1=")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    const v1 = parts.find((p) => p.startsWith("v1="));
    if (!v1) {
      return false;
    }
    candidateHex = v1.slice(3);
  } else if (trimmed.startsWith("sha256=")) {
    candidateHex = trimmed.slice(7);
  }

  if (!/^[a-fA-F0-9]{64}$/.test(candidateHex)) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const actual = Buffer.from(candidateHex, "hex");
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
