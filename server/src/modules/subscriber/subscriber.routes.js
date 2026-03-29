const { Router } = require("express");
const { USER_ROLES } = require("../../config/constants");
const { requireAuth } = require("../../middleware/requireAuth");
const { requireRole } = require("../../middleware/requireRole");
const { requireActiveSubscription } = require("../../middleware/requireActiveSubscription");
const { findUserByEmail, saveUser } = require("../../data/store");
const { hashPassword, verifyPassword } = require("../../services/auth.service");
const { listScores, addScore, editScore } = require("../../services/score.service");
const { getUserCharityPreference, setUserCharityPreference } = require("../../services/charity.service");
const { listUserWinners, uploadWinnerProof } = require("../../services/winner.service");
const { getUserParticipationSummary } = require("../../services/draw.service");

const subscriberRouter = Router();

subscriberRouter.use(requireAuth, requireRole([USER_ROLES.subscriber]), requireActiveSubscription);

subscriberRouter.get("/access-check", (req, res) => {
  return res.json({
    ok: true,
    message: "Subscriber feature access granted",
  });
});

subscriberRouter.get("/profile", (req, res) => {
  const user = req.auth.user;
  return res.json({
    profile: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

subscriberRouter.patch("/profile", async (req, res, next) => {
  try {
    const user = req.auth.user;
    const currentPassword = req.body?.currentPassword ? String(req.body.currentPassword) : "";
    const nextEmail = req.body?.email ? String(req.body.email).trim().toLowerCase() : user.email;
    const nextPassword = req.body?.password ? String(req.body.password) : "";

    // Require current password for any profile changes
    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required to update profile settings" });
    }

    const passwordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    if (!nextEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const duplicate = findUserByEmail(nextEmail);
    if (duplicate && duplicate.id !== user.id) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const updated = {
      ...user,
      email: nextEmail,
    };

    if (nextPassword) {
      if (nextPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      updated.passwordHash = await hashPassword(nextPassword);
    }

    const saved = saveUser(updated);
    return res.json({
      profile: {
        id: saved.id,
        email: saved.email,
        role: saved.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

subscriberRouter.get("/charity-preference", (req, res) => {
  const preference = getUserCharityPreference(req.auth.user.id);
  return res.json({ preference });
});

subscriberRouter.put("/charity-preference", (req, res, next) => {
  try {
    const preference = setUserCharityPreference({
      userId: req.auth.user.id,
      charityId: req.body?.charityId,
      contributionPercentage: req.body?.contributionPercentage,
    });
    return res.json({ preference });
  } catch (error) {
    return next(error);
  }
});

subscriberRouter.get("/scores", (req, res) => {
  const scores = listScores(req.auth.user.id);
  return res.json({ scores });
});

subscriberRouter.post("/scores", (req, res, next) => {
  try {
    const scores = addScore(req.auth.user.id, req.body || {});
    return res.status(201).json({ scores });
  } catch (error) {
    return next(error);
  }
});

subscriberRouter.patch("/scores/:scoreId", (req, res, next) => {
  try {
    const scores = editScore(req.auth.user.id, req.params.scoreId, req.body || {});
    return res.json({ scores });
  } catch (error) {
    return next(error);
  }
});

subscriberRouter.get("/winners", (req, res) => {
  const winners = listUserWinners(req.auth.user.id);
  return res.json({ winners });
});

subscriberRouter.get("/participation-summary", (req, res) => {
  const summary = getUserParticipationSummary(req.auth.user.id);
  return res.json({ summary });
});

subscriberRouter.post("/winners/:winnerId/proof", (req, res, next) => {
  try {
    const winner = uploadWinnerProof({
      userId: req.auth.user.id,
      winnerId: req.params.winnerId,
      proofScreenshot: req.body?.proofScreenshot,
    });
    return res.json({ winner });
  } catch (error) {
    return next(error);
  }
});

module.exports = { subscriberRouter };