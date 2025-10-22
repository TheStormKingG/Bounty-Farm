-- Create Testing Thursdays table
CREATE TABLE IF NOT EXISTS testing_thursdays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Testing fields
  ammonia_levels_ppm INTEGER DEFAULT 0 CHECK (ammonia_levels_ppm >= 0),
  drinkers_flow_rate_ml_min INTEGER DEFAULT 0 CHECK (drinkers_flow_rate_ml_min >= 0),
  litter_moisture TEXT NOT NULL DEFAULT 'Dry-Dusty' CHECK (litter_moisture IN ('Dry-Dusty', 'Damp-Clumpy', 'Wet-Sticky')),
  light_intensity_lx INTEGER DEFAULT 0 CHECK (light_intensity_lx >= 0),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'farmer',
  updated_by TEXT DEFAULT 'farmer'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_testing_thursdays_flock_id ON testing_thursdays(flock_id);
CREATE INDEX IF NOT EXISTS idx_testing_thursdays_date ON testing_thursdays(date);
CREATE INDEX IF NOT EXISTS idx_testing_thursdays_flock_date ON testing_thursdays(flock_id, date);

-- Create unique constraint to prevent duplicate entries for same flock and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_testing_thursdays_flock_date_unique 
ON testing_thursdays(flock_id, date);

-- Add comments for documentation
COMMENT ON TABLE testing_thursdays IS 'Stores weekly testing data collected on Thursdays';
COMMENT ON COLUMN testing_thursdays.ammonia_levels_ppm IS 'Ammonia levels in parts per million';
COMMENT ON COLUMN testing_thursdays.drinkers_flow_rate_ml_min IS 'Drinkers flow rate in milliliters per minute';
COMMENT ON COLUMN testing_thursdays.litter_moisture IS 'Litter moisture condition';
COMMENT ON COLUMN testing_thursdays.light_intensity_lx IS 'Light intensity in lux';
