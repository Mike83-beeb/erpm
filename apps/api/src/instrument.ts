import { resolve } from "node:path";
import dotenv from "dotenv";
import * as Sentry from "@sentry/nestjs";
import { getEnv } from "./config/env.js";
import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "./observability/scrubbing.utils.js";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });
dotenv.config();

const env = getEnv();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE ?? undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
    beforeSendTransaction(event) {
      return sanitizeSentryEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      return sanitizeSentryBreadcrumb(breadcrumb);
    },
  });
}

export function isSentryConfigured(): boolean {
  return Boolean(getEnv().SENTRY_DSN && Sentry.getClient());
}
