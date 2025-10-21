-- Remove all farm dispatches from the system
-- This includes both incoming and received dispatches

-- First, let's check what columns exist in the dispatches table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dispatches' 
ORDER BY ordinal_position;

-- Check what columns exist in the invoices table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- Check what columns exist in the sales_dispatch table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_dispatch' 
ORDER BY ordinal_position;

-- Check current dispatches data
SELECT 'Current dispatches:' as info;
SELECT type, COUNT(*) as count 
FROM dispatches 
GROUP BY type;

-- Check received dispatches
SELECT 'Current received dispatches:' as info;
SELECT COUNT(*) as count FROM received_dispatches;

-- Check farm customers
SELECT 'Farm customers:' as info;
SELECT farm_name FROM farm_customers;

-- Since invoices table doesn't have customer column, we need to identify farm dispatches differently
-- Farm dispatches are identified by:
-- 1. type = 'Delivery' 
-- 2. The related sales_dispatch record has a customer that exists in farm_customers table

-- First, delete all received dispatches for farm customers
DELETE FROM received_dispatches 
WHERE dispatch_id IN (
  SELECT d.id FROM dispatches d
  JOIN invoices i ON d.invoice_id = i.id
  JOIN sales_dispatch sd ON i.invoice_number = REPLACE(sd.po_number, '-PO', '-INV')
  WHERE sd.customer IN (SELECT farm_name FROM farm_customers)
);

-- Then delete all farm dispatches from the dispatches table
DELETE FROM dispatches 
WHERE id IN (
  SELECT d.id FROM dispatches d
  JOIN invoices i ON d.invoice_id = i.id
  JOIN sales_dispatch sd ON i.invoice_number = REPLACE(sd.po_number, '-PO', '-INV')
  WHERE sd.customer IN (SELECT farm_name FROM farm_customers)
);

-- Also delete any invoices related to farm customers
DELETE FROM invoices 
WHERE id IN (
  SELECT i.id FROM invoices i
  JOIN sales_dispatch sd ON i.invoice_number = REPLACE(sd.po_number, '-PO', '-INV')
  WHERE sd.customer IN (SELECT farm_name FROM farm_customers)
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
