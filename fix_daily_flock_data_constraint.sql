-- Fix daily_flock_data table constraint to use week_day_id instead of date
-- This will allow multiple entries per date as long as week_day_id is different

-- Drop the existing unique constraint
DROP INDEX IF EXISTS idx_daily_flock_data_unique;

-- Create new unique constraint on (flock_id, week_day_id)
CREATE UNIQUE INDEX idx_daily_flock_data_flock_week_day_unique 
ON daily_flock_data(flock_id, week_day_id);

-- Also ensure we have the existing index for flock_id and week_day_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_flock_data_flock_id_week_day_id 
ON daily_flock_data(flock_id, week_day_id);
