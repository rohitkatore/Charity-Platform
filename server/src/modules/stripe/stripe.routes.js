const { Router } = require("express");
const { requireAuth } = require("../../middleware/requireAuth");
const {
  createCheckoutSession,
  confirmCheckoutSessionForUser,
  cancelStripeSubscriptionAtPeriodEnd,
} = require("../../services/stripe.service");

const stripeRouter = Router();

stripeRouter.post("/create-checkout-session", requireAuth, async (req, res, next) => {
  try {
    const plan = req.body?.plan;
    const session = await createCheckoutSession({
      userId: req.auth.user.id,
      userEmail: req.auth.user.email,
      plan,
    });

    return res.status(201).json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return next(error);
  }
});

stripeRouter.post("/cancel-subscription", requireAuth, async (req, res, next) => {
  try {
    const result = await cancelStripeSubscriptionAtPeriodEnd({
      userId: req.auth.user.id,
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

stripeRouter.post("/confirm-checkout-session", requireAuth, async (req, res, next) => {
  try {
    const subscription = await confirmCheckoutSessionForUser({
      sessionId: req.body?.sessionId,
      userId: req.auth.user.id,
    });

    return res.json({ subscription });
  } catch (error) {
    return next(error);
  }
});

module.exports = { stripeRouter };
