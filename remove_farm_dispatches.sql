-- Remove all farm dispatches from the system
-- This includes both incoming and received dispatches

-- First, let's check what columns exist in the dispatches table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dispatches' 
ORDER BY ordinal_position;

-- Check if customer_type column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'dispatches' AND column_name = 'customer_type'
) as has_customer_type_column;

-- Check current dispatches data
SELECT 'Current dispatches:' as info;
SELECT type, COUNT(*) as count 
FROM dispatches 
GROUP BY type;

-- Check received dispatches
SELECT 'Current received dispatches:' as info;
SELECT COUNT(*) as count FROM received_dispatches;

-- Since customer_type column doesn't exist, we need to identify farm dispatches differently
-- Farm dispatches are typically of type 'Delivery' and have customers that exist in farm_customers table

-- First, delete all received dispatches for farm customers
DELETE FROM received_dispatches 
WHERE dispatch_id IN (
  SELECT d.id FROM dispatches d
  JOIN invoices i ON d.invoice_id = i.id
  WHERE i.customer IN (SELECT farm_name FROM farm_customers)
);

-- Then delete all farm dispatches from the dispatches table
DELETE FROM dispatches 
WHERE id IN (
  SELECT d.id FROM dispatches d
  JOIN invoices i ON d.invoice_id = i.id
  WHERE i.customer IN (SELECT farm_name FROM farm_customers)
);

-- Also delete any invoices related to farm customers
DELETE FROM invoices 
WHERE customer IN (
  SELECT farm_name FROM farm_customers
);

-- Verify the cleanup
SELECT 'Remaining dispatches by type:' as info;
SELECT type, COUNT(*) as count 
FROM dispatches 
GROUP BY type;

SELECT 'Remaining received dispatches:' as info;
SELECT COUNT(*) as count FROM received_dispatches;

SELECT 'Remaining invoices:' as info;
SELECT COUNT(*) as count FROM invoices;
