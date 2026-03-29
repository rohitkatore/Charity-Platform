const { Router } = require("express");
const { env } = require("../../config/env");
const { getStripeClient, handleStripeWebhookEvent } = require("../../services/stripe.service");

const stripeWebhookRouter = Router();

stripeWebhookRouter.post("/", async (req, res, next) => {
  try {
    if (!env.stripeWebhookSecret) {
      return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured" });
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);

    await handleStripeWebhookEvent(event);

    return res.status(200).json({ received: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = { stripeWebhookRouter };
