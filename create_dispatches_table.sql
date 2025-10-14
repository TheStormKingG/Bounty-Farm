-- Create dispatches table and automatic dispatch creation trigger
-- When an invoice payment_status changes from 'pending' to 'paid', 
-- automatically create a dispatch entry

-- Step 1: Create the dispatches table
CREATE TABLE dispatches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispatch_number VARCHAR(255) NOT NULL UNIQUE, -- e.g., BFLOS-007-DISP
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sales_dispatch_id UUID NOT NULL REFERENCES sales_dispatch(id) ON DELETE CASCADE,
    date_dispatched DATE DEFAULT CURRENT_DATE,
    type VARCHAR(50) DEFAULT 'Delivery', -- Delivery, Pickup, etc.
    trucks INTEGER DEFAULT 1,
    trips INTEGER DEFAULT 1,
    created_by VARCHAR(255) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX idx_dispatches_dispatch_number ON dispatches(dispatch_number);
CREATE INDEX idx_dispatches_invoice_id ON dispatches(invoice_id);
CREATE INDEX idx_dispatches_sales_dispatch_id ON dispatches(sales_dispatch_id);
CREATE INDEX idx_dispatches_date_dispatched ON dispatches(date_dispatched);

-- Step 3: Create function to handle dispatch creation when invoice is paid
CREATE OR REPLACE FUNCTION create_dispatch_on_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
    new_dispatch_number VARCHAR(255);
    po_number_var VARCHAR(255);
    sales_record RECORD;
BEGIN
    -- Only create dispatch when payment_status changes from 'pending' to 'paid'
    IF OLD.payment_status = 'pending' AND NEW.payment_status = 'paid' THEN
        
        -- Convert invoice number to dispatch number (BFLOS-007-INV → BFLOS-007-DISP)
        new_dispatch_number := REPLACE(NEW.invoice_number, '-INV', '-DISP');
        
        -- Convert invoice number back to PO number to find the sales_dispatch record
        po_number_var := REPLACE(NEW.invoice_number, '-INV', '-PO');
        
        -- Find the corresponding sales_dispatch record
        SELECT id, trucks_required, batches_required
        INTO sales_record
        FROM sales_dispatch
        WHERE po_number = po_number_var;
        
        -- Check if sales_dispatch record exists
        IF NOT FOUND THEN
            RAISE WARNING 'Sales dispatch record for PO % not found when creating dispatch for invoice %', po_number_var, NEW.invoice_number;
            RETURN NEW;
        END IF;
        
        -- Insert new dispatch record
        INSERT INTO dispatches (
            dispatch_number,
            invoice_id,
            sales_dispatch_id,
            date_dispatched,
            type,
            trucks,
            trips,
            created_by,
            updated_by
        ) VALUES (
            new_dispatch_number,
            NEW.id,
            sales_record.id,
            CURRENT_DATE,
            'Delivery', -- Default type
            COALESCE(sales_record.trucks_required, 1), -- Use trucks from PO, default to 1
            COALESCE(sales_record.batches_required, 1), -- Use batches as trips, default to 1
            NEW.updated_by,
            NEW.updated_by
        );
        
        RAISE NOTICE 'Dispatch % created for paid invoice %', new_dispatch_number, NEW.invoice_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to fire when invoice payment_status is updated
DROP TRIGGER IF EXISTS auto_create_dispatch_on_invoice_paid ON invoices;
CREATE TRIGGER auto_create_dispatch_on_invoice_paid
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_dispatch_on_invoice_paid();

-- Step 5: Test the trigger (optional - uncomment to test)
/*
-- First, ensure you have a sales_dispatch record and corresponding invoice
-- Example test data:

-- 1. Create a test sales dispatch record
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
    'BFLOS-TEST-PO',
    '2025-10-14',
    'Test Customer',
    500,
    '2025-10-21',
    2,
    1,
    'admin',
    'admin'
);

-- 2. Create corresponding invoice (this should happen automatically via existing trigger)
INSERT INTO invoices (
    invoice_number,
    date_sent,
    payment_status,
    created_by,
    updated_by
) VALUES (
    'BFLOS-TEST-INV',
    '2025-10-14',
    'pending',
    'admin',
    'admin'
);

-- 3. Update invoice to paid status (this should trigger dispatch creation)
UPDATE invoices 
SET payment_status = 'paid', 
    updated_by = 'admin',
    updated_at = NOW()
WHERE invoice_number = 'BFLOS-TEST-INV';

-- 4. Check if dispatch was created
SELECT * FROM dispatches WHERE dispatch_number = 'BFLOS-TEST-DISP';

-- 5. Clean up test data
-- DELETE FROM dispatches WHERE dispatch_number = 'BFLOS-TEST-DISP';
-- DELETE FROM invoices WHERE invoice_number = 'BFLOS-TEST-INV';
-- DELETE FROM sales_dispatch WHERE po_number = 'BFLOS-TEST-PO';
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Dispatches table and automatic dispatch creation trigger created successfully!';
    RAISE NOTICE 'When an invoice payment_status changes from pending to paid, a dispatch will be automatically created.';
    RAISE NOTICE 'Dispatch numbers will follow the pattern: BFLOS-XXX-DISP (based on invoice number)';
END $$;
