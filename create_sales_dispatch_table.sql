-- Create sales_dispatch table
CREATE TABLE sales_dispatch (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number VARCHAR(255) NOT NULL,
    date_ordered DATE NOT NULL,
    customer VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL,
    hatch_date DATE NOT NULL,
    batches_required INTEGER NOT NULL,
    trucks_required INTEGER NOT NULL,
    created_by VARCHAR(255) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on po_number for faster searches
CREATE INDEX idx_sales_dispatch_po_number ON sales_dispatch(po_number);

-- Create index on customer for faster searches
CREATE INDEX idx_sales_dispatch_customer ON sales_dispatch(customer);

-- Create index on date_ordered for faster searches
CREATE INDEX idx_sales_dispatch_date_ordered ON sales_dispatch(date_ordered);

-- Add RLS (Row Level Security) policies
ALTER TABLE sales_dispatch ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON sales_dispatch
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO sales_dispatch (po_number, date_ordered, customer, qty, hatch_date, batches_required, trucks_required, created_by, updated_by) VALUES
('BFLOS-001', '2025-01-10', 'John', 10000, '2025-10-13', 3, 2, 'admin', 'admin'),
('BFLOS-002', '2025-01-11', 'Sarah', 15000, '2025-10-14', 4, 3, 'admin', 'admin'),
('BFLOS-003', '2025-01-12', 'Mike', 8000, '2025-10-15', 2, 1, 'admin', 'admin');
