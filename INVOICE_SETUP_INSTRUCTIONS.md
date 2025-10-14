# How to Set Up Automatic Invoice Creation

## 🎯 Goal
When a new PO is created in the `sales_dispatch` table, automatically create a corresponding invoice in the `invoices` table.

## 📋 Steps to Implement

### Step 1: Run the SQL Script in Supabase
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create_invoice_trigger.sql`
4. Click **Run** to execute the script

### Step 2: How It Works
The trigger will automatically:
- ✅ **Detect** when a new record is inserted into `sales_dispatch`
- ✅ **Generate** an invoice number (e.g., `BFLOS-007-PO` → `BFLOS-007-INV`)
- ✅ **Create** a new invoice record with:
  - `invoice_number`: Generated from PO number
  - `date_sent`: Same as `date_ordered` from PO
  - `payment_status`: Set to `'pending'`
  - `created_by`: Same as PO creator

### Step 3: Test the Setup
1. Create a new PO in your app
2. Check the `invoices` table in Supabase
3. You should see a new invoice automatically created!

## 🔧 Field Mapping

| Sales Dispatch Field | Invoice Field | Example |
|---------------------|---------------|---------|
| `po_number` | `invoice_number` | `BFLOS-007-PO` → `BFLOS-007-INV` |
| `date_ordered` | `date_sent` | `2025-10-13` |
| `created_by` | `created_by` | `Stefan Gravesande` |
| - | `payment_status` | `pending` |
| - | `id` | Auto-generated UUID |

## ✅ Expected Result
- **PO Creation**: Works perfectly (creates sales_dispatch record)
- **Invoice Creation**: Happens automatically via database trigger
- **No Frontend Errors**: No more `po_number` column errors
- **Seamless Process**: One PO creation = One invoice creation

## 🚨 Important Notes
- The trigger only fires on **INSERT** operations
- If you need to modify the trigger, run the script again (it will replace the existing one)
- The trigger is **database-level**, so it works regardless of how the PO is created (app, direct SQL, etc.)

## 🎉 Success!
Once implemented, every PO you create will automatically generate a corresponding invoice!
