const { env } = require("../config/env");

async function createStripeIntent({ planId, userId }) {
  const Stripe = require("stripe");
  const stripe = new Stripe(env.stripeSecretKey);

  // PRD does not specify plan prices, so placeholder unit amount is used for wiring verification.
  const unitAmountByPlan = {
    monthly: 1000,
    yearly: 10000,
  };

  const paymentIntent = await stripe.paymentIntents.create({
    amount: unitAmountByPlan[planId] || unitAmountByPlan.monthly,
    currency: env.stripeCurrency,
    metadata: {
      userId,
      planId,
    },
    automatic_payment_methods: { enabled: true },
  });

  return {
    provider: "stripe",
    planId,
    userId,
    status: paymentIntent.status,
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
}

async function createBillingIntent({ planId, userId }) {
  if (env.stripeSecretKey) {
    return createStripeIntent({ planId, userId });
  }

  return {
    provider: "stripe-dev-fallback",
    planId,
    userId,
    status: "requires_payment_method",
    id: `billing_${Date.now()}`,
    clientSecret: null,
  };
}

module.exports = { createBillingIntent };