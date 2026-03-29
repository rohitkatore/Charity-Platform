const { env } = require("../config/env");
const { findUserById, findSubscriptionByUserId } = require("../data/store");
const { verifyAuthToken } = require("../services/auth.service");
const { applyRealtimeStatusCheck } = require("../services/subscription.service");

function requireAuth(req, res, next) {
  const token = req.cookies?.[env.jwtCookieName];
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // Real-time subscription status check on every authenticated request.
    const currentSubscription = findSubscriptionByUserId(user.id);
    const subscription = applyRealtimeStatusCheck(currentSubscription);

    req.auth = {
      user,
      subscription,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired authentication" });
  }
}

module.exports = { requireAuth };