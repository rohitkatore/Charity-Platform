const {
  WINNER_VERIFICATION_STATUS,
  WINNER_PAYMENT_STATE,
} = require("../config/constants");
const {
  newId,
  createWinnerRecord,
  listWinnerRecords,
  listWinnerRecordsByUserId,
  findWinnerRecordById,
  saveWinnerRecord,
} = require("../data/store");

function listUserWinners(userId) {
  return listWinnerRecordsByUserId(userId).sort((a, b) => b.drawMonth.localeCompare(a.drawMonth));
}

function listAdminWinners() {
  return listWinnerRecords().sort((a, b) => b.drawMonth.localeCompare(a.drawMonth));
}

function createWinnerRecordsFromDraw(draw) {
  const winners = draw.participants.filter((item) => item.tier && item.winningAmount > 0);
  return winners.map((winner) => {
    const record = {
      id: newId("winner"),
      drawId: draw.id,
      drawMonth: draw.drawMonth,
      userId: winner.userId,
      tier: winner.tier,
      winningAmount: winner.winningAmount,
      proofScreenshot: null,
      proofUploadedAt: null,
      verificationStatus: WINNER_VERIFICATION_STATUS.pending,
      verificationReviewedAt: null,
      verificationReviewNote: null,
      paymentState: WINNER_PAYMENT_STATE.pending,
      paymentUpdatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    createWinnerRecord(record);
    return record;
  });
}

function uploadWinnerProof({ userId, winnerId, proofScreenshot }) {
  const record = findWinnerRecordById(winnerId);
  if (!record || record.userId !== userId) {
    const error = new Error("Winner record not found for current user");
    error.status = 404;
    throw error;
  }

  if (!proofScreenshot || String(proofScreenshot).trim().length === 0) {
    const error = new Error("Proof screenshot is required");
    error.status = 400;
    throw error;
  }

  const next = {
    ...record,
    proofScreenshot: String(proofScreenshot).trim(),
    proofUploadedAt: new Date().toISOString(),
    verificationStatus: WINNER_VERIFICATION_STATUS.pending,
    verificationReviewedAt: null,
    verificationReviewNote: null,
    updatedAt: new Date().toISOString(),
  };
  return saveWinnerRecord(next);
}

function reviewWinnerProof({ winnerId, decision, note }) {
  const record = findWinnerRecordById(winnerId);
  if (!record) {
    const error = new Error("Winner record not found");
    error.status = 404;
    throw error;
  }

  if (!record.proofScreenshot) {
    const error = new Error("Cannot review winner before proof upload");
    error.status = 400;
    throw error;
  }

  const normalizedDecision = String(decision || "").toLowerCase();
  if (![WINNER_VERIFICATION_STATUS.approved, WINNER_VERIFICATION_STATUS.rejected].includes(normalizedDecision)) {
    const error = new Error("decision must be approved or rejected");
    error.status = 400;
    throw error;
  }

  const next = {
    ...record,
    verificationStatus: normalizedDecision,
    verificationReviewedAt: new Date().toISOString(),
    verificationReviewNote: note ? String(note) : null,
    updatedAt: new Date().toISOString(),
  };

  if (normalizedDecision === WINNER_VERIFICATION_STATUS.rejected) {
    next.paymentState = WINNER_PAYMENT_STATE.pending;
    next.paymentUpdatedAt = null;
  }

  return saveWinnerRecord(next);
}

function markWinnerPaid({ winnerId }) {
  const record = findWinnerRecordById(winnerId);
  if (!record) {
    const error = new Error("Winner record not found");
    error.status = 404;
    throw error;
  }

  if (record.verificationStatus !== WINNER_VERIFICATION_STATUS.approved) {
    const error = new Error("Winner must be approved before payment can be marked paid");
    error.status = 400;
    throw error;
  }

  const next = {
    ...record,
    paymentState: WINNER_PAYMENT_STATE.paid,
    paymentUpdatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveWinnerRecord(next);
}

module.exports = {
  listUserWinners,
  listAdminWinners,
  createWinnerRecordsFromDraw,
  uploadWinnerProof,
  reviewWinnerProof,
  markWinnerPaid,
};