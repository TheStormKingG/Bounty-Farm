-- Create atomic farm PO workflow function
-- Ultra-minimal version that only creates sales_dispatch and lets triggers handle the rest

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
  -- 1) Create sales_dispatch record (triggers will handle invoice and dispatch creation)
  insert into sales_dispatch (
    po_number, date_ordered, customer, qty, hatch_date,
    batches_required, trucks_required, created_by, updated_by
  ) values (
    p_po_number, p_date_ordered, p_customer, p_qty, p_hatch_date,
    p_batches_required, p_trucks_required, p_actor, p_actor
  ) returning id into v_sales_dispatch_id;

  -- 2) Get the most recent invoice (created by trigger)
  select i.id, i.invoice_number into v_invoice_id, v_invoice_number
  from invoices i
  order by i.created_at desc 
  limit 1;

  -- 3) Update invoice to paid status for farm customers
  update invoices 
  set payment_status = 'paid', updated_by = p_actor, updated_at = now()
  where id = v_invoice_id;

  -- 4) Get the most recent dispatch (created by trigger)
  select d.id into v_dispatch_id
  from dispatches d
  order by d.created_at desc 
  limit 1;

  -- Generate dispatch number for return
  v_dispatch_number := 'BFLOS-' || lpad(extract(epoch from now())::bigint::text, 3, '0') || '-DISP';

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
