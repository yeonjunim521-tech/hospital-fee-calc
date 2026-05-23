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
