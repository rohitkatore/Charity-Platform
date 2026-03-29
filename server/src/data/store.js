const crypto = require("crypto");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { env } = require("../config/env");
const { USER_ROLES, SUBSCRIPTION_STATUS } = require("../config/constants");

const DEFAULT_CHARITIES = [
  {
    id: "charity_hope_links",
    name: "Hope Links Initiative",
    description: "Placeholder charity profile content for PRD-required directory and profile experience.",
    images: ["placeholder-image-1", "placeholder-image-2"],
    upcomingEvents: ["Placeholder Golf Day Event"],
    isFeatured: true,
  },
  {
    id: "charity_youth_fairway",
    name: "Youth Fairway Foundation",
    description: "Placeholder charity profile content for PRD-required directory and profile experience.",
    images: ["placeholder-image-1"],
    upcomingEvents: ["Placeholder Community Event"],
    isFeatured: false,
  },
];

const dbFilePath = env.nodeEnv === "test"
  ? ":memory:"
  : path.join(__dirname, "../../db/platform.sqlite");

const db = new DatabaseSync(dbFilePath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  renewal_date TEXT NOT NULL,
  cancelled_at TEXT,
  lapsed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score_value INTEGER NOT NULL CHECK(score_value >= 1 AND score_value <= 45),
  score_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS charities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  images_json TEXT NOT NULL,
  upcoming_events_json TEXT NOT NULL,
  is_featured INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS charity_preferences (
  user_id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL,
  contribution_percentage REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS independent_donations (
  id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL,
  donor_email TEXT,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS draw_publications (
  id TEXT PRIMARY KEY,
  draw_month TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS winner_records (
  id TEXT PRIMARY KEY,
  draw_id TEXT NOT NULL,
  draw_month TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tier INTEGER NOT NULL,
  winning_amount REAL NOT NULL,
  proof_screenshot TEXT,
  proof_uploaded_at TEXT,
  verification_status TEXT NOT NULL,
  verification_reviewed_at TEXT,
  verification_review_note TEXT,
  payment_state TEXT NOT NULL,
  payment_updated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  user_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT,
  subscription_amount REAL,
  current_period_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_winner_records_user_id ON winner_records(user_id);
CREATE INDEX IF NOT EXISTS idx_winner_records_draw_id ON winner_records(draw_id);
CREATE INDEX IF NOT EXISTS idx_winner_records_draw_month ON winner_records(draw_month);
CREATE INDEX IF NOT EXISTS idx_charity_preferences_charity_id ON charity_preferences(charity_id);
CREATE INDEX IF NOT EXISTS idx_draw_publications_draw_month ON draw_publications(draw_month);
CREATE INDEX IF NOT EXISTS idx_independent_donations_charity_id ON independent_donations(charity_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_sub_id ON billing_subscriptions(stripe_subscription_id);
`);

function mapUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubscription(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
    lapsedAt: row.lapsed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScore(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    scoreValue: Number(row.score_value),
    scoreDate: row.score_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCharity(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    images: JSON.parse(row.images_json || "[]"),
    upcomingEvents: JSON.parse(row.upcoming_events_json || "[]"),
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCharityPreference(row) {
  if (!row) {
    return null;
  }
  return {
    userId: row.user_id,
    charityId: row.charity_id,
    contributionPercentage: Number(row.contribution_percentage),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDonation(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    charityId: row.charity_id,
    donorEmail: row.donor_email,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapWinnerRecord(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    drawId: row.draw_id,
    drawMonth: row.draw_month,
    userId: row.user_id,
    tier: Number(row.tier),
    winningAmount: Number(row.winning_amount),
    proofScreenshot: row.proof_screenshot,
    proofUploadedAt: row.proof_uploaded_at,
    verificationStatus: row.verification_status,
    verificationReviewedAt: row.verification_reviewed_at,
    verificationReviewNote: row.verification_review_note,
    paymentState: row.payment_state,
    paymentUpdatedAt: row.payment_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBillingSubscription(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status,
    subscriptionAmount: row.subscription_amount === null ? null : Number(row.subscription_amount),
    currentPeriodEnd: row.current_period_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function seedDefaultCharities() {
  const count = db.prepare("SELECT COUNT(1) AS count FROM charities").get().count;
  if (count > 0) {
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO charities (id, name, description, images_json, upcoming_events_json, is_featured, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const charity of DEFAULT_CHARITIES) {
    stmt.run(
      charity.id,
      charity.name,
      charity.description,
      JSON.stringify(charity.images),
      JSON.stringify(charity.upcomingEvents),
      charity.isFeatured ? 1 : 0,
      now,
      now
    );
  }
}

seedDefaultCharities();

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function findUserByEmail(email) {
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(String(email || "").trim());
  return mapUser(row);
}

function findUserById(userId) {
  return mapUser(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
}

function listUsers() {
  const rows = db.prepare("SELECT * FROM users ORDER BY email ASC").all();
  return rows.map(mapUser);
}

function saveUser(updatedUser) {
  const current = findUserById(updatedUser.id);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...updatedUser,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE users
    SET email = ?, password_hash = ?, role = ?, updated_at = ?
    WHERE id = ?
  `).run(next.email, next.passwordHash, next.role, next.updatedAt, next.id);

  return next;
}

function createSubscriber({ email, passwordHash }) {
  const now = new Date().toISOString();
  const user = {
    id: newId("usr"),
    email,
    passwordHash,
    role: USER_ROLES.subscriber,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt);

  return user;
}

function findSubscriptionByUserId(userId) {
  return mapSubscription(db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").get(userId));
}

function listSubscriptions() {
  return db.prepare("SELECT * FROM subscriptions").all().map(mapSubscription);
}

function saveSubscription(subscription) {
  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, renewal_date, cancelled_at, lapsed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      id = excluded.id,
      plan_id = excluded.plan_id,
      status = excluded.status,
      renewal_date = excluded.renewal_date,
      cancelled_at = excluded.cancelled_at,
      lapsed_at = excluded.lapsed_at,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `).run(
    subscription.id,
    subscription.userId,
    subscription.planId,
    subscription.status,
    subscription.renewalDate,
    subscription.cancelledAt || null,
    subscription.lapsedAt || null,
    subscription.createdAt,
    subscription.updatedAt
  );

  return findSubscriptionByUserId(subscription.userId);
}

function listScoresByUserId(userId) {
  return db.prepare("SELECT * FROM scores WHERE user_id = ?").all(userId).map(mapScore);
}

function findScoreById(scoreId) {
  return mapScore(db.prepare("SELECT * FROM scores WHERE id = ?").get(scoreId));
}

function saveScore(updatedScore) {
  const exists = findScoreById(updatedScore.id);
  if (!exists) {
    return null;
  }

  const next = {
    ...exists,
    ...updatedScore,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE scores
    SET user_id = ?, score_value = ?, score_date = ?, created_at = ?, updated_at = ?
    WHERE id = ?
  `).run(next.userId, next.scoreValue, next.scoreDate, next.createdAt, next.updatedAt, next.id);

  return next;
}

function createScore(score) {
  db.prepare(`
    INSERT INTO scores (id, user_id, score_value, score_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(score.id, score.userId, score.scoreValue, score.scoreDate, score.createdAt, score.updatedAt);

  return score;
}

function replaceScoresForUser(userId, scores) {
  db.prepare("DELETE FROM scores WHERE user_id = ?").run(userId);
  const stmt = db.prepare(`
    INSERT INTO scores (id, user_id, score_value, score_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const score of scores) {
    stmt.run(score.id, userId, score.scoreValue, score.scoreDate, score.createdAt, score.updatedAt);
  }
}

function resetStore() {
  db.prepare("DELETE FROM users").run();
  db.prepare("DELETE FROM subscriptions").run();
  db.prepare("DELETE FROM scores").run();
  db.prepare("DELETE FROM charity_preferences").run();
  db.prepare("DELETE FROM independent_donations").run();
  db.prepare("DELETE FROM draw_publications").run();
  db.prepare("DELETE FROM winner_records").run();
  db.prepare("DELETE FROM billing_subscriptions").run();
  db.prepare("DELETE FROM kv_store WHERE key = 'draw_rollover_balance'").run();
}

function findBillingSubscriptionByUserId(userId) {
  return mapBillingSubscription(
    db.prepare("SELECT * FROM billing_subscriptions WHERE user_id = ?").get(userId)
  );
}

function findBillingSubscriptionByStripeSubscriptionId(stripeSubscriptionId) {
  return mapBillingSubscription(
    db.prepare("SELECT * FROM billing_subscriptions WHERE stripe_subscription_id = ?").get(stripeSubscriptionId)
  );
}

function findBillingSubscriptionByStripeCustomerId(stripeCustomerId) {
  return mapBillingSubscription(
    db.prepare("SELECT * FROM billing_subscriptions WHERE stripe_customer_id = ?").get(stripeCustomerId)
  );
}

function saveBillingSubscription(payload) {
  const current = findBillingSubscriptionByUserId(payload.userId);
  const now = new Date().toISOString();
  const next = {
    userId: payload.userId,
    stripeCustomerId: payload.stripeCustomerId || current?.stripeCustomerId || null,
    stripeSubscriptionId: payload.stripeSubscriptionId || current?.stripeSubscriptionId || null,
    stripePriceId: payload.stripePriceId || current?.stripePriceId || null,
    status: payload.status || current?.status || null,
    subscriptionAmount: payload.subscriptionAmount ?? current?.subscriptionAmount ?? null,
    currentPeriodEnd: payload.currentPeriodEnd || current?.currentPeriodEnd || null,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO billing_subscriptions (
      user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
      status, subscription_amount, current_period_end, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_price_id = excluded.stripe_price_id,
      status = excluded.status,
      subscription_amount = excluded.subscription_amount,
      current_period_end = excluded.current_period_end,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `).run(
    next.userId,
    next.stripeCustomerId,
    next.stripeSubscriptionId,
    next.stripePriceId,
    next.status,
    next.subscriptionAmount,
    next.currentPeriodEnd,
    next.createdAt,
    next.updatedAt
  );

  return findBillingSubscriptionByUserId(next.userId);
}

function listActiveSubscribers() {
  const rows = db.prepare(`
    SELECT u.*
    FROM users u
    INNER JOIN subscriptions s ON s.user_id = u.id
    WHERE u.role = ? AND s.status = ?
    ORDER BY u.email ASC
  `).all(USER_ROLES.subscriber, SUBSCRIPTION_STATUS.active);

  return rows.map(mapUser);
}

function findPublishedDrawByMonth(drawMonth) {
  const row = db.prepare("SELECT payload_json FROM draw_publications WHERE draw_month = ?").get(drawMonth);
  if (!row) {
    return null;
  }
  return JSON.parse(row.payload_json);
}

function listPublishedDraws() {
  const rows = db.prepare("SELECT payload_json FROM draw_publications ORDER BY draw_month ASC").all();
  return rows.map((row) => JSON.parse(row.payload_json));
}

function savePublishedDraw(draw) {
  db.prepare(`
    INSERT INTO draw_publications (id, draw_month, payload_json, published_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(draw_month) DO UPDATE SET
      id = excluded.id,
      payload_json = excluded.payload_json,
      published_at = excluded.published_at
  `).run(draw.id, draw.drawMonth, JSON.stringify(draw), draw.publishedAt || new Date().toISOString());

  return draw;
}

function getDrawRolloverBalance() {
  const row = db.prepare("SELECT value FROM kv_store WHERE key = 'draw_rollover_balance'").get();
  return row ? Number(row.value) || 0 : 0;
}

function setDrawRolloverBalance(nextValue) {
  const value = Number(nextValue) || 0;
  db.prepare(`
    INSERT INTO kv_store (key, value)
    VALUES ('draw_rollover_balance', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(value));

  return value;
}

function createWinnerRecord(record) {
  db.prepare(`
    INSERT INTO winner_records (
      id, draw_id, draw_month, user_id, tier, winning_amount, proof_screenshot, proof_uploaded_at,
      verification_status, verification_reviewed_at, verification_review_note, payment_state,
      payment_updated_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.drawId,
    record.drawMonth,
    record.userId,
    record.tier,
    record.winningAmount,
    record.proofScreenshot || null,
    record.proofUploadedAt || null,
    record.verificationStatus,
    record.verificationReviewedAt || null,
    record.verificationReviewNote || null,
    record.paymentState,
    record.paymentUpdatedAt || null,
    record.createdAt,
    record.updatedAt
  );

  return record;
}

function listWinnerRecords() {
  return db.prepare("SELECT * FROM winner_records").all().map(mapWinnerRecord);
}

function listWinnerRecordsByUserId(userId) {
  return db.prepare("SELECT * FROM winner_records WHERE user_id = ?").all(userId).map(mapWinnerRecord);
}

function findWinnerRecordById(winnerId) {
  return mapWinnerRecord(db.prepare("SELECT * FROM winner_records WHERE id = ?").get(winnerId));
}

function saveWinnerRecord(updated) {
  const exists = findWinnerRecordById(updated.id);
  if (!exists) {
    return null;
  }

  db.prepare(`
    UPDATE winner_records
    SET draw_id = ?, draw_month = ?, user_id = ?, tier = ?, winning_amount = ?,
        proof_screenshot = ?, proof_uploaded_at = ?, verification_status = ?, verification_reviewed_at = ?,
        verification_review_note = ?, payment_state = ?, payment_updated_at = ?, created_at = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.drawId,
    updated.drawMonth,
    updated.userId,
    updated.tier,
    updated.winningAmount,
    updated.proofScreenshot || null,
    updated.proofUploadedAt || null,
    updated.verificationStatus,
    updated.verificationReviewedAt || null,
    updated.verificationReviewNote || null,
    updated.paymentState,
    updated.paymentUpdatedAt || null,
    updated.createdAt,
    updated.updatedAt,
    updated.id
  );

  return findWinnerRecordById(updated.id);
}

function listCharities() {
  let rows = db.prepare("SELECT * FROM charities ORDER BY name ASC").all();
  if (rows.length === 0) {
    seedDefaultCharities();
    rows = db.prepare("SELECT * FROM charities ORDER BY name ASC").all();
  }
  return rows.map(mapCharity);
}

function findCharityById(charityId) {
  return mapCharity(db.prepare("SELECT * FROM charities WHERE id = ?").get(charityId));
}

function createCharity(payload) {
  const now = new Date().toISOString();
  const charity = {
    id: newId("charity"),
    name: payload.name,
    description: payload.description,
    images: payload.images || [],
    upcomingEvents: payload.upcomingEvents || [],
    isFeatured: Boolean(payload.isFeatured),
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO charities (id, name, description, images_json, upcoming_events_json, is_featured, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    charity.id,
    charity.name,
    charity.description,
    JSON.stringify(charity.images),
    JSON.stringify(charity.upcomingEvents),
    charity.isFeatured ? 1 : 0,
    charity.createdAt,
    charity.updatedAt
  );

  return charity;
}

function updateCharity(charityId, payload) {
  const charity = findCharityById(charityId);
  if (!charity) {
    return null;
  }

  const next = {
    ...charity,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE charities
    SET name = ?, description = ?, images_json = ?, upcoming_events_json = ?, is_featured = ?, updated_at = ?
    WHERE id = ?
  `).run(
    next.name,
    next.description,
    JSON.stringify(next.images || []),
    JSON.stringify(next.upcomingEvents || []),
    next.isFeatured ? 1 : 0,
    next.updatedAt,
    charityId
  );

  return findCharityById(charityId);
}

function deleteCharity(charityId) {
  // Clean up orphaned charity_preferences referencing this charity.
  db.prepare("DELETE FROM charity_preferences WHERE charity_id = ?").run(charityId);
  const result = db.prepare("DELETE FROM charities WHERE id = ?").run(charityId);
  return result.changes > 0;
}

function findCharityPreferenceByUserId(userId) {
  return mapCharityPreference(
    db.prepare("SELECT * FROM charity_preferences WHERE user_id = ?").get(userId)
  );
}

function listCharityPreferences() {
  return db.prepare("SELECT * FROM charity_preferences").all().map(mapCharityPreference);
}

function saveCharityPreference(preference) {
  db.prepare(`
    INSERT INTO charity_preferences (user_id, charity_id, contribution_percentage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      charity_id = excluded.charity_id,
      contribution_percentage = excluded.contribution_percentage,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `).run(
    preference.userId,
    preference.charityId,
    preference.contributionPercentage,
    preference.createdAt,
    preference.updatedAt
  );

  return findCharityPreferenceByUserId(preference.userId);
}

function createIndependentDonation(donation) {
  const entity = {
    id: newId("donation"),
    ...donation,
    createdAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO independent_donations (id, charity_id, donor_email, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(entity.id, entity.charityId, entity.donorEmail, entity.amount, entity.status, entity.createdAt);

  return entity;
}

function listIndependentDonations() {
  return db.prepare("SELECT * FROM independent_donations").all().map(mapDonation);
}

module.exports = {
  db,
  createSubscriber,
  listUsers,
  saveUser,
  findUserByEmail,
  findUserById,
  findSubscriptionByUserId,
  listSubscriptions,
  saveSubscription,
  listScoresByUserId,
  findScoreById,
  saveScore,
  createScore,
  replaceScoresForUser,
  newId,
  resetStore,
  listCharities,
  findCharityById,
  createCharity,
  updateCharity,
  deleteCharity,
  findCharityPreferenceByUserId,
  listCharityPreferences,
  saveCharityPreference,
  createIndependentDonation,
  listIndependentDonations,
  listActiveSubscribers,
  findPublishedDrawByMonth,
  listPublishedDraws,
  savePublishedDraw,
  getDrawRolloverBalance,
  setDrawRolloverBalance,
  createWinnerRecord,
  listWinnerRecords,
  listWinnerRecordsByUserId,
  findWinnerRecordById,
  saveWinnerRecord,
  findBillingSubscriptionByUserId,
  findBillingSubscriptionByStripeSubscriptionId,
  findBillingSubscriptionByStripeCustomerId,
  saveBillingSubscription,
};
