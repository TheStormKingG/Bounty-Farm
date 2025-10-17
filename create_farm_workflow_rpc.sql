-- Create atomic farm PO workflow function
-- This replaces the fragile setTimeout + lookup pattern with a single transaction

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
  v_invoice_id uuid;
  v_invoice_number text;
  v_dispatch_id uuid;
  v_dispatch_number text;
begin
  -- 1) sales_dispatch
  insert into sales_dispatch (
    po_number, date_ordered, customer, qty, hatch_date,
    batches_required, trucks_required, created_by, updated_by
  ) values (
    p_po_number, p_date_ordered, p_customer, p_qty, p_hatch_date,
    p_batches_required, p_trucks_required, p_actor, p_actor
  ) returning id into sales_dispatch_id;

  -- 2) invoice (paid now; customer_type = 'Farm')
  insert into invoices (
    customer, customerType, qty, hatch_date, payment_status, created_by, updated_by
  ) values (
    p_customer, 'Farm', p_qty, p_hatch_date, 'paid', p_actor, p_actor
  ) returning id, invoice_number into v_invoice_id, v_invoice_number;

  -- 3) dispatch (Delivery, locked)
  v_dispatch_number := 'BFLOS-' || lpad(extract(epoch from now())::bigint::text, 3, '0') || '-DISP';

  insert into dispatches (
    invoice_id, customer, customer_type, type, qty, trucks,
    dispatch_number, hatch_date, created_by, updated_by, type_locked
  ) values (
    v_invoice_id, p_customer, 'Farm', 'Delivery', p_qty, p_trucks_required,
    v_dispatch_number, p_hatch_date, p_actor, p_actor, true
  ) returning id into v_dispatch_id;

  -- 4) dispatch_note (optional: store rendered HTML later)
  -- Note: dispatch_notes table may not exist, so we'll skip this for now
  -- insert into dispatch_notes (dispatch_id, created_by) values (v_dispatch_id, p_actor);

  -- Return all identifiers
  sales_dispatch_id := sales_dispatch_id;
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
