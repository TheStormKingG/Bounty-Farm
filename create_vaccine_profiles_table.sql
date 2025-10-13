-- Create vaccine_profiles table
CREATE TABLE vaccine_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vaccines TEXT[] DEFAULT '{}',
    created_by VARCHAR(255) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster searches
CREATE INDEX idx_vaccine_profiles_name ON vaccine_profiles(name);

-- Add RLS (Row Level Security) policies
ALTER TABLE vaccine_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON vaccine_profiles
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO vaccine_profiles (name, vaccines, created_by, updated_by) VALUES
('Standard Profile', ARRAY['ND-HH', 'IB', 'IBD'], 'admin', 'admin'),
('Premium Profile', ARRAY['ND-HH', 'IB', 'IBD', 'Marek'], 'admin', 'admin'),
('Basic Profile', ARRAY['ND-HH'], 'admin', 'admin');
