-- Create breeds table for Breed Management
-- This script creates a breeds table with the specified columns and no RLS policy

-- Drop table if it exists (for clean setup)
DROP TABLE IF EXISTS breeds CASCADE;

-- Create breeds table
CREATE TABLE breeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breed_type TEXT NOT NULL,
    breed_code TEXT UNIQUE NOT NULL,
    breed_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    remarks TEXT,
    updated TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger to update the 'updated' timestamp on any change
CREATE OR REPLACE FUNCTION update_breeds_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_breeds_updated_at
    BEFORE UPDATE ON breeds
    FOR EACH ROW
    EXECUTE FUNCTION update_breeds_updated_timestamp();

-- Insert some sample data
INSERT INTO breeds (breed_type, breed_code, breed_name, start_date, end_date, remarks) VALUES
('Layer', 'BRL-001', 'Brown Layer', '2020-01-01', NULL, 'High egg production breed'),
('Broiler', 'BRB-001', 'Fast Growing Broiler', '2020-01-01', NULL, 'Fast growth, good meat quality'),
('Layer', 'BRL-002', 'White Layer', '2020-01-01', '2023-12-31', 'Retired breed - replaced by BRL-001'),
('Broiler', 'BRB-002', 'Premium Broiler', '2021-06-01', NULL, 'Premium quality meat breed'),
('Dual Purpose', 'BRD-001', 'Dual Purpose Breed', '2020-01-01', NULL, 'Good for both eggs and meat');

-- Verify the table was created successfully
SELECT 'breeds table created successfully' as status;
SELECT COUNT(*) as total_breeds FROM breeds;
