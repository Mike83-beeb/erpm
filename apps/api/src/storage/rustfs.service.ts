import { createHash, createHmac } from "node:crypto";
import { Readable } from "node:stream";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { getEnv, type AppEnv } from "../config/env.js";

interface MockStoredEntry {
  body: Buffer;
  contentType: string;
  etag: string;
  sizeBytes: number;
  lastModified: Date;
}

export interface HeadObjectResult {
  sizeBytes: number;
  etag: string | null;
  contentType: string | null;
}

export interface GetObjectResult {
  body: Readable | Buffer;
  contentType: string;
  contentLength: number;
  etag: string | null;
}

function isS3ConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    cause?: unknown;
    $metadata?: { httpStatusCode?: number };
  };

  if (err.$metadata?.httpStatusCode !== undefined) {
    return false;
  }

  const code = typeof err.code === "string" ? err.code : "";
  const name = typeof err.name === "string" ? err.name : "";
  const message = typeof err.message === "string" ? err.message : "";

  if (
    [
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNRESET",
      "EAI_AGAIN",
      "EPIPE",
      "ERR_INVALID_URL",
    ].includes(code) ||
    name === "TimeoutError" ||
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("socket hang up") ||
    message.includes("connect ETIMEDOUT")
  ) {
    return true;
  }

  return err.cause ? isS3ConnectionError(err.cause) : false;
}

function isS3NotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as {
    name?: unknown;
    code?: unknown;
    $metadata?: { httpStatusCode?: number };
  };
  const status = err.$metadata?.httpStatusCode;
  const name = typeof err.name === "string" ? err.name : "";
  const code = typeof err.code === "string" ? err.code : "";
  return (
    status === 404 ||
    name === "NotFound" ||
    name === "NoSuchBucket" ||
    name === "NoSuchKey" ||
    code === "NotFound" ||
    code === "NoSuchBucket" ||
    code === "NoSuchKey"
  );
}

function isBucketAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as {
    name?: unknown;
    code?: unknown;
    $metadata?: { httpStatusCode?: number };
  };
  const status = err.$metadata?.httpStatusCode;
  const name = typeof err.name === "string" ? err.name : "";
  const code = typeof err.code === "string" ? err.code : "";
  return (
    status === 409 ||
    name === "BucketAlreadyOwnedByYou" ||
    name === "BucketAlreadyExists" ||
    code === "BucketAlreadyOwnedByYou" ||
    code === "BucketAlreadyExists"
  );
}

@Injectable()
export class RustfsService {
  private readonly logger = new Logger(RustfsService.name);
  private readonly env: AppEnv;
  private readonly internalClient: S3Client | null;
  private readonly presignClient: S3Client | null;
  private readonly mockBuckets = new Map<string, Map<string, MockStoredEntry>>();
  private useMock: boolean;

  constructor() {
    this.env = getEnv();

    if (!this.env.RUSTFS_ACCESS_KEY || !this.env.RUSTFS_SECRET_KEY) {
      this.logger.warn(
        "[AI Studio] RUSTFS_ACCESS_KEY/RUSTFS_SECRET_KEY not configured — using in-memory RustFS mock",
      );
      this.useMock = true;
      this.internalClient = null;
      this.presignClient = null;
      return;
    }

    this.useMock = false;
    const credentials = {
      accessKeyId: this.env.RUSTFS_ACCESS_KEY,
      secretAccessKey: this.env.RUSTFS_SECRET_KEY,
    };

    this.internalClient = new S3Client({
      region: this.env.RUSTFS_REGION,
      endpoint: this.env.RUSTFS_ENDPOINT,
      forcePathStyle: true,
      credentials,
      maxAttempts: 2,
    });

    this.presignClient = new S3Client({
      region: this.env.RUSTFS_REGION,
      endpoint: this.env.RUSTFS_PUBLIC_ENDPOINT,
      forcePathStyle: true,
      credentials,
      maxAttempts: 2,
    });
  }

