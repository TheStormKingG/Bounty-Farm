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

-- Enable Row Level Security (RLS)
ALTER TABLE daily_flock_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read daily flock data
CREATE POLICY "Allow authenticated users to read daily flock data" ON daily_flock_data
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert daily flock data
CREATE POLICY "Allow authenticated users to insert daily flock data" ON daily_flock_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update daily flock data
CREATE POLICY "Allow authenticated users to update daily flock data" ON daily_flock_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete daily flock data
CREATE POLICY "Allow authenticated users to delete daily flock data" ON daily_flock_data
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_daily_flock_data_updated_at
    BEFORE UPDATE ON daily_flock_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
