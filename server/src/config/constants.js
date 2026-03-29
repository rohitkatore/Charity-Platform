const USER_ROLES = {
  subscriber: "subscriber",
  admin: "admin",
};

const SUBSCRIPTION_STATUS = {
  active: "active",
  renewal: "renewal",
  cancellation: "cancellation",
  lapsed: "lapsed",
};

const DRAW_LOGIC_MODE = {
  random: "random",
  algorithmic: "algorithmic",
};

const DRAW_ALGORITHM_WEIGHT = {
  mostFrequent: "most-frequent",
  leastFrequent: "least-frequent",
};

const DRAW_MATCH_TIERS = {
  five: 5,
  four: 4,
  three: 3,
};

const DRAW_TIER_PERCENTAGES = {
  [DRAW_MATCH_TIERS.five]: 0.4,
  [DRAW_MATCH_TIERS.four]: 0.35,
  [DRAW_MATCH_TIERS.three]: 0.25,
};

// PRD does not specify absolute currency values, only active-subscriber based pool logic.
const DRAW_POOL_UNITS_PER_ACTIVE_SUBSCRIBER = 1;

const WINNER_VERIFICATION_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

const WINNER_PAYMENT_STATE = {
  pending: "pending",
  paid: "paid",
};

const PLANS = {
  monthly: {
    id: "monthly",
    name: "Monthly",
    cycle: "monthly",
    discounted: false,
    amount: 9.99,
    currency: "gbp",
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    cycle: "yearly",
    discounted: true,
    amount: 99.99,
    currency: "gbp",
  },
};

const MIN_CHARITY_CONTRIBUTION_PERCENTAGE = 10;

module.exports = {
  USER_ROLES,
  SUBSCRIPTION_STATUS,
  DRAW_LOGIC_MODE,
  DRAW_ALGORITHM_WEIGHT,
  DRAW_MATCH_TIERS,
  DRAW_TIER_PERCENTAGES,
  DRAW_POOL_UNITS_PER_ACTIVE_SUBSCRIBER,
  WINNER_VERIFICATION_STATUS,
  WINNER_PAYMENT_STATE,
  PLANS,
  MIN_CHARITY_CONTRIBUTION_PERCENTAGE,
};