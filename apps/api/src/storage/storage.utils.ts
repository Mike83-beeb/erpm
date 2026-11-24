import { createHash, randomUUID } from "node:crypto";

export function deriveOrganizationBucketName(
  organizationId: string,
  bucketPrefix = "scace-org-",
): string {
  const cleanPrefix = bucketPrefix
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "");

  const safePrefix = cleanPrefix.length >= 2 ? cleanPrefix : "scace-org-";
  const sanitizedId = organizationId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const hashSuffix = createHash("sha256")
    .update(organizationId)
    .digest("hex")
    .slice(0, 8);

  const candidate = sanitizedId
    ? `${safePrefix}${sanitizedId}-${hashSuffix}`
    : `${safePrefix}${hashSuffix}`;

  const trimmed = candidate.slice(0, 63).replace(/-+$/g, "");
  if (trimmed.length < 3) {
    return `scace-org-${hashSuffix}`;
  }
  return trimmed;
}

export function sanitizeFilename(rawName: string): string {
  const base = rawName.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .replace(/[\x00-\x1f\x7f"\\]/g, "")
    .replace(/\.\.+/g, ".")
    .trim()
    .replace(/^\.+/, "");

  if (!cleaned) {
    return "file";
  }
  return cleaned.slice(0, 200);
}

export function buildOrganizationObjectKey(
  entityType: string,
  originalName: string,
): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = sanitizeFilename(originalName).replace(/[^A-Za-z0-9._-]/g, "_");
  const folder = entityType.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `${folder}/${yyyy}/${mm}/${randomUUID()}-${safeName}`;
}

export function buildContentDisposition(
  filename: string,
  mode: "attachment" | "inline" = "attachment",
): string {
  const safe = sanitizeFilename(filename);
  const asciiFallback = safe.replace(/[^\x20-\x7e]/g, "_").replace(/["\\;]/g, "_");
  const encoded = encodeURIComponent(safe);
  return `${mode}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
