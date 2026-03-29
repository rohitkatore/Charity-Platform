const { Router } = require("express");
const { PLANS } = require("../../config/constants");
const { requireAuth } = require("../../middleware/requireAuth");
const {
  createOrActivateSubscription,
  cancelSubscription,
  renewSubscription,
  applyRealtimeStatusCheck,
} = require("../../services/subscription.service");
const { createBillingIntent } = require("../../services/billing.service");
const { sendSystemUpdateEmail } = require("../../services/notification.service");

const subscriptionRouter = Router();

// Cache for Stripe prices to avoid excessive API calls
let cachedPlans = null;
let cachedPlansAt = 0;
const PLANS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchStripePrices() {
  const now = Date.now();
  if (cachedPlans && now - cachedPlansAt < PLANS_CACHE_TTL_MS) {
    return cachedPlans;
  }

  const { env } = require("../../config/env");
  const plans = Object.values(PLANS).map((plan) => ({ ...plan }));

  // Try to fetch actual prices from Stripe
  if (env.stripeSecretKey) {
    try {
      const Stripe = require("stripe");
      const stripe = new Stripe(env.stripeSecretKey, { timeout: 5000, maxNetworkRetries: 1 });

      const priceIds = {
        monthly: env.stripePriceMonthly,
        yearly: env.stripePriceYearly,
      };

      for (const plan of plans) {
        const priceId = priceIds[plan.id];
        if (priceId) {
          try {
            const price = await stripe.prices.retrieve(priceId);
            plan.amount = price.unit_amount ? price.unit_amount / 100 : null;
            plan.currency = price.currency || "usd";
            plan.interval = price.recurring?.interval || plan.cycle;
          } catch {
            // Keep null amount if price fetch fails
          }
        }
      }
    } catch {
      // Keep existing plan data if Stripe is unavailable
    }
  }

  cachedPlans = plans;
  cachedPlansAt = now;
  return plans;
}

subscriptionRouter.get("/plans", async (req, res) => {
  try {
    const plans = await fetchStripePrices();
    res.json({ plans });
  } catch {
    res.json({ plans: Object.values(PLANS) });
  }
});

subscriptionRouter.get("/status", requireAuth, (req, res) => {
  const latest = applyRealtimeStatusCheck(req.auth.subscription);
  res.json({ subscription: latest });
});

subscriptionRouter.post("/start", requireAuth, async (req, res, next) => {
  const { planId } = req.body || {};
  if (!planId || !PLANS[planId]) {
    return res.status(400).json({ error: "Valid planId is required (monthly/yearly)" });
  }

  try {
    const billing = await createBillingIntent({
      userId: req.auth.user.id,
      planId,
    });

    const subscription = createOrActivateSubscription({
      userId: req.auth.user.id,
      planId,
    });

    sendSystemUpdateEmail({
      userEmail: req.auth.user.email,
      action: "Subscription Started",
      details: `Plan: ${planId}\nStatus: ${subscription.status}\nRenewal Date: ${subscription.renewalDate}`,
    }).catch(() => null);

    return res.status(201).json({
      subscription,
      billing,
    });
  } catch (error) {
    return next(error);
  }
});

subscriptionRouter.post("/cancel", requireAuth, (req, res) => {
  const subscription = cancelSubscription({ userId: req.auth.user.id });
  if (!subscription) {
    return res.status(404).json({ error: "No subscription found" });
  }

  sendSystemUpdateEmail({
    userEmail: req.auth.user.email,
    action: "Subscription Cancelled",
    details: `Status: ${subscription.status}`,
  }).catch(() => null);

  return res.json({ subscription });
});

subscriptionRouter.post("/renew", requireAuth, (req, res) => {
  const subscription = renewSubscription({ userId: req.auth.user.id });
  if (!subscription) {
    return res.status(404).json({ error: "No subscription found" });
  }

  sendSystemUpdateEmail({
    userEmail: req.auth.user.email,
    action: "Subscription Renewal",
    details: `Status: ${subscription.status}\nRenewal Date: ${subscription.renewalDate}`,
  }).catch(() => null);

  return res.json({ subscription });
});

module.exports = { subscriptionRouter };