  private switchToMock(reason?: string): void {
    if (!this.useMock) {
      this.useMock = true;
      this.logger.warn(
        `[AI Studio] RustFS unreachable${reason ? ` (${reason})` : ""} — falling back to in-memory object store`,
      );
    }
  }

  private getOrCreateMockBucket(bucket: string): Map<string, MockStoredEntry> {
    let entries = this.mockBuckets.get(bucket);
    if (!entries) {
      entries = new Map<string, MockStoredEntry>();
      this.mockBuckets.set(bucket, entries);
    }
    return entries;
  }

  private assertSafeBucketAndKey(bucket: string, key?: string): void {
    if (!bucket || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
      throw new Error("Invalid organization bucket identifier.");
    }
    if (key !== undefined) {
      if (!key || key.startsWith("/") || key.includes("..") || key.includes("\0")) {
        throw new Error("Invalid object key.");
      }
    }
  }

  async ping(): Promise<boolean> {
    if (this.useMock || !this.internalClient) {
      return true;
    }

    try {
      await this.internalClient.send(new ListBucketsCommand({}));
      return true;
    } catch (error) {
      if (isS3ConnectionError(error)) {
        this.switchToMock(error instanceof Error ? error.message : undefined);
        return true;
      }
      throw error;
    }
  }

  async ensureBucket(bucket: string): Promise<void> {
    this.assertSafeBucketAndKey(bucket);

    if (this.useMock || !this.internalClient) {
      this.getOrCreateMockBucket(bucket);
      return;
    }

    try {
      await this.internalClient.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (isS3ConnectionError(error)) {
        this.switchToMock(error instanceof Error ? error.message : undefined);
        this.getOrCreateMockBucket(bucket);
        return;
      }

      if (!isS3NotFoundError(error)) {
        throw error;
      }

      try {
        await this.internalClient.send(new CreateBucketCommand({ Bucket: bucket }));
      } catch (createError) {
        if (isS3ConnectionError(createError)) {
          this.switchToMock(
            createError instanceof Error ? createError.message : undefined,
          );
          this.getOrCreateMockBucket(bucket);
          return;
        }
        if (!isBucketAlreadyExistsError(createError)) {
          throw createError;
        }
      }
    }
  }

