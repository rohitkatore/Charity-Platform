const Stripe = require("stripe");
const { env } = require("../config/env");
const {
  findBillingSubscriptionByUserId,
  findBillingSubscriptionByStripeSubscriptionId,
  findBillingSubscriptionByStripeCustomerId,
  saveBillingSubscription,
  findSubscriptionByUserId,
  saveSubscription,
} = require("../data/store");
const { createOrActivateSubscription } = require("./subscription.service");

function getStripeClient() {
  if (!env.stripeSecretKey) {
    const error = new Error("STRIPE_SECRET_KEY is not configured");
    error.status = 500;
    throw error;
  }

  return new Stripe(env.stripeSecretKey, {
    timeout: 10000,
    maxNetworkRetries: 1,
  });
}

function getPriceIdForPlan(plan) {
  if (plan === "monthly") {
    return env.stripePriceMonthly;
  }
  if (plan === "yearly") {
    return env.stripePriceYearly;
  }
  return "";
}

function requirePlan(plan) {
  const normalized = String(plan || "").toLowerCase();
  if (!["monthly", "yearly"].includes(normalized)) {
    const error = new Error("plan must be monthly or yearly");
    error.status = 400;
    throw error;
  }

  const priceId = getPriceIdForPlan(normalized);
  if (!priceId) {
    const error = new Error(`Stripe price is not configured for ${normalized}`);
    error.status = 500;
    throw error;
  }

  return { plan: normalized, priceId };
}

async function ensureStripeCustomer({ stripe, userId, userEmail }) {
  const billing = findBillingSubscriptionByUserId(userId);
  if (billing?.stripeCustomerId) {
    return billing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { userId },
  });

  saveBillingSubscription({
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

async function createCheckoutSession({ userId, userEmail, plan }) {
  const { plan: normalizedPlan, priceId } = requirePlan(plan);
  const stripe = getStripeClient();
  const customerId = await ensureStripeCustomer({ stripe, userId, userEmail });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url: `${env.appBaseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appBaseUrl}/subscribe/cancelled`,
    metadata: {
      userId,
      plan: normalizedPlan,
      priceId,
    },
  });

  return {
    id: session.id,
    url: session.url,
  };
}

async function confirmCheckoutSessionForUser({ sessionId, userId }) {
  const existingSubscription = findSubscriptionByUserId(userId);
  if (existingSubscription?.status === "active") {
    return existingSubscription;
  }

  const stripe = getStripeClient();
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) {
    const error = new Error("sessionId is required");
    error.status = 400;
    throw error;
  }

  const session = await stripe.checkout.sessions.retrieve(normalizedSessionId, {
    expand: ["subscription"],
  });

  if (session.mode !== "subscription") {
    const error = new Error("Checkout session is not a subscription session");
    error.status = 400;
    throw error;
  }

  const metadataUserId = String(session.metadata?.userId || "");
  if (metadataUserId && metadataUserId !== userId) {
    const error = new Error("Checkout session does not belong to current user");
    error.status = 403;
    throw error;
  }

  const stripeSubscriptionId = String(session.subscription?.id || session.subscription || "");
  if (!stripeSubscriptionId) {
    const error = new Error("No Stripe subscription found for checkout session");
    error.status = 400;
    throw error;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const stripePriceId = session.metadata?.priceId
    || stripeSubscription?.items?.data?.[0]?.price?.id
    || null;
  const fallbackPlan = stripePriceId === env.stripePriceYearly ? "yearly" : "monthly";

  const subscription = await updateLocalSubscriptionFromStripe({
    userId,
    stripeCustomerId: String(session.customer || ""),
    stripeSubscriptionId,
    stripePriceId,
    stripeStatus: stripeSubscription.status,
    currentPeriodEnd: getStripeCurrentPeriodEnd(stripeSubscription),
    plan: session.metadata?.plan || fallbackPlan,
    subscriptionAmount: Number(session.amount_total || 0) / 100,
  });

  return subscription;
}

function mapStripeSubscriptionStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["active", "trialing"].includes(normalized)) {
    return "active";
  }
  if (["canceled", "cancelled"].includes(normalized)) {
    return "cancellation";
  }
  if (["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(normalized)) {
    return "lapsed";
  }
  return "active";
}

function toIsoFromUnix(unixSeconds) {
  if (!unixSeconds || !Number.isFinite(Number(unixSeconds))) {
    return null;
  }
  return new Date(Number(unixSeconds) * 1000).toISOString();
}

function getStripeCurrentPeriodEnd(subscription) {
  const rootPeriodEnd = Number(subscription?.current_period_end);
  if (Number.isFinite(rootPeriodEnd) && rootPeriodEnd > 0) {
    return rootPeriodEnd;
  }

  const itemPeriodEnd = Number(subscription?.items?.data?.[0]?.current_period_end);
  if (Number.isFinite(itemPeriodEnd) && itemPeriodEnd > 0) {
    return itemPeriodEnd;
  }

  return null;
}

