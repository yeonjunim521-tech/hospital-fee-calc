CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  path TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_logs_normalized_query
ON search_logs(normalized_query);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at
ON search_logs(created_at);

CREATE TABLE IF NOT EXISTS search_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  item_id TEXT,
  item_name TEXT NOT NULL,
  item_category TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_candidates_normalized_query
ON search_candidates(normalized_query);

CREATE INDEX IF NOT EXISTS idx_search_candidates_status
ON search_candidates(status);

CREATE TABLE IF NOT EXISTS medical_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  item_group TEXT NOT NULL,
  item_type TEXT NOT NULL,
  clinic_price INTEGER NOT NULL CHECK (clinic_price >= 0),
  hospital_price INTEGER NOT NULL CHECK (hospital_price >= 0),
  is_benefit INTEGER NOT NULL CHECK (is_benefit IN (0, 1)),
  source_url TEXT NOT NULL,
  source_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status = 'approved'),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_items_status_name
ON medical_items(status, name);

CREATE TABLE IF NOT EXISTS medical_item_aliases (
  item_code TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_code, normalized_alias),
  FOREIGN KEY (item_code) REFERENCES medical_items(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_medical_item_aliases_normalized_alias
ON medical_item_aliases(normalized_alias);

CREATE TABLE IF NOT EXISTS weekly_candidate_reviews (
  week_start TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  query TEXT NOT NULL,
  search_count INTEGER NOT NULL DEFAULT 0 CHECK (search_count >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'dismissed')),
  candidate_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (week_start, normalized_query),
  FOREIGN KEY (candidate_id) REFERENCES search_candidates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_weekly_candidate_reviews_status
ON weekly_candidate_reviews(status, week_start);

CREATE TABLE IF NOT EXISTS search_click_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  clicked_item_id TEXT,
  clicked_item_name TEXT,
  path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_click_logs_normalized_query
ON search_click_logs(normalized_query);

CREATE INDEX IF NOT EXISTS idx_search_click_logs_created_at
ON search_click_logs(created_at);

CREATE TABLE IF NOT EXISTS telemetry_rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_telemetry_rate_limits_window_started_at
ON telemetry_rate_limits(window_started_at);

CREATE TABLE IF NOT EXISTS calculation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_class TEXT NOT NULL,
  treatment_type TEXT NOT NULL,
  nonbenefit_region TEXT NOT NULL,
  room_type TEXT,
  stay_days INTEGER DEFAULT 0,
  has_insurance INTEGER DEFAULT 0,
  insurance_generation TEXT,
  has_sanjeong INTEGER DEFAULT 0,
  sanjeong_disease TEXT,
  selected_tests_json TEXT,
  selected_surgeries_json TEXT,
  selected_procedures_json TEXT,
  final_cost INTEGER DEFAULT 0,
  total_cost INTEGER DEFAULT 0,
  refund_cost INTEGER DEFAULT 0,
  path TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calculation_logs_created_at
ON calculation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_calculation_logs_hospital_treatment
ON calculation_logs(hospital_class, treatment_type);
