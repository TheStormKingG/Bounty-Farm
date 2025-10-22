-- Simple version for Supabase SQL Editor
-- Create table for storing daily flock data
CREATE TABLE IF NOT EXISTS daily_flock_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flock_id TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    date DATE NOT NULL,
    culls INTEGER DEFAULT 0,
    runts INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    feed_type TEXT NOT NULL CHECK (feed_type IN ('Starter', 'Grower', 'Finisher')),
    feed_used DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'system',
    updated_by TEXT DEFAULT 'system'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_flock_id ON daily_flock_data(flock_id);
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_farm_name ON daily_flock_data(farm_name);
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_date ON daily_flock_data(date);
CREATE INDEX IF NOT EXISTS idx_daily_flock_data_flock_date ON daily_flock_data(flock_id, date);

-- Create unique constraint to prevent duplicate entries for same flock and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_flock_data_unique ON daily_flock_data(flock_id, date);

-- Disable Row Level Security (RLS) for this table since we're using custom auth
ALTER TABLE daily_flock_data DISABLE ROW LEVEL SECURITY;
