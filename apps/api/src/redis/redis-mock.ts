// MOCKED — in-memory Redis replacement when Redis is not configured
interface StoreEntry {
  value: string;
  expiresAt: number | null;
}

export class MockRedis {
  public status = "ready";
  private readonly store = new Map<string, StoreEntry>();
  private readonly keyPrefix: string;

  constructor(options?: { keyPrefix?: string }) {
    this.keyPrefix = options?.keyPrefix ?? "";
  }

  private prefix(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private isExpired(entry: StoreEntry): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  private getRaw(fullKey: string): string | null {
    const entry = this.store.get(fullKey);
    if (!entry) {
      return null;
    }
    if (this.isExpired(entry)) {
      this.store.delete(fullKey);
      return null;
    }
    return entry.value;
  }

  on(_event: string, _listener: (...args: unknown[]) => void): this {
    return this;
  }

  async connect(): Promise<void> {
    this.status = "ready";
  }

  async quit(): Promise<"OK"> {
    this.status = "end";
    return "OK";
  }

  async ping(): Promise<"PONG"> {
    return "PONG";
  }

  async get(key: string): Promise<string | null> {
    return this.getRaw(this.prefix(key));
  }

  async getdel(key: string): Promise<string | null> {
    const fullKey = this.prefix(key);
    const val = this.getRaw(fullKey);
    if (val !== null) {
      this.store.delete(fullKey);
    }
    return val;
  }

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<"OK"> {
    let expiresAt: number | null = null;
    if (mode && typeof duration === "number") {
      const upperMode = mode.toUpperCase();
      if (upperMode === "EX") {
        expiresAt = Date.now() + duration * 1000;
      } else if (upperMode === "PX") {
        expiresAt = Date.now() + duration;
      }
    }
    this.store.set(this.prefix(key), { value, expiresAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(this.prefix(key))) {
        count += 1;
      }
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const fullKey = this.prefix(key);
    const current = this.getRaw(fullKey);
    const existingEntry = this.store.get(fullKey);
    const next = (current ? Number.parseInt(current, 10) || 0 : 0) + 1;
    this.store.set(fullKey, {
      value: String(next),
      expiresAt: existingEntry?.expiresAt ?? null,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const fullKey = this.prefix(key);
    const val = this.getRaw(fullKey);
    if (val === null) {
      return 0;
    }
    this.store.set(fullKey, {
      value: val,
      expiresAt: Date.now() + seconds * 1000,
    });
    return 1;
  }

  async scan(
    _cursor: string | number,
    ...args: (string | number)[]
  ): Promise<[string, string[]]> {
    let matchPattern = "*";
    for (let i = 0; i < args.length; i += 1) {
      if (String(args[i]).toUpperCase() === "MATCH" && args[i + 1] !== undefined) {
        matchPattern = String(args[i + 1]);
      }
    }
    const regexStr =
      "^" +
      matchPattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".") +
      "$";
    const regex = new RegExp(regexStr);
    const matched: string[] = [];
    for (const fullKey of this.store.keys()) {
      if (this.getRaw(fullKey) !== null && regex.test(fullKey)) {
        matched.push(
          this.keyPrefix && fullKey.startsWith(this.keyPrefix)
            ? fullKey.slice(this.keyPrefix.length)
            : fullKey,
        );
      }
    }
    return ["0", matched];
  }
}

function isRedisConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as { code?: unknown; name?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const name = typeof err.name === "string" ? err.name : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"].includes(code) ||
    name === "MaxRetriesPerRequestError" ||
    message.includes("ECONNREFUSED") ||
    message.includes("Connection is closed") ||
    message.includes("Reached the max retries")
  );
}

export function createRedisClientWithFallback<TRedis extends object>(
  createReal: () => TRedis,
  options?: { keyPrefix?: string; label?: string },
): TRedis {
  const mock = new MockRedis({ keyPrefix: options?.keyPrefix });
  let real: TRedis | null = null;
  let fallenBack = false;

  try {
    real = createReal();
    const eventEmitter = real as { on?: (event: string, cb: (err: Error) => void) => void };
    eventEmitter.on?.("error", (err: Error) => {
      if (!fallenBack) {
        console.warn(
          `[AI Studio] ${options?.label ?? "Redis"} unavailable (${err.message}) — using in-memory Redis mock`,
        );
        fallenBack = true;
      }
    });
  } catch {
    fallenBack = true;
  }

  return new Proxy(mock as unknown as Record<string | symbol, unknown>, {
    get(_target, prop) {
      if (prop === "status") {
        if (fallenBack || !real) {
          return mock.status;
        }
        return (real as { status?: string }).status ?? "ready";
      }

      if (prop === "on") {
        return (event: string, listener: (...args: unknown[]) => void) => {
          if (real && !fallenBack) {
            (real as { on?: (e: string, l: (...a: unknown[]) => void) => unknown }).on?.(event, listener);
          }
          return mock;
        };
      }

      const mockVal = Reflect.get(mock, prop, mock);
      if (fallenBack || !real) {
        return typeof mockVal === "function" ? mockVal.bind(mock) : mockVal;
      }

      const realVal = Reflect.get(real, prop, real);
      if (typeof realVal === "function") {
        return async (...args: unknown[]) => {
          if (fallenBack) {
            return typeof mockVal === "function" ? mockVal.apply(mock, args) : undefined;
          }
          try {
            return await (realVal as (...a: unknown[]) => Promise<unknown>).apply(real, args);
          } catch (error) {
            if (isRedisConnectionError(error)) {
              if (!fallenBack) {
                fallenBack = true;
                console.warn(
                  `[AI Studio] ${options?.label ?? "Redis"} connection failed — using in-memory Redis mock`,
                );
                try {
                  const quitter = real as { disconnect?: () => void };
                  quitter.disconnect?.();
                } catch {
                  // ignore
                }
              }
              return typeof mockVal === "function" ? mockVal.apply(mock, args) : undefined;
            }
            throw error;
          }
        };
      }
      return realVal;
    },
  }) as unknown as TRedis;
}

