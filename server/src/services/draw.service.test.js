const test = require("node:test");
const assert = require("node:assert/strict");
const { createSubscriber, saveSubscription, resetStore } = require("../data/store");
const { PLANS, SUBSCRIPTION_STATUS } = require("../config/constants");
const { addScore } = require("./score.service");
const { publishDraw, simulateDraw } = require("./draw.service");

function seedActiveSubscriber({ email, scoreValues }) {
  const user = createSubscriber({ email, passwordHash: "hash" });
  saveSubscription({
    id: `sub_${user.id}`,
    userId: user.id,
    planId: PLANS.monthly.id,
    status: SUBSCRIPTION_STATUS.active,
    renewalDate: "2099-01-01T00:00:00.000Z",
    cancelledAt: null,
    lapsedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  scoreValues.forEach((value, index) => {
    addScore(user.id, {
      scoreValue: value,
      scoreDate: `2026-01-${String(index + 1).padStart(2, "0")}`,
    });
  });

  return user;
}

test.beforeEach(() => {
  resetStore();
});

test("monthly cadence: cannot publish same month twice", () => {
  seedActiveSubscriber({ email: "cadence@example.com", scoreValues: [1, 2, 3, 4, 5] });

  const first = publishDraw({
    drawMonth: "2026-06",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 5],
  });
  assert.equal(first.status, "published");

  assert.throws(
    () =>
      publishDraw({
        drawMonth: "2026-06",
        logicMode: "random",
        fixedDrawNumbers: [6, 7, 8, 9, 10],
      }),
    /already published/i
  );
});

test("split rewards equally among multiple winners in same tier", () => {
  seedActiveSubscriber({ email: "split1@example.com", scoreValues: [1, 2, 3, 4, 20] });
  seedActiveSubscriber({ email: "split2@example.com", scoreValues: [1, 2, 3, 4, 30] });

  const result = publishDraw({
    drawMonth: "2026-07",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 45],
  });

  const fourTierWinners = result.participants.filter((item) => item.tier === 4);
  assert.equal(fourTierWinners.length, 2);
  assert.equal(fourTierWinners[0].winningAmount, fourTierWinners[1].winningAmount);

  const expectedPerWinner = (2 * 0.35) / 2;
  assert.equal(fourTierWinners[0].winningAmount, expectedPerWinner);
});

test("jackpot rollover carries to next month when no 5-match winner", () => {
  seedActiveSubscriber({ email: "rollover@example.com", scoreValues: [1, 2, 3, 4, 5] });

  const monthOne = publishDraw({
    drawMonth: "2026-08",
    logicMode: "random",
    fixedDrawNumbers: [10, 11, 12, 13, 14],
  });

  assert.equal(monthOne.winnerSummary[5].length, 0);
  assert.equal(monthOne.prizePool.rolloverOut, 0.4);

  const monthTwoSimulation = simulateDraw({
    drawMonth: "2026-09",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 5],
  });
  assert.equal(monthTwoSimulation.prizePool.rolloverIn, 0.4);

  const monthTwo = publishDraw({
    drawMonth: "2026-09",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 5],
  });

  assert.equal(monthTwo.winnerSummary[5].length, 1);
  assert.equal(monthTwo.prizePool.rolloverIn, 0.4);
  assert.equal(monthTwo.prizePool.rolloverOut, 0);
  assert.equal(monthTwo.prizePool.perWinner[5], 0.8);
});