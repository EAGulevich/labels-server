import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://b1c78f4a9154e2a76ba78fce86a0e96a@o4509418889216000.ingest.de.sentry.io/4509418893410384",
  environment: process.env.NODE_ENV,
  normalizeDepth: 10,
  _experiments: {
    enableLogs: true,
  },
});
