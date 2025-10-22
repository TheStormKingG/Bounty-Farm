-- Add week_day_id column to daily_flock_data table
-- This column will store a unique identifier for each week/day combination
-- Format: W{week}D{day}{dayName}{dayNumber}{month}
-- Example: W1D1TU21OCT (Week 1, Day 1, Tuesday 21st October)

-- Add the new column
ALTER TABLE daily_flock_data 
ADD COLUMN week_day_id TEXT;

-- Create an index for better performance on the new column
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_week_day_id ON daily_flock_data(week_day_id);

-- Create a unique constraint to prevent duplicate entries for same week/day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_flock_data_week_day_unique ON daily_flock_data(flock_id, week_day_id);

-- Update existing records with week_day_id (if any exist)
-- This will generate week_day_id for existing data based on date and flock_id
UPDATE daily_flock_data 
SET week_day_id = CONCAT(
    'W', 
    EXTRACT(WEEK FROM date) - EXTRACT(WEEK FROM DATE_TRUNC('month', date)) + 1,
    'D',
    EXTRACT(DOW FROM date) + 1,
    UPPER(TO_CHAR(date, 'DY')),
    EXTRACT(DAY FROM date)::TEXT,
    UPPER(TO_CHAR(date, 'MON'))
)
WHERE week_day_id IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN daily_flock_data.week_day_id IS 'Unique identifier for week/day combination. Format: W{week}D{day}{dayName}{dayNumber}{month}';
