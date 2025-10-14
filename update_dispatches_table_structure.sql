-- Update dispatches table structure
-- This script removes the 'receipt' column from dispatches table
-- The receipt functionality will be handled in the app frontend

-- Drop the 'receipt' column if it exists
ALTER TABLE dispatches DROP COLUMN IF EXISTS receipt;

-- Drop the old 'trips' column (if it exists)
ALTER TABLE dispatches DROP COLUMN IF EXISTS trips;

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
