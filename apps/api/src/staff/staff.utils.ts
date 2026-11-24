import { createHash, randomBytes } from "node:crypto";
import { BadRequestException } from "@nestjs/common";

export type WeekdayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface WorkingDayConfig {
  enabled: boolean;
  start: string;
  end: string;
  breakMinutes: number;
}

export type WorkingDaysMap = Record<WeekdayKey, WorkingDayConfig>;

export const WEEKDAY_KEYS: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DEFAULT_WORKING_DAYS: WorkingDaysMap = {
  monday: { enabled: true, start: "09:00", end: "17:00", breakMinutes: 0 },
  tuesday: { enabled: true, start: "09:00", end: "17:00", breakMinutes: 0 },
  wednesday: { enabled: true, start: "09:00", end: "17:00", breakMinutes: 0 },
  thursday: { enabled: true, start: "09:00", end: "17:00", breakMinutes: 0 },
  friday: { enabled: true, start: "09:00", end: "17:00", breakMinutes: 0 },
  saturday: { enabled: false, start: "09:00", end: "17:00", breakMinutes: 0 },
  sunday: { enabled: false, start: "09:00", end: "17:00", breakMinutes: 0 },
};

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function parseTimeToMinutes(hhmm: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!match) {
    throw new BadRequestException(
      `Invalid time format "${hhmm}". Expected HH:MM (24-hour).`,
    );
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function computeDailyShiftMinutes(day: WorkingDayConfig): number {
  if (!day.enabled) {
    return 0;
  }
  const startMin = parseTimeToMinutes(day.start);
  const endMin = parseTimeToMinutes(day.end);
  if (endMin <= startMin) {
    throw new BadRequestException(
      `Shift end time (${day.end}) must be after start time (${day.start}).`,
    );
  }
  const breakMin = Math.max(0, Math.floor(day.breakMinutes || 0));
  return Math.max(0, endMin - startMin - breakMin);
}

export function normalizeWorkingDays(
  raw: unknown,
): WorkingDaysMap {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result = {} as WorkingDaysMap;

  for (const key of WEEKDAY_KEYS) {
    const fallback = DEFAULT_WORKING_DAYS[key];
    const candidate = source[key];
    if (!candidate || typeof candidate !== "object") {
      result[key] = { ...fallback };
      continue;
    }
    const c = candidate as Record<string, unknown>;
    const normalized: WorkingDayConfig = {
      enabled: typeof c.enabled === "boolean" ? c.enabled : fallback.enabled,
      start: typeof c.start === "string" ? c.start : fallback.start,
      end: typeof c.end === "string" ? c.end : fallback.end,
      breakMinutes:
        typeof c.breakMinutes === "number" && Number.isFinite(c.breakMinutes)
          ? Math.max(0, Math.floor(c.breakMinutes))
          : fallback.breakMinutes,
    };
    if (normalized.enabled) {
      computeDailyShiftMinutes(normalized);
    }
    result[key] = normalized;
  }

  return result;
}

export function computeWeeklyCapacityMinutes(
  workingDays: WorkingDaysMap,
): number {
  let total = 0;
  for (const key of WEEKDAY_KEYS) {
    total += computeDailyShiftMinutes(workingDays[key]);
  }
  return total;
}

export function normalizeUtcDate(input: string | Date): Date {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new BadRequestException("Invalid date value.");
    }
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
    );
  }

  const trimmed = input.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (
      dt.getUTCFullYear() !== year ||
      dt.getUTCMonth() !== month - 1 ||
      dt.getUTCDate() !== day
    ) {
      throw new BadRequestException(`Invalid calendar date: ${input}`);
    }
    return dt;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid date: ${input}`);
  }
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
}

export function formatUtcDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function enumerateUtcDates(
  from: Date,
  to: Date,
  maxDays = 366,
): Date[] {
  const start = normalizeUtcDate(from);
  const end = normalizeUtcDate(to);
  if (end.getTime() < start.getTime()) {
    throw new BadRequestException("End date cannot precede start date.");
  }

  const days = Math.floor(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  ) + 1;

  if (days > maxDays) {
    throw new BadRequestException(
      `Date range cannot exceed ${maxDays} days (requested ${days} days).`,
    );
  }

  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
  }
  return dates;
}

export async function assertNoHierarchyCycle(
  nodeId: string,
  nextParentId: string | null | undefined,
  getParentId: (id: string) => Promise<string | null>,
  label: string,
): Promise<void> {
  if (!nextParentId) {
    return;
  }
  if (nextParentId === nodeId) {
    throw new BadRequestException(`${label} cannot report to itself.`);
  }

  const visited = new Set<string>([nodeId]);
  let cursor: string | null = nextParentId;
  let depth = 0;

  while (cursor && depth < 100) {
    if (visited.has(cursor)) {
      throw new BadRequestException(
        `Circular ${label.toLowerCase()} hierarchy detected.`,
      );
    }
    visited.add(cursor);
    cursor = await getParentId(cursor);
    depth += 1;
  }
}

export function hashCalendarToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateCalendarToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: hashCalendarToken(rawToken),
  };
}

export function escapeIcalText(value: string): string {
  return value
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function formatIcalDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function formatIcalDateTimeUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

export function foldIcalLine(line: string): string {
  const clean = line.replace(/\r?\n/g, " ");
  if (clean.length <= 75) {
    return clean;
  }
  const chunks: string[] = [];
  let offset = 0;
  while (offset < clean.length) {
    const maxLen = offset === 0 ? 75 : 74;
    const part = clean.slice(offset, offset + maxLen);
    chunks.push(offset === 0 ? part : ` ${part}`);
    offset += maxLen;
  }
  return chunks.join("\r\n");
}
