-- Create table for storing Monday Measures data
CREATE TABLE IF NOT EXISTS monday_measures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flock_id TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    date DATE NOT NULL,
    bird1_weight DECIMAL(10,2) DEFAULT 0,
    bird1_gait_score INTEGER DEFAULT 0 CHECK (bird1_gait_score >= 0 AND bird1_gait_score <= 5),
    bird1_dust_bathing TEXT DEFAULT 'no' CHECK (bird1_dust_bathing IN ('yes', 'no')),
    bird1_panting TEXT DEFAULT 'no' CHECK (bird1_panting IN ('yes', 'no')),
    bird2_weight DECIMAL(10,2) DEFAULT 0,
    bird2_gait_score INTEGER DEFAULT 0 CHECK (bird2_gait_score >= 0 AND bird2_gait_score <= 5),
    bird2_dust_bathing TEXT DEFAULT 'no' CHECK (bird2_dust_bathing IN ('yes', 'no')),
    bird2_panting TEXT DEFAULT 'no' CHECK (bird2_panting IN ('yes', 'no')),
    bird3_weight DECIMAL(10,2) DEFAULT 0,
    bird3_gait_score INTEGER DEFAULT 0 CHECK (bird3_gait_score >= 0 AND bird3_gait_score <= 5),
    bird3_dust_bathing TEXT DEFAULT 'no' CHECK (bird3_dust_bathing IN ('yes', 'no')),
    bird3_panting TEXT DEFAULT 'no' CHECK (bird3_panting IN ('yes', 'no')),
    bird4_weight DECIMAL(10,2) DEFAULT 0,
    bird4_gait_score INTEGER DEFAULT 0 CHECK (bird4_gait_score >= 0 AND bird4_gait_score <= 5),
    bird4_dust_bathing TEXT DEFAULT 'no' CHECK (bird4_dust_bathing IN ('yes', 'no')),
    bird4_panting TEXT DEFAULT 'no' CHECK (bird4_panting IN ('yes', 'no')),
    bird5_weight DECIMAL(10,2) DEFAULT 0,
    bird5_gait_score INTEGER DEFAULT 0 CHECK (bird5_gait_score >= 0 AND bird5_gait_score <= 5),
    bird5_dust_bathing TEXT DEFAULT 'no' CHECK (bird5_dust_bathing IN ('yes', 'no')),
    bird5_panting TEXT DEFAULT 'no' CHECK (bird5_panting IN ('yes', 'no')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'system',
    updated_by TEXT DEFAULT 'system'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monday_measures_flock_id ON monday_measures(flock_id);
CREATE INDEX IF NOT EXISTS idx_monday_measures_farm_name ON monday_measures(farm_name);
CREATE INDEX IF NOT EXISTS idx_monday_measures_date ON monday_measures(date);
CREATE INDEX IF NOT EXISTS idx_monday_measures_flock_date ON monday_measures(flock_id, date);

-- Create unique constraint to prevent duplicate entries for same flock and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_monday_measures_unique ON monday_measures(flock_id, date);

-- Disable Row Level Security (RLS) for this table since we're using custom auth
ALTER TABLE monday_measures DISABLE ROW LEVEL SECURITY;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update on monday_measures
CREATE TRIGGER trg_monday_measures_updated_at
BEFORE UPDATE ON monday_measures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
