const { SUBSCRIPTION_STATUS } = require("../config/constants");
const {
  listUsers,
  findUserById,
  saveUser,
  listSubscriptions,
  findSubscriptionByUserId,
  saveSubscription,
  listScoresByUserId,
  findScoreById,
  saveScore,
  replaceScoresForUser,
  listPublishedDraws,
  listWinnerRecords,
  listIndependentDonations,
  listCharityPreferences,
  listCharities,
  newId,
} = require("../data/store");
const { validateScoreInput, sortReverseChronological, enforceRollingLimit } = require("./score.service");

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function listUsersForAdmin() {
  const users = listUsers();
  const subscriptions = listSubscriptions();

  return users
    .map((user) => ({
      ...serializeUser(user),
      subscription: subscriptions.find((sub) => sub.userId === user.id) || null,
      scoreCount: listScoresByUserId(user.id).length,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

function updateUserProfileByAdmin({ userId, email }) {
  const user = findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const nextEmail = String(email || "").trim().toLowerCase();
  if (!nextEmail) {
    const error = new Error("Email is required");
    error.status = 400;
    throw error;
  }

  const duplicate = listUsers().find((entry) => entry.email.toLowerCase() === nextEmail && entry.id !== userId);
  if (duplicate) {
    const error = new Error("Email already in use");
    error.status = 409;
    throw error;
  }

  return serializeUser(saveUser({ ...user, email: nextEmail }));
}

function listUserScoresByAdmin(userId) {
  const user = findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return sortReverseChronological(listScoresByUserId(userId));
}

function upsertUserScoreByAdmin({ userId, scoreId, scoreValue, scoreDate }) {
  const user = findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const validated = validateScoreInput({ scoreValue, scoreDate });

  if (scoreId) {
    const score = findScoreById(scoreId);
    if (!score || score.userId !== userId) {
      const error = new Error("Score not found for user");
      error.status = 404;
      throw error;
    }

    saveScore({
      ...score,
      scoreValue: validated.scoreValue,
      scoreDate: validated.scoreDate,
    });

    return sortReverseChronological(listScoresByUserId(userId));
  }

  const now = new Date().toISOString();
  const nextScore = {
    id: newId("scr"),
    userId,
    scoreValue: validated.scoreValue,
    scoreDate: validated.scoreDate,
    createdAt: now,
    updatedAt: now,
  };

  const limited = enforceRollingLimit(listScoresByUserId(userId).concat(nextScore));
  replaceScoresForUser(userId, limited);

  return sortReverseChronological(listScoresByUserId(userId));
}

function updateUserSubscriptionByAdmin({ userId, status, renewalDate, planId }) {
  const user = findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (!Object.values(SUBSCRIPTION_STATUS).includes(status)) {
    const error = new Error("Invalid subscription status");
    error.status = 400;
    throw error;
  }

  const current = findSubscriptionByUserId(userId);
  const now = new Date().toISOString();

  const next = saveSubscription({
    id: current?.id || `sub_${userId}`,
    userId,
    planId: planId || current?.planId || "monthly",
    status,
    renewalDate: renewalDate || current?.renewalDate || new Date().toISOString(),
    cancelledAt: status === SUBSCRIPTION_STATUS.cancellation ? now : null,
    lapsedAt: status === SUBSCRIPTION_STATUS.lapsed ? now : null,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  });

  return next;
}

function getAdminReports() {
  const users = listUsers();
  const draws = listPublishedDraws();
  const winners = listWinnerRecords();
  const donations = listIndependentDonations();
  const preferences = listCharityPreferences();
  const subscriptions = listSubscriptions();
  const charities = listCharities();

  const totalPrizePool = draws.reduce((sum, draw) => sum + Number(draw?.prizePool?.totalPool || 0), 0);
  const charityContributionTotals = {};

  for (const preference of preferences) {
    const subscription = subscriptions.find((item) => item.userId === preference.userId);
    if (!subscription) {
      continue;
    }

    // PRD does not define absolute plan prices; use normalized contribution units.
    const baseUnit = 1;
    const contribution = baseUnit * (Number(preference.contributionPercentage || 0) / 100);
    const charity = charities.find((entry) => entry.id === preference.charityId);
    const key = charity?.name || preference.charityId;
    charityContributionTotals[key] = (charityContributionTotals[key] || 0) + contribution;
  }

  for (const donation of donations) {
    const charity = charities.find((entry) => entry.id === donation.charityId);
    const key = charity?.name || donation.charityId;
    charityContributionTotals[key] = (charityContributionTotals[key] || 0) + Number(donation.amount || 0);
  }

  const drawStatistics = {
    totalDraws: draws.length,
    totalParticipants: draws.reduce((sum, draw) => sum + (draw.participants || []).length, 0),
    totalWinners: winners.length,
    rolloverBalanceCurrent: draws.length ? Number(draws[draws.length - 1]?.prizePool?.rolloverOut || 0) : 0,
  };

  return {
    totalUsers: users.length,
    totalPrizePool,
    charityContributionTotals,
    drawStatistics,
  };
}

module.exports = {
  listUsersForAdmin,
  updateUserProfileByAdmin,
  listUserScoresByAdmin,
  upsertUserScoreByAdmin,
  updateUserSubscriptionByAdmin,
  getAdminReports,
};
