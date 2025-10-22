-- Create triggers for automatic invoice and dispatch creation
-- This ensures that when a PO is created, the appropriate invoice and dispatch are created

-- First, create a function to create invoice and dispatch
CREATE OR REPLACE FUNCTION create_invoice_and_dispatch_on_po()
RETURNS TRIGGER AS $$
DECLARE
    invoice_id UUID;
    dispatch_id UUID;
    invoice_number TEXT;
    dispatch_number TEXT;
    dispatch_type TEXT;
    customer_type TEXT;
BEGIN
    -- Generate invoice number from PO number
    invoice_number := REPLACE(NEW.po_number, '-PO', '-INV');
    
    -- Generate dispatch number from PO number
    dispatch_number := REPLACE(NEW.po_number, '-PO', '-DISP');
    
    -- Determine customer type and dispatch type
    IF EXISTS (SELECT 1 FROM farm_customers WHERE farm_name = NEW.customer) THEN
        customer_type := 'Farm';
        dispatch_type := 'Delivery';
    ELSE
        customer_type := 'Individual';
        dispatch_type := 'Pick Up';
    END IF;
    
    -- Create invoice
    INSERT INTO invoices (
        invoice_number,
        date_sent,
        created_by,
        updated_by
    ) VALUES (
        invoice_number,
        NEW.date_ordered,
        NEW.created_by,
        NEW.updated_by
    ) RETURNING id INTO invoice_id;
    
    -- Create dispatch
    INSERT INTO dispatches (
        dispatch_number,
        invoice_id,
        date_dispatched,
        type,
        trucks,
        created_by,
        updated_by
    ) VALUES (
        dispatch_number,
        invoice_id,
        NEW.date_ordered,
        dispatch_type,
        NEW.trucks_required,
        NEW.created_by,
        NEW.updated_by
    ) RETURNING id INTO dispatch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on sales_dispatch table
DROP TRIGGER IF EXISTS trigger_create_invoice_and_dispatch ON sales_dispatch;
CREATE TRIGGER trigger_create_invoice_and_dispatch
    AFTER INSERT ON sales_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_and_dispatch_on_po();

-- Verify the trigger was created
SELECT 'Trigger created successfully' as status;
