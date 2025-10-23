CREATE TABLE IF NOT EXISTS daily_flock_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  date DATE NOT NULL,
  culls INTEGER DEFAULT 0 CHECK (culls >= 0),
  runts INTEGER DEFAULT 0 CHECK (runts >= 0),
  deaths INTEGER DEFAULT 0 CHECK (deaths >= 0),
  feed_type TEXT NOT NULL CHECK (feed_type IN ('Starter', 'Grower', 'Finisher')),
  feed_used DECIMAL(10,2) DEFAULT 0 CHECK (feed_used >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'farmer',
  updated_by TEXT DEFAULT 'farmer'
);

CREATE INDEX IF NOT EXISTS idx_daily_flock_data_flock_id ON daily_flock_data(flock_id);
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_date ON daily_flock_data(date);
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_flock_date ON daily_flock_data(flock_id, date);

COMMENT ON TABLE daily_flock_data IS 'Stores daily flock information including culls, runts, deaths, and feed usage';
COMMENT ON COLUMN daily_flock_data.culls IS 'Number of culled birds for the day';
COMMENT ON COLUMN daily_flock_data.runts IS 'Number of runt birds for the day';
COMMENT ON COLUMN daily_flock_data.deaths IS 'Number of deaths for the day';
COMMENT ON COLUMN daily_flock_data.feed_type IS 'Type of feed used (Starter, Grower, Finisher)';
COMMENT ON COLUMN daily_flock_data.feed_used IS 'Amount of feed used in kg';
