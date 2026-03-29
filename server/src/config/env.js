const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  databaseProvider: String(process.env.DATABASE_PROVIDER || "sqlite").toLowerCase(),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseDbUrl: process.env.SUPABASE_DB_URL || "",
  apiPort: Number(process.env.API_PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtCookieName: process.env.JWT_COOKIE_NAME || "gcs_auth",
  jwtCookieSameSite: String(process.env.JWT_COOKIE_SAME_SITE || "lax").toLowerCase(),
  jwtCookieDomain: process.env.JWT_COOKIE_DOMAIN || "",
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

if (!["lax", "strict", "none"].includes(env.jwtCookieSameSite)) {
  throw new Error("JWT_COOKIE_SAME_SITE must be one of: lax, strict, none");
}

if (env.nodeEnv === "production" && env.jwtCookieSameSite === "none" && !env.secureCookies) {
  throw new Error("JWT_COOKIE_SAME_SITE=none requires secure cookies in production");
}

if (!["sqlite", "supabase"].includes(env.databaseProvider)) {
  throw new Error("DATABASE_PROVIDER must be either sqlite or supabase");
}

if (env.databaseProvider === "supabase" && (!env.supabaseUrl || !env.supabaseServiceRoleKey)) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DATABASE_PROVIDER=supabase");
}

// Prevent default admin credentials from being used in production.
if (env.nodeEnv === "production" && env.autoSeedAdmin && env.adminSeedPassword === "AdminPass123!") {
  throw new Error("ADMIN_SEED_PASSWORD must be changed from the default value in production");
}

module.exports = { env };