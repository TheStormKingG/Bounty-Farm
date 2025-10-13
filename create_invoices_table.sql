-- Create invoices table
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL,
    date_sent DATE,
    payment_status VARCHAR(50) DEFAULT 'pending',
    po_number VARCHAR(255),
    created_by VARCHAR(255) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_po_number ON invoices(po_number);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date_sent ON invoices(date_sent);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON invoices FOR ALL USING (true);

-- Insert sample data
INSERT INTO invoices (invoice_number, date_sent, payment_status, po_number, created_by, updated_by) VALUES
('BFLOS-001-INV', '2025-10-15', 'pending', 'BFLOS-001-PO', 'admin', 'admin'),
('BFLOS-002-INV', '2025-10-16', 'paid', 'BFLOS-002-PO', 'admin', 'admin');
