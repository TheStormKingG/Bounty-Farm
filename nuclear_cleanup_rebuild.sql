-- NUCLEAR OPTION: Complete cleanup and rebuild
-- Run this in Supabase SQL Editor

-- 1) Drop EVERYTHING with CASCADE to ensure complete cleanup
DROP TRIGGER IF EXISTS trigger_create_invoice_and_dispatch ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS trigger_create_invoice ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS trigger_create_dispatch ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS create_invoice_on_po_insert ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS create_dispatch_on_invoice_paid_trigger ON invoices CASCADE;
DROP TRIGGER IF EXISTS create_dispatch_on_invoice_paid ON invoices CASCADE;
DROP TRIGGER IF EXISTS trigger_create_dispatch_on_invoice_paid ON invoices CASCADE;

-- 2) Drop ALL functions with CASCADE
DROP FUNCTION IF EXISTS public.create_invoice_and_dispatch_on_po() CASCADE;
DROP FUNCTION IF EXISTS public.create_invoice_on_po_insert() CASCADE;
DROP FUNCTION IF EXISTS public.create_dispatch_on_invoice_paid() CASCADE;
DROP FUNCTION IF EXISTS public.create_invoice_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.create_farm_po_workflow(text, date, text, integer, date, integer, integer, text) CASCADE;

-- 3) Remove payment_status from invoices table
ALTER TABLE public.invoices DROP COLUMN IF EXISTS payment_status;

-- 4) Add payment_status to dispatches table
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS payment_status character varying DEFAULT 'pending';

-- 5) Create completely new trigger function
CREATE OR REPLACE FUNCTION public.create_invoice_and_dispatch_on_po()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_invoice_number text;
    v_dispatch_id uuid;
    v_dispatch_number text;
    v_dispatch_type text;
BEGIN
    -- Generate invoice number (BFLOS-000-INV format)
    v_invoice_number := replace(NEW.po_number, 'PO', 'INV');
    
    -- Create invoice (NO payment_status column)
    INSERT INTO invoices (
        invoice_number, date_sent, created_by, updated_by
    ) VALUES (
        v_invoice_number, NEW.date_ordered, NEW.created_by, NEW.updated_by
    ) RETURNING id INTO v_invoice_id;
    
    -- Determine dispatch type based on customer
    IF EXISTS (SELECT 1 FROM farm_customers WHERE farm_name = NEW.customer) THEN
        v_dispatch_type := 'Delivery';
    ELSE
        v_dispatch_type := 'Pick Up';
    END IF;
    
    -- Generate dispatch number (BFLOS-000-DISP format)
    v_dispatch_number := replace(NEW.po_number, 'PO', 'DISP');
    
    -- Create dispatch (WITH payment_status column)
    INSERT INTO dispatches (
        dispatch_number, invoice_id, date_dispatched, type, trucks,
        payment_status, created_by, updated_by, type_locked
    ) VALUES (
        v_dispatch_number, v_invoice_id, NEW.date_ordered, v_dispatch_type, NEW.trucks_required,
        'pending', NEW.created_by, NEW.updated_by, 
        CASE WHEN v_dispatch_type = 'Delivery' THEN true ELSE false END
    ) RETURNING id INTO v_dispatch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) Create new trigger
CREATE TRIGGER trigger_create_invoice_and_dispatch
    AFTER INSERT ON sales_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION public.create_invoice_and_dispatch_on_po();

-- 7) Grant permissions
GRANT EXECUTE ON FUNCTION public.create_invoice_and_dispatch_on_po() TO authenticated;

-- 8) Verify success
SELECT 'Nuclear cleanup and rebuild completed successfully' as status;
