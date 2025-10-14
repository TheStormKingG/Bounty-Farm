-- Update dispatches table structure
-- This script modifies the existing dispatches table to replace 'trips' column with 'receipt' column

-- First, add the new 'receipt' column
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS receipt VARCHAR(255);

-- Update existing records to have a default receipt value
UPDATE dispatches SET receipt = 'RECEIPT-' || dispatch_number WHERE receipt IS NULL;

-- Drop the old 'trips' column (if it exists)
ALTER TABLE dispatches DROP COLUMN IF EXISTS trips;

-- Add an index for better performance on receipt lookups
CREATE INDEX IF NOT EXISTS idx_dispatches_receipt ON dispatches(receipt);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'dispatches' 
ORDER BY ordinal_position;

-- Show sample data to verify the structure
SELECT 
    dispatch_number,
    type,
    trucks,
    receipt,
    created_at
FROM dispatches 
LIMIT 5;
