-- Fix the ambiguous po_number reference in the dispatch creation trigger
-- This script fixes the PostgreSQL error: "column reference 'po_number' is ambiguous"

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS auto_create_dispatch_on_invoice_paid ON invoices;
DROP FUNCTION IF EXISTS create_dispatch_on_invoice_paid();

-- Step 2: Create the corrected function with proper variable naming
CREATE OR REPLACE FUNCTION create_dispatch_on_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
    new_dispatch_number VARCHAR(255);
    po_number_var VARCHAR(255);
    sales_record RECORD;
    existing_dispatch RECORD;
BEGIN
    -- Handle payment status changes
    
    -- Case 1: Status changed from 'pending' to 'paid' - CREATE dispatch
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
    
    -- Case 2: Status changed from 'paid' to 'pending' - DELETE dispatch
    IF OLD.payment_status = 'paid' AND NEW.payment_status = 'pending' THEN
        
        -- Find and delete the corresponding dispatch
        DELETE FROM dispatches 
        WHERE invoice_id = NEW.id;
        
        RAISE NOTICE 'Dispatch deleted for invoice % (status changed to pending)', NEW.invoice_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
CREATE TRIGGER auto_create_dispatch_on_invoice_paid
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_dispatch_on_invoice_paid();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed dispatch creation trigger - ambiguous po_number reference resolved!';
    RAISE NOTICE 'Payment status updates should now work without errors.';
END $$;
