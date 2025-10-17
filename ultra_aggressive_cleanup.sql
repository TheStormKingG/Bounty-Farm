-- ULTRA AGGRESSIVE CLEANUP: Find and destroy ALL payment_status references
-- Run this in Supabase SQL Editor

-- 1) First, let's see what's currently active
SELECT 'Current triggers on sales_dispatch:' as info;
SELECT trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'sales_dispatch';

SELECT 'Current triggers on invoices:' as info;
SELECT trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'invoices';

SELECT 'Functions that reference payment_status:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%payment_status%' 
AND routine_schema = 'public';

-- 2) Drop EVERY possible trigger name with CASCADE
DROP TRIGGER IF EXISTS trigger_create_invoice_and_dispatch ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS trigger_create_invoice ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS trigger_create_dispatch ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS create_invoice_on_po_insert ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS create_dispatch_on_invoice_paid_trigger ON invoices CASCADE;
DROP TRIGGER IF EXISTS create_dispatch_on_invoice_paid ON invoices CASCADE;
DROP TRIGGER IF EXISTS trigger_create_dispatch_on_invoice_paid ON invoices CASCADE;
DROP TRIGGER IF EXISTS create_invoice_trigger ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS create_dispatch_trigger ON invoices CASCADE;
DROP TRIGGER IF EXISTS invoice_creation_trigger ON sales_dispatch CASCADE;
DROP TRIGGER IF EXISTS dispatch_creation_trigger ON invoices CASCADE;

-- 3) Drop EVERY possible function with CASCADE
DROP FUNCTION IF EXISTS public.create_invoice_and_dispatch_on_po() CASCADE;
DROP FUNCTION IF EXISTS public.create_invoice_on_po_insert() CASCADE;
DROP FUNCTION IF EXISTS public.create_dispatch_on_invoice_paid() CASCADE;
DROP FUNCTION IF EXISTS public.create_invoice_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.create_farm_po_workflow(text, date, text, integer, date, integer, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_invoice_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.create_dispatch_on_paid() CASCADE;
DROP FUNCTION IF EXISTS public.invoice_creation_function() CASCADE;
DROP FUNCTION IF EXISTS public.dispatch_creation_function() CASCADE;

-- 4) Force remove payment_status column from invoices
ALTER TABLE public.invoices DROP COLUMN IF EXISTS payment_status CASCADE;

-- 5) Add payment_status to dispatches table
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS payment_status character varying DEFAULT 'pending';

-- 6) Create completely new, simple trigger function
CREATE OR REPLACE FUNCTION public.create_invoice_and_dispatch_on_po()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_invoice_number text;
    v_dispatch_id uuid;
    v_dispatch_number text;
    v_dispatch_type text;
BEGIN
    -- Generate invoice number
    v_invoice_number := replace(NEW.po_number, 'PO', 'INV');
    
    -- Create invoice (NO payment_status)
    INSERT INTO invoices (
        invoice_number, date_sent, created_by, updated_by
    ) VALUES (
        v_invoice_number, NEW.date_ordered, NEW.created_by, NEW.updated_by
    ) RETURNING id INTO v_invoice_id;
    
    -- Determine dispatch type
    IF EXISTS (SELECT 1 FROM farm_customers WHERE farm_name = NEW.customer) THEN
        v_dispatch_type := 'Delivery';
    ELSE
        v_dispatch_type := 'Pick Up';
    END IF;
    
    -- Generate dispatch number
    v_dispatch_number := replace(NEW.po_number, 'PO', 'DISP');
    
    -- Create dispatch (WITH payment_status)
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

-- 7) Create new trigger
CREATE TRIGGER trigger_create_invoice_and_dispatch
    AFTER INSERT ON sales_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION public.create_invoice_and_dispatch_on_po();

-- 8) Grant permissions
GRANT EXECUTE ON FUNCTION public.create_invoice_and_dispatch_on_po() TO authenticated;

-- 9) Verify final state
SELECT 'Final verification - triggers on sales_dispatch:' as info;
SELECT trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'sales_dispatch';

SELECT 'Final verification - payment_status in invoices:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name = 'payment_status';

SELECT 'Final verification - payment_status in dispatches:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'dispatches' 
AND column_name = 'payment_status';

SELECT 'Ultra aggressive cleanup completed successfully' as status;
