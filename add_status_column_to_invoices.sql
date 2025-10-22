-- Add status column to invoices table
-- This enables payment status tracking for invoices

-- Add the status column with default value 'pending'
ALTER TABLE invoices 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Add a check constraint to ensure only valid status values
ALTER TABLE invoices 
ADD CONSTRAINT check_invoice_status 
CHECK (status IN ('pending', 'paid'));

-- Update any existing invoices to have 'pending' status
UPDATE invoices 
SET status = 'pending' 
WHERE status IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- Show sample data to verify
SELECT id, invoice_number, status, created_at 
FROM invoices 
LIMIT 5;
