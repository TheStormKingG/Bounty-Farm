-- Remove all farm dispatches from the system
-- This includes both incoming and received dispatches

-- First, delete all received dispatches for farm customers
DELETE FROM received_dispatches 
WHERE dispatch_id IN (
  SELECT id FROM dispatches WHERE customer_type = 'Farm'
);

-- Then delete all farm dispatches from the dispatches table
DELETE FROM dispatches WHERE customer_type = 'Farm';

-- Also delete any invoices related to farm customers (if they exist)
DELETE FROM invoices 
WHERE customer IN (
  SELECT farm_name FROM farm_customers
);

-- Verify the cleanup
SELECT 'Remaining dispatches by type:' as info;
SELECT customer_type, COUNT(*) as count 
FROM dispatches 
GROUP BY customer_type;

SELECT 'Remaining received dispatches:' as info;
SELECT COUNT(*) as count FROM received_dispatches;

SELECT 'Remaining invoices:' as info;
SELECT COUNT(*) as count FROM invoices;
