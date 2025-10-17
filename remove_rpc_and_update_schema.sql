-- Remove RPC function and update schemas for new workflow
-- Run this in Supabase SQL Editor

-- 1) Drop the RPC function
DROP FUNCTION IF EXISTS public.create_farm_po_workflow(text, date, text, integer, date, integer, integer, text);

-- 2) Remove payment_status column from invoices table
ALTER TABLE public.invoices DROP COLUMN IF EXISTS payment_status;

-- 3) Add payment_status column to dispatches table
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS payment_status character varying DEFAULT 'pending';

-- 4) Create trigger function for automatic invoice and dispatch creation
CREATE OR REPLACE FUNCTION public.create_invoice_and_dispatch_on_po()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_invoice_number text;
    v_dispatch_id uuid;
    v_dispatch_number text;
    v_customer_type text;
    v_dispatch_type text;
BEGIN
    -- Generate invoice number (BFLOS-000-INV format)
    v_invoice_number := replace(NEW.po_number, 'PO', 'INV');
    
    -- Create invoice
    INSERT INTO invoices (
        invoice_number, date_sent, created_by, updated_by
    ) VALUES (
        v_invoice_number, NEW.date_ordered, NEW.created_by, NEW.updated_by
    ) RETURNING id INTO v_invoice_id;
    
    -- Determine customer type and dispatch type
    -- Check if customer exists in farm_customers table
    IF EXISTS (SELECT 1 FROM farm_customers WHERE farm_name = NEW.customer) THEN
        v_customer_type := 'Farm';
        v_dispatch_type := 'Delivery';
    ELSE
        v_customer_type := 'Individual';
        v_dispatch_type := 'Pick Up';
    END IF;
    
    -- Generate dispatch number (BFLOS-000-DISP format)
    v_dispatch_number := replace(NEW.po_number, 'PO', 'DISP');
    
    -- Create dispatch
    INSERT INTO dispatches (
        dispatch_number, invoice_id, date_dispatched, type, trucks,
        payment_status, created_by, updated_by, type_locked
    ) VALUES (
        v_dispatch_number, v_invoice_id, NEW.date_ordered, v_dispatch_type, NEW.trucks_required,
        'pending', NEW.created_by, NEW.updated_by, 
        CASE WHEN v_customer_type = 'Farm' THEN true ELSE false END
    ) RETURNING id INTO v_dispatch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5) Create trigger on sales_dispatch table
DROP TRIGGER IF EXISTS trigger_create_invoice_and_dispatch ON sales_dispatch;
CREATE TRIGGER trigger_create_invoice_and_dispatch
    AFTER INSERT ON sales_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION public.create_invoice_and_dispatch_on_po();

-- 6) Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_invoice_and_dispatch_on_po() TO authenticated;
