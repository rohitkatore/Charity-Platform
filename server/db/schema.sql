-- PRD-aligned base schema for auth, subscriptions, and score management.

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
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS score_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score_value REAL NOT NULL CHECK (score_value >= 1 AND score_value <= 45),
  score_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_score_entries_user_date_desc
  ON score_entries (user_id, score_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS charities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS charity_images (
  id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL,
  image_ref TEXT NOT NULL,
  FOREIGN KEY (charity_id) REFERENCES charities(id)
);

CREATE TABLE IF NOT EXISTS charity_events (
  id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  FOREIGN KEY (charity_id) REFERENCES charities(id)
);

CREATE TABLE IF NOT EXISTS user_charity_preferences (
  user_id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL,
  contribution_percentage REAL NOT NULL CHECK (contribution_percentage >= 10),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (charity_id) REFERENCES charities(id)
);

CREATE TABLE IF NOT EXISTS independent_donations (
  id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL,
  donor_email TEXT,
  amount REAL NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (charity_id) REFERENCES charities(id)
);

CREATE INDEX IF NOT EXISTS idx_charities_featured
  ON charities (is_featured);

CREATE INDEX IF NOT EXISTS idx_user_charity_preferences_charity_id
  ON user_charity_preferences (charity_id);

CREATE TABLE IF NOT EXISTS draw_publications (
  id TEXT PRIMARY KEY,
  draw_month TEXT NOT NULL UNIQUE,
  logic_mode TEXT NOT NULL,
  algorithm_weight TEXT,
  draw_numbers_json TEXT NOT NULL,
  active_subscriber_count INTEGER NOT NULL,
  total_pool REAL NOT NULL,
  tier_5_base REAL NOT NULL,
  tier_4_base REAL NOT NULL,
  tier_3_base REAL NOT NULL,
  rollover_in REAL NOT NULL,
  rollover_out REAL NOT NULL,
  status TEXT NOT NULL,
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS draw_participant_results (
  id TEXT PRIMARY KEY,
  draw_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  match_count INTEGER NOT NULL,
  tier INTEGER,
  winning_amount REAL NOT NULL,
  participant_numbers_json TEXT NOT NULL,
  matched_numbers_json TEXT NOT NULL,
  FOREIGN KEY (draw_id) REFERENCES draw_publications(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_draw_participant_results_draw_id
  ON draw_participant_results (draw_id);

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
  updated_at TEXT NOT NULL,
  FOREIGN KEY (draw_id) REFERENCES draw_publications(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_winner_records_user_id
  ON winner_records (user_id);

CREATE INDEX IF NOT EXISTS idx_winner_records_draw_month
  ON winner_records (draw_month);

-- Retention rule (latest 5 scores only) is enforced in application/service layer for deterministic behavior.