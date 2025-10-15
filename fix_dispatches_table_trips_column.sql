-- Fix dispatches table structure to remove trips column reference
-- This script addresses the error: column "trips" of relation "dispatches" does not exist

-- First, let's check if the dispatches table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dispatches'
ORDER BY ordinal_position;

-- Drop all existing triggers that depend on the function (to avoid the trips column error)
DROP TRIGGER IF EXISTS create_dispatch_on_invoice_paid_trigger ON invoices;
DROP TRIGGER IF EXISTS auto_create_dispatch_on_invoice_paid ON invoices;

-- Drop the existing function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS create_dispatch_on_invoice_paid() CASCADE;

-- Create a new function that doesn't reference the trips column
CREATE OR REPLACE FUNCTION create_dispatch_on_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
    po_number_var TEXT;
    dispatch_number_var TEXT;
    sales_dispatch_record RECORD;
BEGIN
    -- Only proceed if payment_status changed to 'paid'
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        
        -- Get the PO number from the invoice number (remove '-INV' and add '-PO')
        po_number_var := REPLACE(NEW.invoice_number, '-INV', '-PO');
        
        -- Generate dispatch number (replace '-INV' with '-DISP')
        dispatch_number_var := REPLACE(NEW.invoice_number, '-INV', '-DISP');
        
        -- Get the sales_dispatch record
        SELECT * INTO sales_dispatch_record
        FROM sales_dispatch
        WHERE po_number = po_number_var
        LIMIT 1;
        
        -- Create dispatch record if sales_dispatch record exists
        IF sales_dispatch_record.id IS NOT NULL THEN
            INSERT INTO dispatches (
                dispatch_number,
                invoice_id,
                sales_dispatch_id,
                date_dispatched,
                type,
                trucks,
                created_by,
                created_at,
                updated_by,
                updated_at
            ) VALUES (
                dispatch_number_var,
                NEW.id,
                sales_dispatch_record.id,
                NEW.date_sent,
                'Delivery',
                COALESCE(sales_dispatch_record.trucks_required, 1),
                NEW.created_by,
                NOW(),
                NEW.updated_by,
                NOW()
            );
        END IF;
        
    -- If payment_status changed from 'paid' to 'pending', delete the dispatch
    ELSIF NEW.payment_status = 'pending' AND OLD.payment_status = 'paid' THEN
        
        -- Get the PO number from the invoice number
        po_number_var := REPLACE(NEW.invoice_number, '-INV', '-PO');
        
        -- Generate dispatch number
        dispatch_number_var := REPLACE(NEW.invoice_number, '-INV', '-DISP');
        
        -- Delete the dispatch record
        DELETE FROM dispatches 
        WHERE dispatch_number = dispatch_number_var;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER create_dispatch_on_invoice_paid_trigger
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_dispatch_on_invoice_paid();

-- Verify the trigger was created
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'create_dispatch_on_invoice_paid_trigger';
