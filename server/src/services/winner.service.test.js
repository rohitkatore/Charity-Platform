const test = require("node:test");
const assert = require("node:assert/strict");
const { createSubscriber, saveSubscription, resetStore } = require("../data/store");
const { PLANS, SUBSCRIPTION_STATUS } = require("../config/constants");
const { addScore } = require("./score.service");
const { publishDraw } = require("./draw.service");
const {
  listUserWinners,
  uploadWinnerProof,
  reviewWinnerProof,
  markWinnerPaid,
} = require("./winner.service");

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
      scoreDate: `2026-02-${String(index + 1).padStart(2, "0")}`,
    });
  });

  return user;
}

test.beforeEach(() => {
  resetStore();
});

test("eligibility verification applies to winners only and requires winner record", () => {
  const winnerUser = seedActiveSubscriber({ email: "winner@test.com", scoreValues: [1, 2, 3, 4, 5] });
  const nonWinner = seedActiveSubscriber({ email: "nonwinner@test.com", scoreValues: [10, 11, 12, 13, 14] });

  publishDraw({
    drawMonth: "2026-11",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 5],
  });

  const winnerRecords = listUserWinners(winnerUser.id);
  assert.equal(winnerRecords.length, 1);

  assert.throws(
    () => uploadWinnerProof({ userId: nonWinner.id, winnerId: winnerRecords[0].id, proofScreenshot: "proof.png" }),
    /not found for current user/i
  );
});

test("admin review supports approve or reject after proof upload", () => {
  const winnerUser = seedActiveSubscriber({ email: "review@test.com", scoreValues: [1, 2, 3, 4, 5] });

  publishDraw({
    drawMonth: "2026-12",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 5],
  });

  const winner = listUserWinners(winnerUser.id)[0];
  const uploaded = uploadWinnerProof({
    userId: winnerUser.id,
    winnerId: winner.id,
    proofScreenshot: "screenshot-reference",
  });
  assert.equal(uploaded.verificationStatus, "pending");

  const approved = reviewWinnerProof({ winnerId: winner.id, decision: "approved" });
  assert.equal(approved.verificationStatus, "approved");

  const rejected = reviewWinnerProof({ winnerId: winner.id, decision: "rejected" });
  assert.equal(rejected.verificationStatus, "rejected");
});

test("payment state transitions from pending to paid only after approval", () => {
  const winnerUser = seedActiveSubscriber({ email: "paid@test.com", scoreValues: [1, 2, 3, 4, 5] });

  publishDraw({
    drawMonth: "2027-01",
    logicMode: "random",
    fixedDrawNumbers: [1, 2, 3, 4, 5],
  });

  const winner = listUserWinners(winnerUser.id)[0];

  assert.throws(
    () => markWinnerPaid({ winnerId: winner.id }),
    /must be approved/i
  );

  uploadWinnerProof({
    userId: winnerUser.id,
    winnerId: winner.id,
    proofScreenshot: "proof",
  });
  reviewWinnerProof({ winnerId: winner.id, decision: "approved" });

  const paid = markWinnerPaid({ winnerId: winner.id });
  assert.equal(paid.paymentState, "paid");
});