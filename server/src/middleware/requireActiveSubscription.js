const { isSubscriptionActive } = require("../services/subscription.service");

function requireActiveSubscription(req, res, next) {
  if (!isSubscriptionActive(req.auth?.subscription)) {
    return res.status(403).json({
      error: "Restricted: active subscription required",
      subscription: req.auth?.subscription || null,
    });
  }

  return next();
}

module.exports = { requireActiveSubscription };