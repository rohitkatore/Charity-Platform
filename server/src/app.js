const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { env } = require("./config/env");
const { publicRouter } = require("./modules/public/public.routes");
const { authRouter } = require("./modules/auth/auth.routes");
const { subscriptionRouter } = require("./modules/subscription/subscription.routes");
const { subscriberRouter } = require("./modules/subscriber/subscriber.routes");
const { adminRouter } = require("./modules/admin/admin.routes");
const { stripeRouter } = require("./modules/stripe/stripe.routes");
const { stripeWebhookRouter } = require("./modules/stripe/stripeWebhook.routes");

function createApp() {
  const app = express();

  const allowedOrigins = String(env.corsOrigin || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (env.enforceHttps) {
    app.use((req, res, next) => {
      const proto = req.headers["x-forwarded-proto"] || req.protocol;
      if (proto !== "https") {
        return res.status(403).json({ error: "HTTPS is required" });
      }
      return next();
    });
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (env.nodeEnv !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    })
  );
  app.use(helmet());
  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/public", publicRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/stripe", stripeRouter);
  app.use("/api/subscriber", subscriberRouter);
  app.use("/api/admin", adminRouter);

  // Global error handler
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Internal server error",
    });
  });

  return app;
}

module.exports = { createApp };