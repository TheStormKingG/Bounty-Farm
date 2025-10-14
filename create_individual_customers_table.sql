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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_individual_customers_name ON individual_customers(name);
CREATE INDEX IF NOT EXISTS idx_individual_customers_phone_number ON individual_customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_individual_customers_created_at ON individual_customers(created_at);
