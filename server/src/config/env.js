const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  apiPort: Number(process.env.API_PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtCookieName: process.env.JWT_COOKIE_NAME || "gcs_auth",
  jwtTtl: process.env.JWT_TTL || "8h",
  secureCookies: process.env.NODE_ENV === "production",
  autoSeedDemo: process.env.AUTO_SEED_DEMO === "true",
  autoSeedAdmin: process.env.AUTO_SEED_ADMIN === "true" || process.env.NODE_ENV !== "production",
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || "admin@golfcharity.local",
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || "AdminPass123!",
  enforceHttps: process.env.ENFORCE_HTTPS === "true" || process.env.NODE_ENV === "production",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceMonthly: process.env.STRIPE_PRICE_MONTHLY || "",
  stripePriceYearly: process.env.STRIPE_PRICE_YEARLY || "",
  stripeCurrency: process.env.STRIPE_CURRENCY || "usd",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
};

if (env.nodeEnv === "production" && env.jwtSecret === "change-me-in-production") {
  throw new Error("JWT_SECRET must be configured in production");
}

// Prevent default admin credentials from being used in production.
if (env.nodeEnv === "production" && env.autoSeedAdmin && env.adminSeedPassword === "AdminPass123!") {
  throw new Error("ADMIN_SEED_PASSWORD must be changed from the default value in production");
}

module.exports = { env };