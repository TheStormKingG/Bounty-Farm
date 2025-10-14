-- Create trigger to automatically generate invoice when PO is created in sales_dispatch
-- This will populate the invoices table with relevant fields from the sales_dispatch record

-- Step 1: Create function to generate invoice from sales_dispatch
CREATE OR REPLACE FUNCTION create_invoice_from_sales_dispatch()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_number VARCHAR(255);
    invoice_counter INTEGER;
BEGIN
    -- Generate invoice number based on PO number pattern
    -- Convert PO number (e.g., BFLOS-007-PO) to invoice number (e.g., BFLOS-007-INV)
    new_invoice_number := REPLACE(NEW.po_number, '-PO', '-INV');
    
    -- If the PO number doesn't follow the expected pattern, generate a sequential number
    IF new_invoice_number = NEW.po_number THEN
        -- Get the next sequential invoice number
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
        INTO invoice_counter
        FROM invoices
        WHERE invoice_number LIKE 'INV-%';
        
        new_invoice_number := 'INV-' || LPAD(invoice_counter::TEXT, 4, '0');
    END IF;
    
    -- Insert new invoice record
    INSERT INTO invoices (
        invoice_number,
        date_sent,
        payment_status,
        created_by
    ) VALUES (
        new_invoice_number,
        NEW.date_ordered, -- Use the date_ordered from sales_dispatch as date_sent
        'pending', -- Default payment status
        NEW.created_by -- Use the same created_by from sales_dispatch
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to fire after INSERT on sales_dispatch
DROP TRIGGER IF EXISTS auto_create_invoice_from_sales_dispatch ON sales_dispatch;
CREATE TRIGGER auto_create_invoice_from_sales_dispatch
    AFTER INSERT ON sales_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_from_sales_dispatch();

-- Step 3: Test the trigger (optional - uncomment to test)
/*
-- Test by inserting a sales dispatch record
INSERT INTO sales_dispatch (
    po_number,
    date_ordered,
    customer,
    qty,
    hatch_date,
    batches_required,
    trucks_required,
    created_by,
    updated_by
) VALUES (
    'BFLOS-008-PO',
    '2025-10-14',
    'Test Customer',
    500,
    '2025-10-21',
    1,
    1,
    'admin',
    'admin'
);

-- Check if invoice was created
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 1;
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Invoice auto-creation trigger created successfully!';
    RAISE NOTICE 'When a PO is created in sales_dispatch, an invoice will be automatically generated.';
    RAISE NOTICE 'Invoice numbers will follow the pattern: BFLOS-XXX-INV (based on PO number)';
END $$;
