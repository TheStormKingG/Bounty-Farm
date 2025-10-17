-- Create atomic farm PO workflow function
-- Manual approach: creates all records without relying on triggers

create or replace function public.create_farm_po_workflow(
  p_po_number text,
  p_date_ordered date,
  p_customer text,
  p_qty integer,
  p_hatch_date date,
  p_batches_required integer,
  p_trucks_required integer,
  p_actor text
) returns table (
  sales_dispatch_id uuid,
  invoice_id uuid,
  invoice_number text,
  dispatch_id uuid,
  dispatch_number text
) language plpgsql as $$
declare
  v_sales_dispatch_id uuid;
  v_invoice_id uuid;
  v_invoice_number text;
  v_dispatch_id uuid;
  v_dispatch_number text;
begin
  -- 1) Create sales_dispatch record
  insert into sales_dispatch (
    po_number, date_ordered, customer, qty, hatch_date,
    batches_required, trucks_required, created_by, updated_by
  ) values (
    p_po_number, p_date_ordered, p_customer, p_qty, p_hatch_date,
    p_batches_required, p_trucks_required, p_actor, p_actor
  ) returning id into v_sales_dispatch_id;

  -- 2) Create invoice manually (avoiding trigger issues)
  v_invoice_number := replace(p_po_number, 'PO', 'INV');
  
  insert into invoices (
    invoice_number, date_sent, payment_status, created_by, updated_by
  ) values (
    v_invoice_number, p_date_ordered, 'paid', p_actor, p_actor
  ) returning id into v_invoice_id;

  -- 3) Create dispatch manually (using only columns that exist)
  v_dispatch_number := 'BFLOS-' || lpad(extract(epoch from now())::bigint::text, 3, '0') || '-DISP';

  insert into dispatches (
    invoice_id, type, trucks, dispatch_number, date_dispatched, created_by, updated_by, type_locked
  ) values (
    v_invoice_id, 'Delivery', p_trucks_required, v_dispatch_number, p_date_ordered, p_actor, p_actor, true
  ) returning id into v_dispatch_id;

  -- Return all identifiers
  sales_dispatch_id := v_sales_dispatch_id;
  invoice_id        := v_invoice_id;
  invoice_number    := v_invoice_number;
  dispatch_id       := v_dispatch_id;
  dispatch_number   := v_dispatch_number;
  return next;
end $$;

-- Add type_locked column to dispatches table
alter table dispatches add column if not exists type_locked boolean default false;

-- Add unique constraint to prevent duplicate dispatches for same invoice
-- Note: IF NOT EXISTS not supported for constraints in older PostgreSQL versions
-- Run this only if the constraint doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_dispatch_per_invoice'
    ) THEN
        ALTER TABLE dispatches ADD CONSTRAINT unique_dispatch_per_invoice UNIQUE (invoice_id);
    END IF;
END $$;

-- Grant execute permission to authenticated users
grant execute on function public.create_farm_po_workflow to authenticated;
