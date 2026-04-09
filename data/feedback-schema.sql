CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  currency TEXT NOT NULL,
  page TEXT NOT NULL,
  source TEXT NOT NULL,
  app_version TEXT NOT NULL,
  generated_listing_id TEXT,
  generated_title TEXT,
  generated_price TEXT,
  created_at TEXT NOT NULL
);
