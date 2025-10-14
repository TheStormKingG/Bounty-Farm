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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_farm_customers_farm_name ON farm_customers(farm_name);
CREATE INDEX IF NOT EXISTS idx_farm_customers_contact_person ON farm_customers(contact_person);
CREATE INDEX IF NOT EXISTS idx_farm_customers_created_at ON farm_customers(created_at);
