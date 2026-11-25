import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { isIP } from "node:net";
import { BadRequestException } from "@nestjs/common";
import { getEnv, type AppEnv } from "../config/env.js";

function derivePaymentsCipherKey(env: AppEnv): Buffer {
  const material =
    env.PAYMENTS_ENCRYPTION_KEY ?? `scace-payments:${env.BETTER_AUTH_SECRET}`;
  return createHash("sha256").update(material).digest();
}

export function encryptPaymentSecret(plaintext: string): string {
  const env = getEnv();
  const key = derivePaymentsCipherKey(env);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("scace-payments-v1", "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPaymentSecret(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported payment secret ciphertext format.");
  }
  const [, ivHex, tagHex, dataHex] = parts;
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Malformed payment secret ciphertext.");
  }
  const env = getEnv();
  const key = derivePaymentsCipherKey(env);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAAD(Buffer.from("scace-payments-v1", "utf8"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function maskSecretTail(
  raw: string | null | undefined,
  visibleChars = 4,
): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length <= visibleChars) {
    return "****";
  }
  return `****${trimmed.slice(-visibleChars)}`;
}

export function normalizeKenyanPhoneNumber(rawPhone: string): string {
  const cleaned = rawPhone.trim().replace(/[\s().-]/g, "").replace(/^\+/, "");

  let normalized = cleaned;
  if (/^0[17]\d{8}$/.test(cleaned)) {
    normalized = `254${cleaned.slice(1)}`;
  } else if (/^[17]\d{8}$/.test(cleaned)) {
    normalized = `254${cleaned}`;
  }

  if (!/^254[17]\d{8}$/.test(normalized)) {
    throw new BadRequestException(
      "Phone number must be a valid Kenyan M-Pesa number (e.g., 2547XXXXXXXX, 2541XXXXXXXX, or 07XXXXXXXX).",
    );
  }

  return normalized;
}

export function formatDarajaTimestamp(date = new Date()): string {
  // Safaricom Daraja expects East Africa Time (UTC+3) YYYYMMDDHHmmss
  const eatMs = date.getTime() + 3 * 3_600_000;
  const eat = new Date(eatMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${eat.getUTCFullYear()}${pad(eat.getUTCMonth() + 1)}${pad(
    eat.getUTCDate(),
  )}${pad(eat.getUTCHours())}${pad(eat.getUTCMinutes())}${pad(
    eat.getUTCSeconds(),
  )}`;
}

export function generateDarajaStkPassword(
  businessShortCode: string,
  passkey: string,
  timestamp: string,
): string {
  return Buffer.from(`${businessShortCode}${passkey}${timestamp}`, "utf8").toString(
    "base64",
  );
}

export function centsToDarajaWholeAmount(amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 100) {
    throw new BadRequestException(
      "M-Pesa STK Push requires an amount of at least 100 cents (1.00 KES).",
    );
  }
  if (amountCents % 100 !== 0) {
    throw new BadRequestException(
      "M-Pesa STK Push amount must be in whole shilling increments (multiple of 100 cents).",
    );
  }
  return amountCents / 100;
}

export function parseDarajaAmountToCents(rawAmount: number | string): number {
  const num = typeof rawAmount === "number" ? rawAmount : Number(String(rawAmount).trim());
  if (!Number.isFinite(num) || num <= 0) {
    throw new BadRequestException("Invalid M-Pesa transaction amount.");
  }
  return Math.round(num * 100);
}

export function parseDarajaTransactionDate(
  rawDate: number | string | undefined,
): Date | null {
  if (rawDate === undefined || rawDate === null) {
    return null;
  }
  const str = String(rawDate).trim();
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(str);
  if (!match) {
    return null;
  }
  const [, y, m, d, hh, mm, ss] = match;
  // Convert EAT (UTC+3) to UTC Date
  const utcMs = Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh) - 3,
    Number(mm),
    Number(ss),
  );
  const parsed = new Date(utcMs);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function sanitizeDarajaAccountReference(reference: string): string {
  const cleaned = reference
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "");
  return (cleaned || "PAYMENT").slice(0, 12);
}

export function validateIpAllowlistEntries(entries: readonly string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const raw of entries) {
    const entry = raw.trim();
    if (!entry) {
      continue;
    }

    if (entry.includes("/")) {
      const parts = entry.split("/");
      const baseIp = parts[0]?.trim() ?? "";
      const bitsRaw = parts[1]?.trim() ?? "";
      const bits = Number(bitsRaw);
      if (
        parts.length !== 2 ||
        isIP(baseIp) !== 4 ||
        !Number.isInteger(bits) ||
        bits < 0 ||
        bits > 32
      ) {
        throw new BadRequestException(
          `Invalid IPv4 CIDR entry "${entry}" in M-Pesa callback IP allowlist.`,
        );
      }
    } else if (!isIP(entry)) {
      throw new BadRequestException(
        `Invalid IP address "${entry}" in M-Pesa callback IP allowlist.`,
      );
    }

    if (!seen.has(entry)) {
      seen.add(entry);
      normalized.push(entry);
    }
  }

  return normalized;
}
