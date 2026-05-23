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