async function updateLocalSubscriptionFromStripe({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  stripePriceId,
  stripeStatus,
  currentPeriodEnd,
  plan,
  subscriptionAmount,
}) {
  const existing = findSubscriptionByUserId(userId);
  const renewalDate = toIsoFromUnix(currentPeriodEnd)
    || existing?.renewalDate
    || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const status = mapStripeSubscriptionStatus(stripeStatus);
  const planId = plan || existing?.planId || "monthly";

  const next = existing
    ? saveSubscription({
      ...existing,
      planId,
      status,
      renewalDate,
      updatedAt: new Date().toISOString(),
      cancelledAt: status === "cancellation" ? new Date().toISOString() : null,
      lapsedAt: status === "lapsed" ? new Date().toISOString() : null,
    })
    : createOrActivateSubscription({ userId, planId });

  saveBillingSubscription({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId,
    status,
    subscriptionAmount,
    currentPeriodEnd: renewalDate,
  });

  return next;
}

async function handleCheckoutSessionCompleted(event) {
  const stripe = getStripeClient();
  const session = event.data.object;
  const userId = String(session.metadata?.userId || session.client_reference_id || "");
  if (!userId) {
    return;
  }

  const stripeSubscriptionId = String(session.subscription || "");
  if (!stripeSubscriptionId) {
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const subscriptionAmount = Number(session.amount_total || 0) / 100;

  await updateLocalSubscriptionFromStripe({
    userId,
    stripeCustomerId: String(session.customer || ""),
    stripeSubscriptionId,
    stripePriceId: session.metadata?.priceId || stripeSubscription?.items?.data?.[0]?.price?.id || null,
    stripeStatus: stripeSubscription.status,
    currentPeriodEnd: getStripeCurrentPeriodEnd(stripeSubscription),
    plan: session.metadata?.plan || null,
    subscriptionAmount,
  });
}

async function handleSubscriptionUpdated(event) {
  const subscription = event.data.object;
  const stripeSubscriptionId = String(subscription.id || "");
  const stripeCustomerId = String(subscription.customer || "");

  const billing = findBillingSubscriptionByStripeSubscriptionId(stripeSubscriptionId)
    || findBillingSubscriptionByStripeCustomerId(stripeCustomerId);
  if (!billing?.userId) {
    return;
  }

  await updateLocalSubscriptionFromStripe({
    userId: billing.userId,
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId: subscription?.items?.data?.[0]?.price?.id || billing.stripePriceId,
    stripeStatus: subscription.status,
    currentPeriodEnd: getStripeCurrentPeriodEnd(subscription),
    plan: billing.stripePriceId === env.stripePriceYearly ? "yearly" : "monthly",
    subscriptionAmount: billing.subscriptionAmount,
  });
}

async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  const stripeSubscriptionId = String(subscription.id || "");
  const billing = findBillingSubscriptionByStripeSubscriptionId(stripeSubscriptionId);
  if (!billing?.userId) {
    return;
  }

  const current = findSubscriptionByUserId(billing.userId);
  if (current) {
    saveSubscription({
      ...current,
      status: "cancellation",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveBillingSubscription({
    ...billing,
    userId: billing.userId,
    status: "cancellation",
  });
}

async function handleInvoicePaymentFailed(event) {
  const invoice = event.data.object;
  const stripeSubscriptionId = String(invoice.subscription || "");
  const billing = findBillingSubscriptionByStripeSubscriptionId(stripeSubscriptionId);
  if (!billing?.userId) {
    return;
  }

  const current = findSubscriptionByUserId(billing.userId);
  if (current) {
    saveSubscription({
      ...current,
      status: "lapsed",
      lapsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveBillingSubscription({
    ...billing,
    userId: billing.userId,
    status: "lapsed",
  });
}

async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event);
      break;
    default:
      break;
  }
}

async function cancelStripeSubscriptionAtPeriodEnd({ userId }) {
  const stripe = getStripeClient();
  const billing = findBillingSubscriptionByUserId(userId);
  if (!billing?.stripeSubscriptionId) {
    const error = new Error("No active Stripe subscription found");
    error.status = 404;
    throw error;
  }

  await stripe.subscriptions.update(billing.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const current = findSubscriptionByUserId(userId);
  if (current) {
    saveSubscription({
      ...current,
      status: "cancellation",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveBillingSubscription({
    ...billing,
    userId,
    status: "cancellation",
  });

  return { ok: true };
}

module.exports = {
  getStripeClient,
  createCheckoutSession,
  confirmCheckoutSessionForUser,
  cancelStripeSubscriptionAtPeriodEnd,
  handleStripeWebhookEvent,
};
