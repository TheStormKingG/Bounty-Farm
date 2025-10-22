import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';
import html2pdf from 'html2pdf.js';

// Custom CSS for sticky columns
const stickyColumnStyles = `
  .sticky-column-1 {
    position: sticky !important;
    left: 0px !important;
    background-color: #ff8c42 !important;
    z-index: 10 !important;
  }
  
  .sticky-column-2 {
    position: sticky !important;
    left: 120px !important;
    background-color: #ff8c42 !important;
    z-index: 10 !important;
  }
  
  .sticky-column-3 {
    position: sticky !important;
    left: 240px !important;
    background-color: #ff8c42 !important;
    z-index: 10 !important;
  }
  
  .sticky-header-1 {
    position: sticky !important;
    left: 0px !important;
    background-color: #ff8c42 !important;
    z-index: 20 !important;
  }
  
  .sticky-header-2 {
    position: sticky !important;
    left: 120px !important;
    background-color: #ff8c42 !important;
    z-index: 20 !important;
  }
  
  .sticky-header-3 {
    position: sticky !important;
    left: 240px !important;
    background-color: #ff8c42 !important;
    z-index: 20 !important;
  }
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = stickyColumnStyles;
  document.head.appendChild(styleSheet);
}

type CustomerType = 'Farm' | 'Individual';
type NewRecordData = Partial<SalesDispatch> & { customerType?: CustomerType };

interface SalesDispatch {
  id: string;
  poNumber: string;
  dateOrdered: string;
  customer: string;
  qty: number;
  hatchDate: string;
  batchesRequired: number;
  trucksRequired: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

const Sales: React.FC = () => {
  const { user } = useAuth();
  const [salesDispatch, setSalesDispatch] = useState<SalesDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  
  // Filtering and search state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rowCount, setRowCount] = useState('50');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Invoice table state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceDates, setInvoiceDates] = useState<{[key: string]: string}>({});
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SalesDispatch | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [newRecordData, setNewRecordData] = useState<NewRecordData>({});
  
  // Customer data state
  const [farmCustomers, setFarmCustomers] = useState<any[]>([]);
  const [individualCustomers, setIndividualCustomers] = useState<any[]>([]);

  // Ref for PDF generation
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      // Fetch farm customers
      const { data: farmData, error: farmError } = await supabase
        .from('farm_customers')
        .select('*')
        .order('farm_name', { ascending: true });

      if (farmError) {
        console.error('Error fetching farm customers:', farmError);
      } else {
        setFarmCustomers(farmData || []);
      }

      // Fetch individual customers
      const { data: individualData, error: individualError } = await supabase
        .from('individual_customers')
        .select('*')
        .order('name', { ascending: true });

      if (individualError) {
        console.error('Error fetching individual customers:', individualError);
      } else {
        setIndividualCustomers(individualData || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching customers:', err);
    }
  };

  useEffect(() => {
    const fetchSalesDispatch = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('sales_dispatch')
          .select('*')
          .order('date_ordered', { ascending: false });

        if (error) {
          console.error('Error fetching sales dispatch records:', error);
          setError('Failed to fetch sales dispatch records from database');
          setSalesDispatch([]);
        } else {
          const mappedRecords: SalesDispatch[] = (data || []).map((record: any) => ({
            id: record.id,
            poNumber: record.po_number,
            dateOrdered: record.date_ordered,
            customer: record.customer,
            qty: record.qty,
            hatchDate: record.hatch_date,
            batchesRequired: record.batches_required,
            trucksRequired: record.trucks_required,
            createdBy: record.created_by || 'admin',
            createdAt: record.created_at || new Date().toISOString(),
            updatedBy: record.updated_by || 'admin',
            updatedAt: record.updated_at || new Date().toISOString(),
          }));
          setSalesDispatch(mappedRecords);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Database connection failed');
        setSalesDispatch([]);
      } finally {
        setLoading(false);
      }
    };

    const initializeData = async () => {
      await fetchCustomers();
      await fetchSalesDispatch();
      await fetchInvoices();
    };

    initializeData();
  }, []); // ✅ this closes the effect properly

  const fetchInvoices = async () => {
    try {
      // First, get all farm customer names
      const { data: farmCustomers } = await supabase
        .from('farm_customers')
        .select('farm_name');

      const farmCustomerNames = farmCustomers?.map(fc => fc.farm_name) || [];

      // Fetch all invoices
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        return;
      }

      // Get all sales_dispatch records to match with invoices
      const { data: salesDispatchData } = await supabase
        .from('sales_dispatch')
        .select('po_number, customer');

      // Create a map of PO numbers to customers
      const poToCustomerMap = new Map();
      salesDispatchData?.forEach(sd => {
        poToCustomerMap.set(sd.po_number, sd.customer);
      });

      // Filter out farm customer invoices
      const individualInvoices = data?.filter(invoice => {
        // Convert invoice number to PO number to find the customer
        const poNumber = invoice.invoice_number.replace('-INV', '-PO');
        const customer = poToCustomerMap.get(poNumber);
        return customer && !farmCustomerNames.includes(customer);
      }) || [];

      setInvoices(individualInvoices);
      
      // Initialize invoice dates only (no payment status handling)
      const dates: {[key: string]: string} = {};
      
      individualInvoices.forEach(invoice => {
        dates[invoice.invoice_number] = invoice.date_sent || '';
      });
      
      setInvoiceDates(dates);
    } catch (err) {
      console.error('Unexpected error fetching invoices:', err);
    }
  };

  // Process and filter sales dispatch records
  const processedRecords = useMemo(() => {
    let filtered = [...salesDispatch];

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.dateOrdered);
        return recordDate >= start && recordDate <= end;
      });
    }

    // Search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.poNumber.toLowerCase().includes(searchLower) ||
        record.customer.toLowerCase().includes(searchLower) ||
        record.createdBy.toLowerCase().includes(searchLower) ||
        record.updatedBy.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof SalesDispatch];
        let bValue: any = b[sortColumn as keyof SalesDispatch];

        // Handle date sorting
        if (sortColumn === 'dateOrdered' || sortColumn === 'hatchDate' || sortColumn === 'createdAt' || sortColumn === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        // Handle number sorting
        if (sortColumn === 'qty' || sortColumn === 'batchesRequired' || sortColumn === 'trucksRequired') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [salesDispatch, startDate, endDate, searchTerm, sortColumn, sortDirection]);

  // Generate next PO number
  const generateNextPONumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('sales_dispatch')
        .select('po_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last PO number:', error);
        return 'BFLOS-001-PO';
      }

      if (!data || data.length === 0) {
        return 'BFLOS-001-PO';
      }

      const lastPONumber = data[0].po_number;
      const match = lastPONumber.match(/BFLOS-(\d+)-PO/);
      
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        return `BFLOS-${nextNumber.toString().padStart(3, '0')}-PO`;
      }

      return 'BFLOS-001-PO';
    } catch (error) {
      console.error('Error generating PO number:', error);
      return 'BFLOS-001-PO';
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleDateChange = (invoiceNumber: string, date: string) => {
    setInvoiceDates(prev => ({
            ...prev,
      [invoiceNumber]: date
        }));
    };


  // Function to download invoice as PDF
  const downloadInvoicePDF = () => {
    if (!invoiceRef.current) {
      console.error('Invoice content not found');
      return;
    }

    const element = invoiceRef.current;
    const filename = `Invoice-${currentInvoice?.invoice_number || 'Unknown'}.pdf`;
    
    const opt = {
      margin: 0.3,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' as const
      }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Function to calculate invoice totals
  const calculateInvoiceTotals = (usedHatches: any[]) => {
    const subtotal = usedHatches.reduce((sum, hatch) => {
      return sum + ((hatch.chicksUsed || 0) * 200);
    }, 0);
    
    const invoiceDiscount = 0; // No discount for now
    const vatRate = 0; // 0% VAT
    const vatAmount = 0; // No VAT
    const total = subtotal - invoiceDiscount + vatAmount;
    
    return {
      subtotal,
      invoiceDiscount,
      vatAmount,
      total
    };
  };

  // Function to get customer details for invoice
  const getCustomerDetails = async (customerName: string, customerType: string) => {
    console.log('Fetching customer details for:', customerName, 'Type:', customerType);
    
    try {
      if (customerType === 'Farm') {
        console.log('Searching in farm_customers table for farm_name:', customerName);
        const { data: farmData, error } = await supabase
          .from('farm_customers')
          .select('farm_name, farm_address, contact_person, contact_number')
          .eq('farm_name', customerName)
          .single();
          
        console.log('Farm data result:', farmData, 'Error:', error);
        
        if (!error && farmData) {
          return {
            name: farmData.farm_name,
            address: farmData.farm_address,
            contactPerson: farmData.contact_person,
            contactNumber: farmData.contact_number,
            type: 'Farm'
          };
        }
      } else if (customerType === 'Individual') {
        console.log('Searching in individual_customers table for name:', customerName);
        const { data: individualData, error } = await supabase
          .from('individual_customers')
          .select('name, address, phone_number')
          .eq('name', customerName)
          .single();
          
        console.log('Individual data result:', individualData, 'Error:', error);
        
        if (!error && individualData) {
          return {
            name: individualData.name,
            address: individualData.address,
            contactNumber: individualData.phone_number,
            type: 'Individual'
          };
        }
      }
      
      // If no specific type or not found, try both tables
      console.log('Trying both tables as fallback...');
      
      // Try farm customers first (search by farm_name)
      const { data: farmData, error: farmError } = await supabase
        .from('farm_customers')
        .select('farm_name, farm_address, contact_person, contact_number')
        .eq('farm_name', customerName)
        .single();
        
      if (!farmError && farmData) {
        console.log('Found in farm_customers:', farmData);
        return {
          name: farmData.farm_name,
          address: farmData.farm_address,
          contactPerson: farmData.contact_person,
          contactNumber: farmData.contact_number,
          type: 'Farm'
        };
      }
      
      // Try individual customers (search by name)
      const { data: individualData, error: individualError } = await supabase
        .from('individual_customers')
        .select('name, address, phone_number')
        .eq('name', customerName)
        .single();
        
      if (!individualError && individualData) {
        console.log('Found in individual_customers:', individualData);
        return {
          name: individualData.name,
          address: individualData.address,
          contactNumber: individualData.phone_number,
          type: 'Individual'
        };
      }
      
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
    
    // Fallback to default values
    console.log('Using fallback values for customer:', customerName);
    return {
      name: customerName || 'EAT INS FARMS',
      address: 'COWAN & HIGH STREET',
      contactPerson: 'RECHANNA RAHAMAN',
      contactNumber: '+5926335874',
      type: customerType || 'Farm'
    };
  };

  // Function to handle viewing invoice
  const handleViewInvoice = async (invoice: any) => {
    console.log('Viewing invoice:', invoice);
    console.log('Invoice fields:', Object.keys(invoice));
    setCurrentInvoice(invoice);
    
    // First, try to get customer details from the invoice
    let customerName = invoice.customer;
    let customerType = invoice.customerType;
    
    // If not in invoice, try to get from sales_dispatch
    if (!customerName) {
      console.log('Customer info not in invoice, fetching from sales_dispatch...');
      try {
        const { data: salesData, error: salesError } = await supabase
          .from('sales_dispatch')
          .select('customer')
          .eq('po_number', invoice.po_number || invoice.invoice_number?.replace('INV', 'PO'))
          .single();
          
        if (!salesError && salesData) {
          customerName = salesData.customer;
          console.log('Found customer info from sales_dispatch:', customerName);
        }
      } catch (error) {
        console.error('Error fetching customer from sales_dispatch:', error);
      }
    }
    
    // Determine customer type by checking which table the customer exists in
    if (customerName && !customerType) {
      console.log('Determining customer type for:', customerName);
      
      // Try farm customers first
      const { data: farmData, error: farmError } = await supabase
        .from('farm_customers')
        .select('farm_name')
        .eq('farm_name', customerName)
        .single();
        
      if (!farmError && farmData) {
        customerType = 'Farm';
        console.log('Customer found in farm_customers, type: Farm');
      } else {
        // Try individual customers
        const { data: individualData, error: individualError } = await supabase
          .from('individual_customers')
          .select('name')
          .eq('name', customerName)
          .single();
          
        if (!individualError && individualData) {
          customerType = 'Individual';
          console.log('Customer found in individual_customers, type: Individual');
        } else {
          console.log('Customer not found in either table, defaulting to Farm');
          customerType = 'Farm'; // Default fallback
        }
      }
    }
    
    console.log('Final customer info:', customerName, customerType);
    
    // Fetch customer details
    const customerDetails = await getCustomerDetails(customerName, customerType);
    console.log('Customer details:', customerDetails);
    
    // Fetch hatch details for this invoice
    try {
      // First, try to get hatch_date from the invoice
      let hatchDate = invoice.hatch_date;
      
      // If no hatch_date in invoice, try to get it from sales_dispatch
      if (!hatchDate) {
        console.log('No hatch_date in invoice, fetching from sales_dispatch...');
        const { data: salesData, error: salesError } = await supabase
          .from('sales_dispatch')
          .select('hatch_date, qty')
          .eq('po_number', invoice.po_number || invoice.invoice_number?.replace('INV', 'PO'))
          .single();
          
        if (!salesError && salesData) {
          hatchDate = salesData.hatch_date;
          // Also get the quantity from sales_dispatch if invoice quantity is 0
          if ((invoice.qty || 0) === 0 && salesData.qty) {
            invoice.qty = salesData.qty;
            console.log('Updated invoice quantity from sales_dispatch:', salesData.qty);
          }
          console.log('Found hatch_date from sales_dispatch:', hatchDate);
        }
      }
      
      if (hatchDate) {
        console.log('Fetching hatch data for date:', hatchDate);
        const { data: hatchData, error } = await supabase
          .from('hatch_cycles')
          .select('hatch_no, chicks_hatched')
          .eq('hatch_date', hatchDate)
          .not('chicks_hatched', 'is', null)
          .gt('chicks_hatched', 0)
          .order('chicks_hatched', { ascending: false });

        console.log('Hatch data fetched:', hatchData);

        if (!error && hatchData && hatchData.length > 0) {
          // Calculate which hatches were used (same logic as calculateBatchesRequired)
          const quantity = invoice.qty || 0;
          let remainingQuantity = quantity;
          const usedHatches: Array<{hatchNo: string, chicksUsed: number}> = [];

          console.log('Calculating used hatches for quantity:', quantity);

          // First pass: Use largest hatches first
          for (const hatch of hatchData) {
            if (remainingQuantity <= 0) break;
            
            const chicksAvailable = hatch.chicks_hatched || 0;
            const chicksToUse = Math.min(remainingQuantity, chicksAvailable);
            
            if (chicksToUse > 0) {
              remainingQuantity -= chicksToUse;
              usedHatches.push({
                hatchNo: hatch.hatch_no,
                chicksUsed: chicksToUse
              });
              console.log(`Using hatch ${hatch.hatch_no}: ${chicksToUse} chicks`);
            }
          }

          // If we still need more chicks, find the closest match
          if (remainingQuantity > 0) {
            const unusedHatches = hatchData.filter(h => 
              !usedHatches.some(uh => uh.hatchNo === h.hatch_no)
            );
            
            if (unusedHatches.length > 0) {
              const closestHatch = unusedHatches.reduce((closest, current) => {
                const currentDiff = Math.abs((current.chicks_hatched || 0) - remainingQuantity);
                const closestDiff = Math.abs((closest.chicks_hatched || 0) - remainingQuantity);
                return currentDiff < closestDiff ? current : closest;
              }, unusedHatches[0]);

              usedHatches.push({
                hatchNo: closestHatch.hatch_no,
                chicksUsed: Math.min(remainingQuantity, closestHatch.chicks_hatched || 0)
              });
              console.log(`Using closest hatch ${closestHatch.hatch_no}: ${Math.min(remainingQuantity, closestHatch.chicks_hatched || 0)} chicks`);
            }
          }

          console.log('Final used hatches:', usedHatches);

          // Add hatch details and customer details to invoice object
          setCurrentInvoice({
            ...invoice,
            usedHatches: usedHatches,
            customerDetails: customerDetails
          });
        } else {
          console.log('No hatch data found or error:', error);
          // Set empty usedHatches if no data found
          setCurrentInvoice({
            ...invoice,
            usedHatches: [],
            customerDetails: customerDetails
          });
        }
      } else {
        console.log('No hatch_date found for invoice');
        // Set empty usedHatches if no hatch_date
        setCurrentInvoice({
          ...invoice,
          usedHatches: [],
          customerDetails: customerDetails
        });
      }
    } catch (error) {
      console.error('Error fetching hatch details:', error);
      // Set empty usedHatches on error
      setCurrentInvoice({
        ...invoice,
        usedHatches: [],
        customerDetails: customerDetails
      });
    }
    
    setIsInvoiceModalVisible(true);
  };

  // Handler functions for new functionality
  const handleStatusToggle = async (id: string, type: 'invoice') => {
    try {
      if (type === 'invoice') {
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice) {
          const newStatus = invoice.status === 'paid' ? 'pending' : 'paid';
          
          // Update invoice status
          await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', id);
          
          // If changing to paid, create a dispatch
          if (newStatus === 'paid') {
            // Find the corresponding sales_dispatch record
            const poNumber = invoice.invoice_number.replace('-INV', '-PO');
            const { data: salesData } = await supabase
              .from('sales_dispatch')
              .select('*')
              .eq('po_number', poNumber)
              .single();
            
            if (salesData) {
              // Check if dispatch already exists to prevent 409 conflict
              const dispatchNumber = poNumber.replace('-PO', '-DISP');
              const { data: existingDispatch } = await supabase
                .from('dispatches')
                .select('id')
                .eq('dispatch_number', dispatchNumber)
                .single();
              
              if (!existingDispatch) {
                // Create dispatch only if it doesn't exist
                await supabase
                  .from('dispatches')
                  .insert({
                    dispatch_number: dispatchNumber,
                    invoice_id: invoice.id,
                    date_dispatched: new Date().toISOString().split('T')[0],
                    type: 'Pick Up',
                    trucks: salesData.trucks_required || 1,
                    created_by: 'admin',
                    updated_by: 'admin'
                  });
              }
            }
          }
          
          setInvoices(prev => prev.map(inv => 
            inv.id === id ? { ...inv, status: newStatus } : inv
          ));
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await supabase
          .from('invoices')
          .delete()
          .eq('id', id);
        
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  // Function to find hatches by date and calculate batches required
  const calculateBatchesRequired = async (hatchDate: string, quantity: number): Promise<number> => {
    try {
      // Fetch hatches that hatched on the specified date
      const { data, error } = await supabase
        .from('hatch_cycles')
        .select('hatch_no, chicks_hatched')
        .eq('hatch_date', hatchDate)
        .not('chicks_hatched', 'is', null)
        .gt('chicks_hatched', 0);

      if (error) {
        console.error('Error fetching hatches:', error);
        return 1; // Default fallback
      }

      if (!data || data.length === 0) {
        console.warn(`No hatches found for date ${hatchDate}`);
        return 1; // Default fallback
      }

      // Sort hatches by chicks_hatched (largest first)
      const sortedHatches = data.sort((a, b) => (b.chicks_hatched || 0) - (a.chicks_hatched || 0));
      
      let remainingQuantity = quantity;
      let batchesRequired = 0;
      const usedHatches: Array<{hatchNo: string, chicksUsed: number}> = [];

      // First pass: Use largest hatches first
      for (const hatch of sortedHatches) {
        if (remainingQuantity <= 0) break;
        
        const chicksAvailable = hatch.chicks_hatched || 0;
        const chicksToUse = Math.min(remainingQuantity, chicksAvailable);
        
        if (chicksToUse > 0) {
          remainingQuantity -= chicksToUse;
          batchesRequired++;
          usedHatches.push({
            hatchNo: hatch.hatch_no,
            chicksUsed: chicksToUse
          });
        }
      }

      // If we still need more chicks, find the closest match
      if (remainingQuantity > 0) {
        const unusedHatches = sortedHatches.filter(h => 
          !usedHatches.some(uh => uh.hatchNo === h.hatch_no)
        );
        
        // Find hatch with chicks closest to remaining quantity
        const closestHatch = unusedHatches.reduce((closest, current) => {
          const currentDiff = Math.abs((current.chicks_hatched || 0) - remainingQuantity);
          const closestDiff = Math.abs((closest.chicks_hatched || 0) - remainingQuantity);
          return currentDiff < closestDiff ? current : closest;
        }, unusedHatches[0]);

        if (closestHatch) {
          batchesRequired++;
          usedHatches.push({
            hatchNo: closestHatch.hatch_no,
            chicksUsed: Math.min(remainingQuantity, closestHatch.chicks_hatched || 0)
          });
        }
      }

      console.log(`Calculated ${batchesRequired} batches for ${quantity} chicks using hatches:`, usedHatches);
      return batchesRequired;

    } catch (error) {
      console.error('Error calculating batches required:', error);
      return 1; // Default fallback
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
    if (!newRecordData.poNumber || !newRecordData.customer || !newRecordData.qty) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      // Check if customer is a farm customer
      const isFarmCustomer = farmCustomers.some(farm => farm.farm_name === newRecordData.customer);
      console.log('Customer type check:', { customer: newRecordData.customer, isFarmCustomer });
      
      // Calculate batches required based on hatch date and quantity
      const batchesRequired = await calculateBatchesRequired(
        newRecordData.hatchDate || '', 
        newRecordData.qty || 0
      );
      
      // Calculate trucks required based on quantity (1 truck = 56,000 chicks)
      const trucksRequired = Math.ceil((newRecordData.qty || 0) / 56000);
      
      const { data, error } = await supabase
        .from('sales_dispatch')
        .insert([{
          po_number: newRecordData.poNumber,
          date_ordered: newRecordData.dateOrdered,
          customer: newRecordData.customer,
          qty: newRecordData.qty,
          hatch_date: newRecordData.hatchDate,
          batches_required: batchesRequired,
          trucks_required: trucksRequired,
          created_by: user?.name || 'admin',
          updated_by: user?.name || 'admin',
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating sales dispatch record:', error);
        setError('Failed to create sales dispatch record: ' + error.message);
        return;
      }

      const newRecord: SalesDispatch = {
        id: data.id,
        poNumber: data.po_number,
        dateOrdered: data.date_ordered,
        customer: data.customer,
        qty: data.qty,
        hatchDate: data.hatch_date,
        batchesRequired: data.batches_required,
        trucksRequired: data.trucks_required,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
      };

      setSalesDispatch(prev => [newRecord, ...prev]);
      
      // Database trigger will automatically create invoice and dispatch
      // No need for RPC or manual payment status handling
      alert(`Sales dispatch record "${newRecord.poNumber}" added successfully! Invoice and dispatch created automatically.`);
      
      // Refresh invoices to show the newly created invoice (from database trigger)
      await fetchInvoices();
      
      setIsAddModalVisible(false);
      setNewRecordData({});
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while adding sales dispatch record');
    }
  };

  const handleEditRecord = (record: SalesDispatch) => {
    setCurrentRecord(record);
    setNewRecordData({
      poNumber: record.poNumber,
      dateOrdered: record.dateOrdered,
      customer: record.customer,
      qty: record.qty,
      hatchDate: record.hatchDate,
      batchesRequired: record.batchesRequired,
      trucksRequired: record.trucksRequired,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
        e.preventDefault();
    if (!currentRecord) return;
    
    if (!newRecordData.poNumber || !newRecordData.customer || !newRecordData.qty) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('sales_dispatch')
        .update({
          po_number: newRecordData.poNumber,
          date_ordered: newRecordData.dateOrdered,
          customer: newRecordData.customer,
          qty: newRecordData.qty,
          hatch_date: newRecordData.hatchDate,
          batches_required: newRecordData.batchesRequired,
          trucks_required: newRecordData.trucksRequired,
          updated_by: user?.name || 'admin',
        })
        .eq('id', currentRecord.id);

      if (error) {
        console.error('Error updating sales dispatch record:', error);
        setError('Failed to update sales dispatch record');
        return;
      }

      setSalesDispatch(prev => prev.map(r => 
        r.id === currentRecord.id 
          ? { 
              ...r, 
              poNumber: newRecordData.poNumber!,
              dateOrdered: newRecordData.dateOrdered!,
              customer: newRecordData.customer!,
              qty: newRecordData.qty!,
              hatchDate: newRecordData.hatchDate!,
              batchesRequired: newRecordData.batchesRequired!,
              trucksRequired: newRecordData.trucksRequired!,
              updatedBy: user?.name || 'admin', 
              updatedAt: new Date().toISOString() 
            }
          : r
      ));
      setIsEditModalVisible(false);
      setCurrentRecord(null);
      setNewRecordData({});
      alert(`Sales dispatch record "${newRecordData.poNumber}" updated successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while updating sales dispatch record');
    }
  };

  const handleDeleteRecord = async (recordId: string, poNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete the sales dispatch record "${poNumber}"?`)) {
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('sales_dispatch')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting sales dispatch record:', error);
        setError('Failed to delete sales dispatch record');
        return;
      }

      setSalesDispatch(prev => prev.filter(r => r.id !== recordId));
      alert('Sales dispatch record deleted successfully');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while deleting sales dispatch record');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
    setNewRecordData(prev => ({
            ...prev,
            [name]: isNumber ? (value === '' ? undefined : Number(value)) : value,
        }));
    };

    return (
      <>
        <div className="space-y-8 animate-fade-in-up">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

      {/* Combined Filtering and Table Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800">Purchase Orders</h2>
                <button
            onClick={async () => {
              const nextPO = await generateNextPONumber();
              const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
              setNewRecordData({ 
                ...newRecordData, 
                poNumber: nextPO,
                dateOrdered: today
              });
              setIsAddModalVisible(true);
            }} 
            className="btn-primary px-6 py-3 text-sm"
          >
            <span>+</span> Create PO
                </button>
        </div>
        {/* Filtering Section */}
        <div className="mb-6 mt-2">
          {/* Date fields row */}
          <div className="flex gap-2 mb-2">
            <div className="w-1/2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="Start Date"
              />
            </div>
            <div className="w-1/2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="End Date"
              />
            </div>
          </div>
          {/* Search field row */}
          <div className="w-full">
            <div className="relative flex rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: '#fffae5' }}>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="px-4 py-2 text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#5c3a6b' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                </button>
            </div>
          </div>
            </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-[#AAAAAA]">Loading sales dispatch records...</div>
                        </div>
        ) : (
          <div className="mt-6" style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {/* Single Table with Sticky Header */}
            <div 
              className="table-responsive overflow-auto flex-1" 
              style={{ maxHeight: '360px', overflowX: 'auto', overflowY: 'auto' }}
            >
              <table className="modern-table min-w-full" style={{ tableLayout: 'auto', width: 'max-content' }}>
                <thead className="sticky top-0 z-10" style={{
                  backgroundColor: '#ff8c42',
                  borderRadius: '8px 8px 0 0',
                  borderBottom: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <tr>
                    {[
                      'PO Number', 'Date Ordered', 'Customer', 'Qty', 'Hatch Date',
                      'Batches Required', 'Trucks Required', 'Created By', 'Created At',
                      'Updated By', 'Updated At', 'Actions'
                    ].map((header, index) => {
                      const fieldName = header.toLowerCase().replace(/\s+/g, '').replace('number', 'Number').replace('ordered', 'Ordered').replace('required', 'Required').replace('created', 'Created').replace('updated', 'Updated').replace('at', 'At');
                      const isCurrentSort = sortColumn === fieldName;
                      const isAscending = isCurrentSort && sortDirection === 'asc';
                      const isDescending = isCurrentSort && sortDirection === 'desc';

    return (
                        <th
                          key={header}
                          className={`px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider ${index < 3 ? 'sticky-header-' + (index + 1) : ''}`}
                          style={{ 
                            width: '120px', 
                            minWidth: '120px',
                            backgroundColor: '#ff8c42',
                            color: 'white',
                            fontWeight: '600',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            left: index < 3 ? `${index * 120}px` : 'auto'
                          }}
                        >
                          <div className="flex items-center">
                            <span className="text-white font-medium text-xs">{header}</span>
                            {header !== 'Actions' && (
                              <div className="ml-4 flex space-x-1">
                                        <button 
                                  onClick={() => handleSort(fieldName)}
                                  className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
                                >
                                  {isAscending ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 15l-6-6-6 6"/>
                                    </svg>
                                  ) : isDescending ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M6 9l6 6 6-6"/>
                                    </svg>
                                  ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                                    </svg>
                                  )}
                                        </button>
                                <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35"/>
                                  </svg>
                </button>
            </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                            </tr>
                        </thead>
                <tbody>
                  {processedRecords.map(record => (
                    <tr key={record.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                      <td className={`px-4 py-3 text-sm font-medium sticky-column-1`} style={{ 
                        width: '120px', 
                        minWidth: '120px',
                        backgroundColor: '#ff8c42',
                        color: 'white'
                      }}>
                        {record.poNumber}
                                    </td>
                      <td className={`px-4 py-3 text-sm sticky-column-2`} style={{ 
                        width: '120px', 
                        minWidth: '120px',
                        backgroundColor: '#ff8c42',
                        color: 'white'
                      }}>
                        {new Date(record.dateOrdered).toLocaleDateString()}
                                    </td>
                      <td className={`px-4 py-3 text-sm sticky-column-3`} style={{ 
                        width: '120px', 
                        minWidth: '120px',
                        backgroundColor: '#ff8c42',
                        color: 'white'
                      }}>
                        {record.customer}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{new Date(record.hatchDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{record.batchesRequired}</td>
                      <td className="px-4 py-3 text-sm">{record.trucksRequired}</td>
                      <td className="px-4 py-3 text-sm">{record.createdBy}</td>
                      <td className="px-4 py-3 text-sm">{new Date(record.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{record.updatedBy}</td>
                      <td className="px-4 py-3 text-sm">{new Date(record.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="text-[#5C3A6B] hover:underline font-medium"
                        >
                          Edit
                        </button>
                                        <button 
                          onClick={() => handleDeleteRecord(record.id, record.poNumber)}
                          className="text-[#F86F6F] hover:underline font-medium"
                                        >
                          Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>
            )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800">Individual Invoices</h2>
                        </div>
        
        {/* Filtering Section */}
        <div className="mb-6 mt-2">
          {/* Date fields row */}
          <div className="flex gap-2 mb-2">
            <div className="w-1/2">
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="Start Date"
              />
            </div>
            <div className="w-1/2">
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="End Date"
              />
            </div>
          </div>
          {/* Search field row */}
          <div className="w-full">
            <div className="relative flex rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: '#fffae5' }}>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-900"
              />
              <button className="px-3 py-2 bg-[#5c3a6b] text-white hover:opacity-90">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
                        </div>
                        
        <div className="mt-6" style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div 
            className="table-responsive overflow-auto flex-1" 
            style={{ maxHeight: '360px', overflowX: 'auto', overflowY: 'auto' }}
          >
            <table className="modern-table min-w-full" style={{ tableLayout: 'auto', width: 'max-content' }}>
              <thead className="sticky top-0 z-10" style={{
                backgroundColor: '#ff8c42',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <tr>
                  {[
                    'Invoice Number', 'Date Sent', 'Status', 'Actions'
                  ].map((header, index) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                      style={{ 
                        width: '150px', 
                        minWidth: '150px',
                        backgroundColor: '#ff8c42',
                        color: 'white',
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div className="flex items-center">
                        <span className="text-white font-medium text-xs">{header}</span>
                        {header !== 'Actions' && (
                          <div className="ml-4 flex space-x-1">
                            <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                              </svg>
                            </button>
                            <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                              </svg>
                            </button>
                            </div>
                        )}
                            </div>
                    </th>
                  ))}
                                    </tr>
                                </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                    <td className="px-4 py-3 text-sm">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="date"
                        value={invoiceDates[invoice.invoice_number] || ''}
                        onChange={(e) => handleDateChange(invoice.invoice_number, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleStatusToggle(invoice.id, 'invoice')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button 
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-[#5C3A6B] hover:underline font-medium"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    </div>


      {/* Add Record Modal */}
      {isAddModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Create Purchase Order (PO)</h3>
              <button 
                onClick={() => setIsAddModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
                        </div>
            <form onSubmit={handleAddRecord} className="space-y-4">
                            <div>
                <label className="block text-sm font-medium text-gray-700">PO Number</label>
                <input
                  type="text"
                  name="poNumber"
                  value={newRecordData.poNumber || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 bg-gray-100"
                  placeholder="Auto-generated"
                  readOnly
                  required
                />
                            </div>
                            <div>
                <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                <div className="mt-2 space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="customerType"
                      value="Farm"
                      checked={newRecordData.customerType === 'Farm'}
                      onChange={handleFormChange}
                      className="form-radio h-4 w-4 text-[#5c3a6b]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Farm</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="customerType"
                      value="Individual"
                      checked={newRecordData.customerType === 'Individual'}
                      onChange={handleFormChange}
                      className="form-radio h-4 w-4 text-[#5c3a6b]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Individual</span>
                  </label>
                </div>
                            </div>
                            <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <select
                  name="customer"
                  value={newRecordData.customer || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                >
                  <option value="">Select a customer</option>
                  {newRecordData.customerType === 'Farm' ? (
                    farmCustomers.map((customer) => (
                      <option key={customer.id} value={customer.farm_name}>
                        {customer.farm_name} - {customer.contact_person}
                      </option>
                    ))
                  ) : newRecordData.customerType === 'Individual' ? (
                    individualCustomers.map((customer) => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name} - {customer.phone_number}
                      </option>
                    ))
                  ) : null}
                </select>
                            </div>
                            <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="qty"
                  value={newRecordData.qty || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter quantity"
                  required
                />
                            </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Hatch Date</label>
                <input
                  type="date"
                  name="hatchDate"
                  value={newRecordData.hatchDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                        </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalVisible(false)}
                  className="px-6 py-3 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#5C3A6B] text-white rounded-md hover:opacity-90"
                >
                  Create PO
                </button>
                                </div>
                        </form>
                    </div>
                </div>
            )}

      {/* Edit Record Modal */}
      {isEditModalVisible && currentRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Edit Sales Dispatch Record</h3>
              <button 
                onClick={() => setIsEditModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
                        </div>
            <form onSubmit={handleUpdateRecord} className="space-y-4">
                                <div>
                <label className="block text-sm font-medium text-gray-700">PO Number</label>
                <input
                  type="text"
                  name="poNumber"
                  value={newRecordData.poNumber || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter PO number"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Date Ordered</label>
                <input
                  type="date"
                  name="dateOrdered"
                  value={newRecordData.dateOrdered || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <input
                  type="text"
                  name="customer"
                  value={newRecordData.customer || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter customer name"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="qty"
                  value={newRecordData.qty || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter quantity"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Hatch Date</label>
                <input
                  type="date"
                  name="hatchDate"
                  value={newRecordData.hatchDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Batches Required</label>
                <input
                  type="number"
                  name="batchesRequired"
                  value={newRecordData.batchesRequired || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter batches required"
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Trucks Required</label>
                <input
                  type="number"
                  name="trucksRequired"
                  value={newRecordData.trucksRequired || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter trucks required"
                />
                                </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalVisible(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-blue px-6 py-3"
                >
                  Update Record
                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        {/* Invoice View Modal */}
        {isInvoiceModalVisible && currentInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Invoice - {currentInvoice.invoice_number}</h3>
                <div className="flex items-center space-x-3">
                  {/* Download PDF Button */}
                  <button 
                    onClick={downloadInvoicePDF}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                    title="Download PDF"
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span className="text-sm">Download PDF</span>
                  </button>
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => setIsInvoiceModalVisible(false)} 
                    className="text-gray-500 hover:text-gray-800 text-2xl"
                  >
                    &times;
                  </button>
                                </div>
                        </div>
                        
              {/* Invoice Content */}
              <div ref={invoiceRef} className="p-6 text-sm max-w-4xl mx-auto" style={{ minHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}>
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-6">
                  {/* Company Info */}
                  <div className="flex items-start space-x-4">
                    {/* Company Logo */}
                    <div className="w-24 h-24">
                      <img 
                        src="images/BPF-Stefan-8.png" 
                        alt="Bounty Farm Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Logo failed to load:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                                </div>
                                <div>
                      <h1 className="text-2xl font-bold text-black uppercase">BOUNTY FARM LIMITED</h1>
                      <p className="text-sm text-gray-600">14 Barima Ave., Bel Air Park, Georgetown, Guyana</p>
                      <p className="text-sm text-gray-600">Tel No. 225-9311-4 | Fax No.2271032</p>
                      <p className="text-sm text-gray-600">office@bountyfarmgy.com</p>
                                </div>
                                </div>
                  
                  {/* Invoice Details */}
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-black uppercase mb-4">TAX INVOICE</h2>
                    <div className="border border-black p-3">
                      <p className="text-sm font-bold">Tin #010067340</p>
                      <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                                <div>
                          <p className="font-semibold">Date</p>
                          <p>{invoiceDates[currentInvoice.invoice_number] || new Date().toLocaleDateString()}</p>
                                </div>
                                <div>
                          <p className="font-semibold">Tax Invoice #</p>
                          <p>{currentInvoice.invoice_number}</p>
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>

                {/* Bill To Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Bill To:</h3>
                  <div className="border border-gray-300 p-4 bg-gray-50">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="font-semibold pr-4 py-2">Customer Name:</td>
                          <td className="py-2">
                            {currentInvoice.customerDetails?.name || currentInvoice.customer || 'EAT INS FARMS'}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-semibold pr-4 py-2">Address:</td>
                          <td className="py-2">
                            {currentInvoice.customerDetails?.address || 'COWAN & HIGH STREET'}
                          </td>
                        </tr>
                        {currentInvoice.customerDetails?.type === 'Farm' && currentInvoice.customerDetails?.contactPerson && (
                          <tr>
                            <td className="font-semibold pr-4 py-2">Contact Person:</td>
                            <td className="py-2 text-gray-500">
                              {currentInvoice.customerDetails.contactPerson}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="font-semibold pr-4 py-2">Phone:</td>
                          <td className="py-2">
                            {currentInvoice.customerDetails?.contactNumber || '+5926335874'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                            </div>
                            </div>

                {/* Line Items Table */}
                <div className="mb-6">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-3 text-left">#</th>
                        <th className="border border-black p-3 text-left">Description</th>
                        <th className="border border-black p-3 text-left">Unit</th>
                        <th className="border border-black p-3 text-left">Quantity</th>
                        <th className="border border-black p-3 text-left">Unit Price</th>
                        <th className="border border-black p-3 text-left">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInvoice.usedHatches?.length > 0 ? (
                        currentInvoice.usedHatches.map((hatch: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-black p-3">{index + 1}</td>
                            <td className="border border-black p-3">Day Old Chicks with Hatch No. {hatch.hatchNo}</td>
                            <td className="border border-black p-3">Each</td>
                            <td className="border border-black p-3">{hatch.chicksUsed?.toLocaleString() || '0'}</td>
                            <td className="border border-black p-3">$200.00</td>
                            <td className="border border-black p-3">${(hatch.chicksUsed * 200).toLocaleString()}.00</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black p-3">1</td>
                          <td className="border border-black p-3">
                            Day Old Chicks
                            {currentInvoice.usedHatches?.length === 0 && (
                              <span className="text-red-600 text-xs block mt-1">
                                (Hatch details not available - check console for details)
                              </span>
                            )}
                          </td>
                          <td className="border border-black p-3">Each</td>
                          <td className="border border-black p-3">{currentInvoice.qty?.toLocaleString() || '0'}</td>
                          <td className="border border-black p-3">$200.00</td>
                          <td className="border border-black p-3">${((currentInvoice.qty || 0) * 200).toLocaleString()}.00</td>
                        </tr>
                      )}
                      {/* Fill remaining empty rows */}
                      {Array.from({ length: Math.max(0, 3 - (currentInvoice.usedHatches?.length || 1)) }, (_, index) => (
                        <tr key={(currentInvoice.usedHatches?.length || 1) + index + 1}>
                          <td className="border border-black p-3">{(currentInvoice.usedHatches?.length || 1) + index + 1}</td>
                          <td className="border border-black p-3"></td>
                          <td className="border border-black p-3"></td>
                          <td className="border border-black p-3"></td>
                          <td className="border border-black p-3"></td>
                          <td className="border border-black p-3"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <p className="text-sm mb-3">Merchandise remains the property of Bounty Farm until paid for in full</p>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-semibold">Prepared by:</span> {currentInvoice.created_by || 'admin'}</p>
                    </div>
                  </div>
                  
                  {/* Summary Table */}
                  <div className="w-64">
                    <table className="w-full border border-black text-sm">
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 font-semibold">Invoice Disc.</td>
                          <td className="border border-black p-3">${calculateInvoiceTotals(currentInvoice.usedHatches || []).invoiceDiscount.toLocaleString()}.00</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold">Subtotal</td>
                          <td className="border border-black p-3">${calculateInvoiceTotals(currentInvoice.usedHatches || []).subtotal.toLocaleString()}.00</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold">VAT (0%)</td>
                          <td className="border border-black p-3">${calculateInvoiceTotals(currentInvoice.usedHatches || []).vatAmount.toLocaleString()}.00</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-bold bg-gray-100">TOTAL</td>
                          <td className="border border-black p-3 font-bold bg-gray-100">${calculateInvoiceTotals(currentInvoice.usedHatches || []).total.toLocaleString()}.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Company Slogan - positioned exactly 1 inch from page bottom (0.7in from content bottom) */}
                <div className="text-center mt-auto" style={{ marginBottom: '0.7in' }}>
                  <p className="text-lg font-bold text-gray-700">BOUNTY FARM... THINK QUALITY, BUY BOUNTY!</p>
                </div>
              </div>
                    </div>
                </div>
            )}
        </div>
      </>
    );
};

export default Sales;