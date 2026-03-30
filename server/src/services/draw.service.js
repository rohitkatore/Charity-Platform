const {
  DRAW_LOGIC_MODE,
  DRAW_ALGORITHM_WEIGHT,
  DRAW_MATCH_TIERS,
  DRAW_TIER_PERCENTAGES,
  DRAW_POOL_UNITS_PER_ACTIVE_SUBSCRIBER,
} = require("../config/constants");
const {
  listActiveSubscribers,
  listScoresByUserId,
  findPublishedDrawByMonth,
  listPublishedDraws,
  savePublishedDraw,
  getDrawRolloverBalance,
  setDrawRolloverBalance,
  newId,
} = require("../data/store");
const { createWinnerRecordsFromDraw } = require("./winner.service");

function normalizeDrawMonth(drawMonth) {
  if (!/^\d{4}-\d{2}$/.test(String(drawMonth || ""))) {
    const error = new Error("drawMonth must be in YYYY-MM format");
    error.status = 400;
    throw error;
  }

  const [year, month] = String(drawMonth).split("-").map(Number);
  if (!year || month < 1 || month > 12) {
    const error = new Error("drawMonth must be a valid calendar month");
    error.status = 400;
    throw error;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function normalizeLogicMode(logicMode) {
  const mode = String(logicMode || DRAW_LOGIC_MODE.random);
  if (!Object.values(DRAW_LOGIC_MODE).includes(mode)) {
    const error = new Error("logicMode must be random or algorithmic");
    error.status = 400;
    throw error;
  }

  return mode;
}

function normalizeAlgorithmWeight(algorithmWeight) {
  const weight = String(algorithmWeight || DRAW_ALGORITHM_WEIGHT.mostFrequent);
  if (!Object.values(DRAW_ALGORITHM_WEIGHT).includes(weight)) {
    const error = new Error("algorithmWeight must be most-frequent or least-frequent");
    error.status = 400;
    throw error;
  }

  return weight;
}

function getParticipantNumbers(userId) {
  const scores = listScoresByUserId(userId);
  if (scores.length !== 5) {
    return null;
  }
  return [...new Set(scores.map((item) => Number(item.scoreValue)).filter((item) => Number.isFinite(item)))];
}

function buildFrequencyMap(activeSubscribers) {
  const frequency = new Map();
  for (const subscriber of activeSubscribers) {
    const numbers = getParticipantNumbers(subscriber.id);
    if (!numbers || numbers.length === 0) {
      continue;
    }
    for (const value of numbers) {
      const key = Number(value);
      frequency.set(key, (frequency.get(key) || 0) + 1);
    }
  }

  return frequency;
}

function drawWeightedUniqueNumbers({ weightMode, frequencyMap, count = 5, min = 1, max = 45 }) {
  const selected = [];
  const candidates = [];

  for (let value = min; value <= max; value += 1) {
    candidates.push(value);
  }

  const frequencies = candidates.map((value) => frequencyMap.get(value) || 0);
  const maxFrequency = Math.max(...frequencies, 0);

  while (selected.length < count && candidates.length > 0) {
    const weights = candidates.map((value) => {
      const freq = frequencyMap.get(value) || 0;
      if (weightMode === DRAW_ALGORITHM_WEIGHT.leastFrequent) {
        return maxFrequency - freq + 1;
      }

      return freq + 1;
    });

    const totalWeight = weights.reduce((sum, item) => sum + item, 0);
    let threshold = Math.random() * totalWeight;
    let pickedIndex = 0;

    for (let i = 0; i < candidates.length; i += 1) {
      threshold -= weights[i];
      if (threshold <= 0) {
        pickedIndex = i;
        break;
      }
    }

    selected.push(candidates[pickedIndex]);
    candidates.splice(pickedIndex, 1);
  }

  return selected.sort((a, b) => a - b);
}

function drawRandomUniqueNumbers({ count = 5, min = 1, max = 45 }) {
  const selected = new Set();
  while (selected.size < count) {
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    selected.add(value);
  }

  return [...selected].sort((a, b) => a - b);
}

function computeMatchTier(matchCount) {
  if (matchCount === DRAW_MATCH_TIERS.five) {
    return DRAW_MATCH_TIERS.five;
  }
  if (matchCount === DRAW_MATCH_TIERS.four) {
    return DRAW_MATCH_TIERS.four;
  }
  if (matchCount === DRAW_MATCH_TIERS.three) {
    return DRAW_MATCH_TIERS.three;
  }
  return null;
}

function computePrizePools(activeSubscriberCount, rolloverIn) {
  const totalPool = activeSubscriberCount * DRAW_POOL_UNITS_PER_ACTIVE_SUBSCRIBER;
  const tierBase = {
    [DRAW_MATCH_TIERS.five]: totalPool * DRAW_TIER_PERCENTAGES[DRAW_MATCH_TIERS.five],
    [DRAW_MATCH_TIERS.four]: totalPool * DRAW_TIER_PERCENTAGES[DRAW_MATCH_TIERS.four],
    [DRAW_MATCH_TIERS.three]: totalPool * DRAW_TIER_PERCENTAGES[DRAW_MATCH_TIERS.three],
  };

  return {
    totalPool,
    rolloverIn,
    tierBase,
  };
}

function allocateWinnings({ winnersByTier, pools }) {
  const tierFiveWinners = winnersByTier[DRAW_MATCH_TIERS.five].length;
  const tierFourWinners = winnersByTier[DRAW_MATCH_TIERS.four].length;
  const tierThreeWinners = winnersByTier[DRAW_MATCH_TIERS.three].length;

  const tier5Available = pools.tierBase[DRAW_MATCH_TIERS.five] + pools.rolloverIn;
  const tier4Available = pools.tierBase[DRAW_MATCH_TIERS.four];
  const tier3Available = pools.tierBase[DRAW_MATCH_TIERS.three];

  const perWinner = {
    [DRAW_MATCH_TIERS.five]: tierFiveWinners > 0 ? tier5Available / tierFiveWinners : 0,
    [DRAW_MATCH_TIERS.four]: tierFourWinners > 0 ? tier4Available / tierFourWinners : 0,
    [DRAW_MATCH_TIERS.three]: tierThreeWinners > 0 ? tier3Available / tierThreeWinners : 0,
  };

  const rolloverOut = tierFiveWinners > 0 ? 0 : tier5Available;

  return {
    perWinner,
    rolloverOut,
    tierAvailable: {
      [DRAW_MATCH_TIERS.five]: tier5Available,
      [DRAW_MATCH_TIERS.four]: tier4Available,
      [DRAW_MATCH_TIERS.three]: tier3Available,
    },
  };
}

function evaluateParticipants(drawNumbers, participants) {
  const drawnSet = new Set(drawNumbers);
  const winnersByTier = {
    [DRAW_MATCH_TIERS.five]: [],
    [DRAW_MATCH_TIERS.four]: [],
    [DRAW_MATCH_TIERS.three]: [],
  };

  const rows = participants.map((participant) => {
    const matches = participant.numbers.filter((value) => drawnSet.has(value));
    const tier = computeMatchTier(matches.length);

    const row = {
      userId: participant.userId,
      numbers: participant.numbers,
      matches,
      matchCount: matches.length,
      tier,
      winningAmount: 0,
    };

    if (tier) {
      winnersByTier[tier].push(row);
    }

    return row;
  });

  return { rows, winnersByTier };
}

function runDraw({ drawMonth, logicMode, algorithmWeight, fixedDrawNumbers }) {
  const activeSubscribers = listActiveSubscribers();
  const participants = activeSubscribers.map((subscriber) => ({
    userId: subscriber.id,
    numbers: getParticipantNumbers(subscriber.id),
  })).filter((participant) => Array.isArray(participant.numbers) && participant.numbers.length > 0);

  const frequencyMap = buildFrequencyMap(activeSubscribers);
  const drawNumbers = Array.isArray(fixedDrawNumbers) && fixedDrawNumbers.length === 5
    ? [...new Set(fixedDrawNumbers.map(Number))].slice(0, 5).sort((a, b) => a - b)
    : logicMode === DRAW_LOGIC_MODE.algorithmic
      ? drawWeightedUniqueNumbers({ weightMode: algorithmWeight, frequencyMap })
      : drawRandomUniqueNumbers({});

  if (drawNumbers.length !== 5) {
    const error = new Error("Draw must contain exactly 5 unique numbers");
    error.status = 500;
    throw error;
  }

  const evaluated = evaluateParticipants(drawNumbers, participants);
  const pools = computePrizePools(activeSubscribers.length, getDrawRolloverBalance());
  const allocation = allocateWinnings({ winnersByTier: evaluated.winnersByTier, pools });

  const winners = {
    [DRAW_MATCH_TIERS.five]: evaluated.winnersByTier[DRAW_MATCH_TIERS.five].map((item) => item.userId),
    [DRAW_MATCH_TIERS.four]: evaluated.winnersByTier[DRAW_MATCH_TIERS.four].map((item) => item.userId),
    [DRAW_MATCH_TIERS.three]: evaluated.winnersByTier[DRAW_MATCH_TIERS.three].map((item) => item.userId),
  };

  for (const row of evaluated.rows) {
    if (row.tier) {
      row.winningAmount = allocation.perWinner[row.tier];
    }
  }

  return {
    id: newId("draw"),
    drawMonth,
    logicMode,
    algorithmWeight: logicMode === DRAW_LOGIC_MODE.algorithmic ? algorithmWeight : null,
    drawNumbers,
    participants: evaluated.rows,
    winnerSummary: winners,
    prizePool: {
      activeSubscriberCount: activeSubscribers.length,
      totalPool: pools.totalPool,
      tierBase: pools.tierBase,
      tierAvailable: allocation.tierAvailable,
      perWinner: allocation.perWinner,
      rolloverIn: pools.rolloverIn,
      rolloverOut: allocation.rolloverOut,
    },
    audit: {
      frequencyMap: Object.fromEntries([...frequencyMap.entries()].sort((a, b) => a[0] - b[0])),
      generatedAt: new Date().toISOString(),
    },
  };
}

function simulateDraw({ drawMonth, logicMode, algorithmWeight, fixedDrawNumbers }) {
  const normalizedMonth = normalizeDrawMonth(drawMonth);
  const mode = normalizeLogicMode(logicMode);
  const weight = normalizeAlgorithmWeight(algorithmWeight);

  const result = runDraw({
    drawMonth: normalizedMonth,
    logicMode: mode,
    algorithmWeight: weight,
    fixedDrawNumbers,
  });

  return {
    ...result,
    status: "simulation",
    publishedAt: null,
  };
}

function publishDraw({ drawMonth, logicMode, algorithmWeight, fixedDrawNumbers }) {
  const normalizedMonth = normalizeDrawMonth(drawMonth);
  const mode = normalizeLogicMode(logicMode);
  const weight = normalizeAlgorithmWeight(algorithmWeight);

  // Pre-check before expensive computation.
  if (findPublishedDrawByMonth(normalizedMonth)) {
    const error = new Error("Draw already published for this month");
    error.status = 409;
    throw error;
  }

  const result = runDraw({
    drawMonth: normalizedMonth,
    logicMode: mode,
    algorithmWeight: weight,
    fixedDrawNumbers,
  });

  // Wrap the critical persistence section in a transaction to prevent
  // race-condition on concurrent publish requests for the same month.
  const { db } = require("../data/store");
  db.exec("BEGIN IMMEDIATE");

  try {
    // Re-check inside the transaction to prevent TOCTOU race.
    if (findPublishedDrawByMonth(normalizedMonth)) {
      const error = new Error("Draw already published for this month");
      error.status = 409;
      throw error;
    }

    setDrawRolloverBalance(result.prizePool.rolloverOut);
    const published = {
      ...result,
      status: "published",
      publishedAt: new Date().toISOString(),
    };

    savePublishedDraw(published);
    createWinnerRecordsFromDraw(published);
    db.exec("COMMIT");
    return published;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function getPublishedDrawHistory() {
  return listPublishedDraws();
}

function getUserParticipationSummary(userId) {
  const draws = listPublishedDraws();
  const drawsEntered = draws.filter((draw) =>
    (draw.participants || []).some((participant) => participant.userId === userId)
  );

  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const upcomingMonth = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}`;
  const upcomingExists = draws.some((draw) => draw.drawMonth === upcomingMonth);

  return {
    drawsEntered: drawsEntered.length,
    enteredMonths: drawsEntered.map((draw) => draw.drawMonth),
    upcomingDraws: [
      {
        drawMonth: upcomingMonth,
        status: upcomingExists ? "published" : "scheduled",
      },
    ],
  };
}

module.exports = {
  simulateDraw,
  publishDraw,
  getPublishedDrawHistory,
  getUserParticipationSummary,
  normalizeDrawMonth,
  computePrizePools,
  allocateWinnings,
};