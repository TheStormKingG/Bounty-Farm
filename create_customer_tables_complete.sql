-- Combined script to create both customer tables with sample data
-- Run this script in Supabase SQL Editor

-- ==============================================
-- FARM CUSTOMERS TABLE
-- ==============================================

-- Create farm_customers table with no RLS
CREATE TABLE IF NOT EXISTS farm_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_name VARCHAR(255) NOT NULL,
    farm_address TEXT NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for farm_customers table
ALTER TABLE farm_customers DISABLE ROW LEVEL SECURITY;

-- Insert sample farm customers data
INSERT INTO farm_customers (farm_name, farm_address, contact_person, contact_number, created_by) VALUES
('Green Valley Farm', '123 Agriculture Road, Region 3, Guyana', 'John Smith', '+592-123-4567', 'admin'),
('Sunrise Poultry Farm', '456 Farm Lane, East Coast Demerara, Guyana', 'Maria Garcia', '+592-234-5678', 'admin'),
('Golden Harvest Farm', '789 Rural Street, West Coast Berbice, Guyana', 'David Johnson', '+592-345-6789', 'admin'),
('Bounty Acres Farm', '321 Country Road, Essequibo Coast, Guyana', 'Sarah Williams', '+592-456-7890', 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farm_customers_farm_name ON farm_customers(farm_name);
CREATE INDEX IF NOT EXISTS idx_farm_customers_contact_person ON farm_customers(contact_person);
CREATE INDEX IF NOT EXISTS idx_farm_customers_created_at ON farm_customers(created_at);

-- ==============================================
-- INDIVIDUAL CUSTOMERS TABLE
-- ==============================================

-- Create individual_customers table with no RLS
CREATE TABLE IF NOT EXISTS individual_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for individual_customers table
ALTER TABLE individual_customers DISABLE ROW LEVEL SECURITY;

-- Insert sample individual customers data
INSERT INTO individual_customers (name, address, phone_number, created_by) VALUES
('Michael Brown', '15 Main Street, Georgetown, Guyana', '+592-111-2222', 'admin'),
('Lisa Davis', '42 Queen Street, New Amsterdam, Guyana', '+592-222-3333', 'admin'),
('Robert Wilson', '78 King Street, Linden, Guyana', '+592-333-4444', 'admin'),
('Jennifer Taylor', '95 High Street, Anna Regina, Guyana', '+592-444-5555', 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individual_customers_name ON individual_customers(name);
CREATE INDEX IF NOT EXISTS idx_individual_customers_phone_number ON individual_customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_individual_customers_created_at ON individual_customers(created_at);

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify farm customers were created
SELECT 'Farm Customers Created:' as status, COUNT(*) as count FROM farm_customers;

-- Verify individual customers were created
SELECT 'Individual Customers Created:' as status, COUNT(*) as count FROM individual_customers;

-- Show sample data
SELECT 'Sample Farm Customers:' as info;
SELECT farm_name, contact_person, contact_number FROM farm_customers LIMIT 2;

SELECT 'Sample Individual Customers:' as info;
SELECT name, phone_number FROM individual_customers LIMIT 2;
