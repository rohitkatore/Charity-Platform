const { Router } = require("express");
const { createSubscriber, findUserByEmail } = require("../../data/store");
const {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  hashPassword,
  verifyPassword,
} = require("../../services/auth.service");
const { requireAuth } = require("../../middleware/requireAuth");
const { setUserCharityPreference } = require("../../services/charity.service");
const { MIN_CHARITY_CONTRIBUTION_PERCENTAGE } = require("../../config/constants");
const { createRateLimiter } = require("../../middleware/rateLimiter");

const authRouter = Router();

const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxAttempts: 5 });
const signupRateLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxAttempts: 10 });

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

authRouter.post("/signup", signupRateLimiter, async (req, res) => {
  const { email, password, charityId, contributionPercentage } = req.body || {};
  if (!email || !password || !charityId || contributionPercentage === undefined) {
    return res.status(400).json({ error: "Email, password, charityId, and contributionPercentage are required" });
  }

  // Validate email type and length (mirrors login validation)
  if (typeof email !== "string" || email.length > 254) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const numericContribution = Number(contributionPercentage);
  if (!Number.isFinite(numericContribution) || numericContribution < MIN_CHARITY_CONTRIBUTION_PERCENTAGE) {
    return res.status(400).json({ error: `Contribution percentage must be at least ${MIN_CHARITY_CONTRIBUTION_PERCENTAGE}%` });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const user = createSubscriber({ email, passwordHash });
  const charityPreference = setUserCharityPreference({
    userId: user.id,
    charityId,
    contributionPercentage: numericContribution,
  });
  const token = signAuthToken(user);
  setAuthCookie(res, token);

  return res.status(201).json({
    user: serializeUser(user),
    subscription: null,
    charityPreference,
  });
});

authRouter.post("/login", loginRateLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (typeof email !== "string" || email.length > 254) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  return res.json({
    user: serializeUser(user),
  });
});

authRouter.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.status(204).send();
});

authRouter.get("/session", requireAuth, (req, res) => {
  return res.json({
    user: serializeUser(req.auth.user),
    subscription: req.auth.subscription,
  });
});

module.exports = { authRouter };