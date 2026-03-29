const { PLANS, SUBSCRIPTION_STATUS } = require("../config/constants");
const { findSubscriptionByUserId, saveSubscription } = require("../data/store");

function addPlanCycle(nowIso, planId) {
  const baseDate = new Date(nowIso);
  if (planId === PLANS.monthly.id) {
    baseDate.setMonth(baseDate.getMonth() + 1);
    return baseDate.toISOString();
  }

  baseDate.setFullYear(baseDate.getFullYear() + 1);
  return baseDate.toISOString();
}

function createOrActivateSubscription({ userId, planId }) {
  const nowIso = new Date().toISOString();
  const renewalDate = addPlanCycle(nowIso, planId);
  const current = findSubscriptionByUserId(userId);

  const next = {
    id: current?.id || `sub_${userId}`,
    userId,
    planId,
    status: SUBSCRIPTION_STATUS.active,
    renewalDate,
    cancelledAt: null,
    lapsedAt: null,
    updatedAt: nowIso,
    createdAt: current?.createdAt || nowIso,
  };

  return saveSubscription(next);
}

function cancelSubscription({ userId }) {
  const current = findSubscriptionByUserId(userId);
  if (!current) {
    return null;
  }

  const nowIso = new Date().toISOString();
  return saveSubscription({
    ...current,
    status: SUBSCRIPTION_STATUS.cancellation,
    cancelledAt: nowIso,
    updatedAt: nowIso,
  });
}

function renewSubscription({ userId }) {
  const current = findSubscriptionByUserId(userId);
  if (!current) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const renewalDate = addPlanCycle(nowIso, current.planId);
  return saveSubscription({
    ...current,
    status: SUBSCRIPTION_STATUS.renewal,
    renewalDate,
    updatedAt: nowIso,
  });
}

function applyRealtimeStatusCheck(subscription) {
  if (!subscription) {
    return null;
  }

  const now = Date.now();
  const renewal = Date.parse(subscription.renewalDate);

  if (subscription.status !== SUBSCRIPTION_STATUS.cancellation && Number.isFinite(renewal) && renewal < now) {
    const nowIso = new Date().toISOString();
    return saveSubscription({
      ...subscription,
      status: SUBSCRIPTION_STATUS.lapsed,
      lapsedAt: nowIso,
      updatedAt: nowIso,
    });
  }

  if (subscription.status === SUBSCRIPTION_STATUS.renewal) {
    return saveSubscription({
      ...subscription,
      status: SUBSCRIPTION_STATUS.active,
      updatedAt: new Date().toISOString(),
    });
  }

  return subscription;
}

function isSubscriptionActive(subscription) {
  return Boolean(subscription && subscription.status === SUBSCRIPTION_STATUS.active);
}

module.exports = {
  createOrActivateSubscription,
  cancelSubscription,
  renewSubscription,
  applyRealtimeStatusCheck,
  isSubscriptionActive,
};