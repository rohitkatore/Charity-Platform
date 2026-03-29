const { Router } = require("express");
const { USER_ROLES } = require("../../config/constants");
const { requireAuth } = require("../../middleware/requireAuth");
const { requireRole } = require("../../middleware/requireRole");
const {
  searchAndFilterCharities,
  createCharityRecord,
  updateCharityRecord,
  deleteCharityRecord,
} = require("../../services/charity.service");
const {
  simulateDraw,
  publishDraw,
  getPublishedDrawHistory,
} = require("../../services/draw.service");
const {
  listAdminWinners,
  reviewWinnerProof,
  markWinnerPaid,
} = require("../../services/winner.service");
const {
  listUsersForAdmin,
  updateUserProfileByAdmin,
  listUserScoresByAdmin,
  upsertUserScoreByAdmin,
  updateUserSubscriptionByAdmin,
  getAdminReports,
} = require("../../services/admin.service");
const { sendDrawResultNotifications } = require("../../services/notification.service");

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole([USER_ROLES.admin]));

adminRouter.get("/users", (req, res) => {
  return res.json({ users: listUsersForAdmin() });
});

adminRouter.patch("/users/:userId", (req, res, next) => {
  try {
    const user = updateUserProfileByAdmin({
      userId: req.params.userId,
      email: req.body?.email,
    });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/users/:userId/scores", (req, res, next) => {
  try {
    const scores = listUserScoresByAdmin(req.params.userId);
    return res.json({ scores });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/users/:userId/scores", (req, res, next) => {
  try {
    const scores = upsertUserScoreByAdmin({
      userId: req.params.userId,
      scoreValue: req.body?.scoreValue,
      scoreDate: req.body?.scoreDate,
    });
    return res.status(201).json({ scores });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:userId/scores/:scoreId", (req, res, next) => {
  try {
    const scores = upsertUserScoreByAdmin({
      userId: req.params.userId,
      scoreId: req.params.scoreId,
      scoreValue: req.body?.scoreValue,
      scoreDate: req.body?.scoreDate,
    });
    return res.json({ scores });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:userId/subscription", (req, res, next) => {
  try {
    const subscription = updateUserSubscriptionByAdmin({
      userId: req.params.userId,
      status: req.body?.status,
      renewalDate: req.body?.renewalDate,
      planId: req.body?.planId,
    });
    return res.json({ subscription });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/charities", (req, res) => {
  const charities = searchAndFilterCharities({
    search: req.query.search,
    featured: req.query.featured,
  });
  return res.json({ charities });
});

adminRouter.post("/charities", (req, res, next) => {
  try {
    const charity = createCharityRecord(req.body || {});
    return res.status(201).json({ charity });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/charities/:charityId", (req, res, next) => {
  try {
    const charity = updateCharityRecord(req.params.charityId, req.body || {});
    return res.json({ charity });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/charities/:charityId", (req, res, next) => {
  try {
    deleteCharityRecord(req.params.charityId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/draws", (req, res) => {
  return res.json({ draws: getPublishedDrawHistory() });
});

adminRouter.post("/draws/simulate", (req, res, next) => {
  try {
    const draw = simulateDraw({
      drawMonth: req.body?.drawMonth,
      logicMode: req.body?.logicMode,
      algorithmWeight: req.body?.algorithmWeight,
      fixedDrawNumbers: req.body?.fixedDrawNumbers,
    });
    return res.json({ draw });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/draws/publish", (req, res, next) => {
  try {
    const draw = publishDraw({
      drawMonth: req.body?.drawMonth,
      logicMode: req.body?.logicMode,
      algorithmWeight: req.body?.algorithmWeight,
      fixedDrawNumbers: req.body?.fixedDrawNumbers,
    });

    sendDrawResultNotifications(draw).catch(() => null);
    return res.status(201).json({ draw });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/winners", (req, res) => {
  return res.json({ winners: listAdminWinners() });
});

adminRouter.post("/winners/:winnerId/review", (req, res, next) => {
  try {
    const winner = reviewWinnerProof({
      winnerId: req.params.winnerId,
      decision: req.body?.decision,
      note: req.body?.note,
    });
    return res.json({ winner });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/winners/:winnerId/payment", (req, res, next) => {
  try {
    if (String(req.body?.state || "").toLowerCase() !== "paid") {
      return res.status(400).json({ error: "Only paid state transition is supported" });
    }

    const winner = markWinnerPaid({ winnerId: req.params.winnerId });
    return res.json({ winner });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/reports", (req, res) => {
  return res.json({ report: getAdminReports() });
});

module.exports = { adminRouter };