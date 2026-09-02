CREATE TABLE IF NOT EXISTS visitor_daily_stats (
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 1 CHECK (page_views >= 1),
  first_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (day, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_visitor_daily_stats_day
ON visitor_daily_stats(day);