  async putObject(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<{ etag: string; sizeBytes: number }> {
    this.assertSafeBucketAndKey(bucket, key);
    await this.ensureBucket(bucket);

    if (this.useMock || !this.internalClient) {
      const store = this.getOrCreateMockBucket(bucket);
      const etag = `"${createHash("md5").update(body).digest("hex")}"`;
      store.set(key, {
        body: Buffer.from(body),
        contentType,
        etag,
        sizeBytes: body.byteLength,
        lastModified: new Date(),
      });
      return { etag, sizeBytes: body.byteLength };
    }

    try {
      const result = await this.internalClient.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.byteLength,
        }),
      );
      return {
        etag:
          result.ETag ?? `"${createHash("md5").update(body).digest("hex")}"`,
        sizeBytes: body.byteLength,
      };
    } catch (error) {
      if (isS3ConnectionError(error)) {
        this.switchToMock(error instanceof Error ? error.message : undefined);
        return this.putObject(bucket, key, body, contentType);
      }
      throw error;
    }
  }

  async headObject(bucket: string, key: string): Promise<HeadObjectResult> {
    this.assertSafeBucketAndKey(bucket, key);

    if (this.useMock || !this.internalClient) {
      const entry = this.mockBuckets.get(bucket)?.get(key);
      if (!entry) {
        throw new NotFoundException("Stored object payload not found in bucket.");
      }
      return {
        sizeBytes: entry.sizeBytes,
        etag: entry.etag,
        contentType: entry.contentType,
      };
    }

    try {
      const head = await this.internalClient.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      return {
        sizeBytes: Number(head.ContentLength ?? 0),
        etag: head.ETag ?? null,
        contentType: head.ContentType ?? null,
      };
    } catch (error) {
      if (isS3ConnectionError(error)) {
        this.switchToMock(error instanceof Error ? error.message : undefined);
        return this.headObject(bucket, key);
      }
      if (isS3NotFoundError(error)) {
        throw new NotFoundException("Stored object payload not found in bucket.");
      }
      throw error;
    }
  }

  async getObjectStream(bucket: string, key: string): Promise<GetObjectResult> {
    this.assertSafeBucketAndKey(bucket, key);

    if (this.useMock || !this.internalClient) {
      const entry = this.mockBuckets.get(bucket)?.get(key);
      if (!entry) {
        throw new NotFoundException("Stored object payload not found in bucket.");
      }
      return {
        body: entry.body,
        contentType: entry.contentType,
        contentLength: entry.sizeBytes,
        etag: entry.etag,
      };
    }

    try {
      const obj = await this.internalClient.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      if (!obj.Body) {
        throw new NotFoundException("Stored object body is empty.");
      }
      const stream =
        obj.Body instanceof Readable
          ? obj.Body
          : Readable.fromWeb(obj.Body.transformToWebStream() as never);
      return {
        body: stream,
        contentType: obj.ContentType ?? "application/octet-stream",
        contentLength: Number(obj.ContentLength ?? 0),
        etag: obj.ETag ?? null,
      };
    } catch (error) {
      if (isS3ConnectionError(error)) {
        this.switchToMock(error instanceof Error ? error.message : undefined);
        return this.getObjectStream(bucket, key);
      }
      if (isS3NotFoundError(error)) {
        throw new NotFoundException("Stored object payload not found in bucket.");
      }
      throw error;
    }
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    this.assertSafeBucketAndKey(bucket, key);

    if (this.useMock || !this.internalClient) {
      this.mockBuckets.get(bucket)?.delete(key);
      return;
    }

    try {
      await this.internalClient.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (error) {
      if (isS3ConnectionError(error)) {
        this.switchToMock(error instanceof Error ? error.message : undefined);
        this.mockBuckets.get(bucket)?.delete(key);
        return;
      }
      if (!isS3NotFoundError(error)) {
        throw error;
      }
    }
  }

  async createPresignedPutUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresSeconds: number,
  ): Promise<string> {
    this.assertSafeBucketAndKey(bucket, key);
    await this.ensureBucket(bucket);

    if (this.useMock || !this.presignClient) {
      return this.buildMockPresignedUrl("PUT", bucket, key, expiresSeconds);
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.presignClient, command, {
      expiresIn: expiresSeconds,
    });
  }

  async createPresignedGetUrl(
    bucket: string,
    key: string,
    contentDisposition: string,
    expiresSeconds: number,
  ): Promise<string> {
    this.assertSafeBucketAndKey(bucket, key);

    if (this.useMock || !this.presignClient) {
      return this.buildMockPresignedUrl("GET", bucket, key, expiresSeconds);
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition,
    });

    return getSignedUrl(this.presignClient, command, {
      expiresIn: expiresSeconds,
    });
  }

  private buildMockPresignedUrl(
    method: "GET" | "PUT",
    bucket: string,
    key: string,
    expiresSeconds: number,
  ): string {
    const base = this.env.RUSTFS_PUBLIC_ENDPOINT.replace(/\/+$/, "");
    const encodedKey = key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const expiresAt = Math.floor(Date.now() / 1000) + expiresSeconds;
    const signature = createHmac("sha256", this.env.BETTER_AUTH_SECRET)
      .update(`${method}:${bucket}/${key}:${expiresAt}`)
      .digest("hex")
      .slice(0, 32);

    return `${base}/${encodeURIComponent(bucket)}/${encodedKey}?X-Scace-Mode=memory-mock&X-Scace-Method=${method}&X-Scace-Expires=${expiresAt}&X-Scace-Sig=${signature}`;
  }
}
