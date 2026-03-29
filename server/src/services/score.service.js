const { listScoresByUserId, replaceScoresForUser, newId } = require("../data/store");

function parseScoreDate(dateInput) {
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function validateScoreInput({ scoreValue, scoreDate }) {
  const numericScore = Number(scoreValue);
  if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 45) {
    const error = new Error("Score must be between 1 and 45");
    error.status = 400;
    throw error;
  }

  // Stableford scores are always whole numbers — reject decimals.
  if (!Number.isInteger(numericScore)) {
    const error = new Error("Score must be a whole number (Stableford format)");
    error.status = 400;
    throw error;
  }

  if (!scoreDate) {
    const error = new Error("Score date is required");
    error.status = 400;
    throw error;
  }

  const normalizedDate = parseScoreDate(scoreDate);
  if (!normalizedDate) {
    const error = new Error("Score date must be a valid date");
    error.status = 400;
    throw error;
  }

  // Reject future dates — a score cannot be played in the future.
  const today = new Date().toISOString().slice(0, 10);
  if (normalizedDate > today) {
    const error = new Error("Score date cannot be in the future");
    error.status = 400;
    throw error;
  }

  return {
    scoreValue: numericScore,
    scoreDate: normalizedDate,
  };
}

function sortReverseChronological(scores) {
  return [...scores].sort((a, b) => {
    if (a.scoreDate !== b.scoreDate) {
      return b.scoreDate.localeCompare(a.scoreDate);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function enforceRollingLimit(scores) {
  if (scores.length <= 5) {
    return scores;
  }

  // Remove oldest stored entry by score date, then by creation timestamp.
  const oldestFirst = [...scores].sort((a, b) => {
    if (a.scoreDate !== b.scoreDate) {
      return a.scoreDate.localeCompare(b.scoreDate);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });

  return oldestFirst.slice(oldestFirst.length - 5);
}

function listScores(userId) {
  return sortReverseChronological(listScoresByUserId(userId));
}

function addScore(userId, payload) {
  const validated = validateScoreInput(payload);
  const current = listScoresByUserId(userId);
  const now = new Date().toISOString();

  const nextScore = {
    id: newId("scr"),
    userId,
    scoreValue: validated.scoreValue,
    scoreDate: validated.scoreDate,
    createdAt: now,
    updatedAt: now,
  };

  const limited = enforceRollingLimit(current.concat(nextScore));
  replaceScoresForUser(userId, limited);
  return sortReverseChronological(limited);
}

function editScore(userId, scoreId, payload) {
  const validated = validateScoreInput(payload);
  const current = listScoresByUserId(userId);
  const target = current.find((item) => item.id === scoreId);
  if (!target) {
    const error = new Error("Score not found");
    error.status = 404;
    throw error;
  }

  const updated = current.map((item) => {
    if (item.id !== scoreId) {
      return item;
    }

    return {
      ...item,
      scoreValue: validated.scoreValue,
      scoreDate: validated.scoreDate,
      updatedAt: new Date().toISOString(),
    };
  });

  replaceScoresForUser(userId, updated);
  return sortReverseChronological(updated);
}

module.exports = {
  listScores,
  addScore,
  editScore,
  validateScoreInput,
  sortReverseChronological,
  enforceRollingLimit,
};