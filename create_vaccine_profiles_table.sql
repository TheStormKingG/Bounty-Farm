-- Create vaccine_profiles table with separate vaccine columns
CREATE TABLE vaccine_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vaccine_profile_name VARCHAR(255) NOT NULL,
    vaccine_1_name VARCHAR(255),
    vaccine_2_name VARCHAR(255),
    vaccine_3_name VARCHAR(255),
    vaccine_4_name VARCHAR(255),
    created_by VARCHAR(255) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on vaccine_profile_name for faster searches
CREATE INDEX idx_vaccine_profiles_name ON vaccine_profiles(vaccine_profile_name);

-- Add RLS (Row Level Security) policies
ALTER TABLE vaccine_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON vaccine_profiles
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO vaccine_profiles (vaccine_profile_name, vaccine_1_name, vaccine_2_name, vaccine_3_name, vaccine_4_name, created_by, updated_by) VALUES
('Standard Profile', 'ND-HH', 'IB', 'IBD', NULL, 'admin', 'admin'),
('Premium Profile', 'ND-HH', 'IB', 'IBD', 'Marek', 'admin', 'admin'),
('Basic Profile', 'ND-HH', NULL, NULL, NULL, 'admin', 'admin');
