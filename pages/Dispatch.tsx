import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/supabase';
import html2pdf from 'html2pdf.js';

interface Dispatch {
  id: string;
  dispatch_number: string;
  invoice_id: string;
  sales_dispatch_id: string;
  date_dispatched: string;
  type: string;
  trucks: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  customer?: string;
  customer_type?: string;
  type_locked?: boolean;
}

const Dispatch: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Farm dispatches state
  const [farmDispatches, setFarmDispatches] = useState<any[]>([]);
  
  // Filtering and search state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal state for delivery receipt
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [currentDispatch, setCurrentDispatch] = useState<Dispatch | null>(null);
  const [dispatchInvoiceData, setDispatchInvoiceData] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [tripDistribution, setTripDistribution] = useState<any[]>([]);
  
  // PDF download ref
  const dispatchRef = useRef<HTMLDivElement>(null);

  // Fetch dispatches from database
  const fetchDispatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to fetch Pick Up dispatches from Supabase...');
      
      const { data, error } = await supabase
        .from('dispatches')
        .select('*')
        .eq('type', 'Pick Up')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dispatches:', error);
        console.error('Error details:', error.message, error.code, error.details);
        setError('Failed to fetch dispatches: ' + error.message);
        return;
      }

      console.log('Fetched Pick Up dispatches:', data); // Debug log
      console.log('Number of Pick Up dispatches found:', data?.length || 0);
      setDispatches(data || []);
    } catch (err) {
      console.error('Unexpected error fetching dispatches:', err);
      setError('An unexpected error occurred while fetching dispatches');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment status toggle - removed since payment_status column doesn't exist
  const handlePaymentStatusToggle = async (dispatchId: string, currentStatus: string) => {
    console.log('Payment status toggle not available - payment_status column does not exist in invoices table');
    alert('Payment status functionality is not available - the invoices table does not have a payment_status column');
  };

  const fetchFarmDispatches = async () => {
    try {
      const { data, error } = await supabase
        .from('dispatches')
        .select(`
          *,
          invoices!inner(
            id,
            invoice_number,
            created_at
          )
        `)
        .eq('type', 'Delivery')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching farm dispatches:', error);
        return;
      }

      // Filter to only include dispatches where the related sales_dispatch customer is a farm customer
      const { data: farmCustomers } = await supabase
        .from('farm_customers')
        .select('farm_name');

      const farmNames = farmCustomers?.map(fc => fc.farm_name) || [];
      
      // For each dispatch, check if its related sales_dispatch customer is a farm customer
      const farmDispatchesData = [];
      
      for (const dispatch of data || []) {
        if (dispatch.invoices) {
          // Get the PO number from the invoice number
          const poNumber = dispatch.invoices.invoice_number.replace('-INV', '-PO');
          
          // Fetch the sales_dispatch record to get the customer
          const { data: salesData } = await supabase
            .from('sales_dispatch')
            .select('customer')
            .eq('po_number', poNumber)
            .single();
          
          if (salesData && farmNames.includes(salesData.customer)) {
            farmDispatchesData.push({
              ...dispatch,
              customer: salesData.customer
            });
          }
        }
      }

      setFarmDispatches(farmDispatchesData);
    } catch (error) {
      console.error('Error fetching farm dispatches:', error);
    }
  };

  useEffect(() => {
    fetchDispatches();
    fetchFarmDispatches();
  }, []);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefreshDispatches = () => {
      console.log('Dispatch component received refreshDispatches event');
      console.log('Refreshing dispatches due to invoice payment status change');
      fetchDispatches();
    };

    console.log('Dispatch component setting up event listener for refreshDispatches');
    window.addEventListener('refreshDispatches', handleRefreshDispatches);
    
    return () => {
      console.log('Dispatch component removing event listener');
      window.removeEventListener('refreshDispatches', handleRefreshDispatches);
    };
  }, []);

  // Handler functions for farm dispatches
  const handleFarmStatusToggle = async (id: string) => {
    try {
      const dispatch = farmDispatches.find(disp => disp.id === id);
      if (dispatch) {
        const newStatus = dispatch.status === 'received' ? 'pending' : 'received';
        await supabase
          .from('dispatches')
          .update({ status: newStatus })
          .eq('id', id);
        
        setFarmDispatches(prev => prev.map(disp => 
          disp.id === id ? { ...disp, status: newStatus } : disp
        ));
      }
    } catch (error) {
      console.error('Error updating farm dispatch status:', error);
    }
  };

  const handleDeleteFarmDispatch = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this farm dispatch?')) {
      try {
        await supabase
          .from('dispatches')
          .delete()
          .eq('id', id);
        
        setFarmDispatches(prev => prev.filter(disp => disp.id !== id));
      } catch (error) {
        console.error('Error deleting farm dispatch:', error);
      }
    }
  };

  const handleViewFarmDispatch = async (dispatch: any) => {
    // Navigate to the farm details page for this farm
    if (dispatch.customer) {
      // Find the farm ID from the farm name
      const { data: farmData } = await supabase
        .from('farm_customers')
        .select('id')
        .eq('farm_name', dispatch.customer)
        .single();
      
      if (farmData) {
        // Navigate to farm details page
        window.location.href = `/farm/${farmData.id}`;
      } else {
        console.error('Farm not found:', dispatch.customer);
        alert('Farm not found');
      }
    } else {
      console.error('No customer information available for dispatch');
      alert('No farm information available');
    }
  };

  // Process and filter farm dispatches
  const processedFarmDispatches = React.useMemo(() => {
    let filtered = [...farmDispatches];

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(dispatch => {
        const dispatchDate = new Date(dispatch.created_at);
        return dispatchDate >= start && dispatchDate <= end;
      });
    }

    // Search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dispatch => 
        dispatch.dispatch_number?.toLowerCase().includes(term) ||
        dispatch.customer?.toLowerCase().includes(term) ||
        dispatch.type?.toLowerCase().includes(term)
      );
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = a[sortColumn as keyof typeof a];
        let bValue = b[sortColumn as keyof typeof b];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [farmDispatches, startDate, endDate, searchTerm, sortColumn, sortDirection]);

  // Function to download dispatch as PDF
  const downloadDispatchPDF = () => {
    if (!dispatchRef.current) {
      console.error('Dispatch content not found');
      return;
    }

    const element = dispatchRef.current;
    const filename = `Dispatch-${currentDispatch?.dispatch_number || 'Unknown'}.pdf`;
    
    const opt = {
      margin: 0.3,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 1.8,
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

  // Function to calculate trip/truck distribution and hatch allocation
  const calculateTripDistribution = (totalQuantity: number, trucks: number, usedHatches: any[], dispatchNumber: string, dispatchType: string) => {
    console.log('Calculating distribution with:', { totalQuantity, trucks, usedHatches, dispatchNumber, dispatchType });
    
    if (!totalQuantity || totalQuantity === 0) {
      console.log('No quantity available, returning empty trips');
      return [];
    }
    
    const chicksPerTruck = 56000;
    const totalTrucksNeeded = Math.ceil(totalQuantity / chicksPerTruck);
    const actualTrucks = Math.min(trucks, totalTrucksNeeded);
    
    // Calculate even distribution
    const chicksPerTrip = Math.floor(totalQuantity / actualTrucks);
    const remainder = totalQuantity % actualTrucks;
    
    const trips = [];
    let remainingHatches = [...usedHatches];
    let hatchIndex = 0;
    
    // Use "truck" for Pick Up, "trip" for Delivery
    const idPrefix = dispatchType === 'Pick Up' ? 'TRUCK' : 'TRIP';
    
    for (let i = 0; i < actualTrucks; i++) {
      const tripQuantity = chicksPerTrip + (i < remainder ? 1 : 0);
      const tripHatches = [];
      let allocatedQuantity = 0;
      
      // Distribute hatches to this trip/truck
      while (allocatedQuantity < tripQuantity && hatchIndex < remainingHatches.length) {
        const currentHatch = remainingHatches[hatchIndex];
        const remainingInHatch = currentHatch.chicksUsed - (currentHatch.allocated || 0);
        const neededForTrip = tripQuantity - allocatedQuantity;
        
        if (remainingInHatch <= neededForTrip) {
          // Use entire hatch for this trip/truck
          tripHatches.push({
            hatchNo: currentHatch.hatchNo,
            quantity: remainingInHatch
          });
          allocatedQuantity += remainingInHatch;
          currentHatch.allocated = (currentHatch.allocated || 0) + remainingInHatch;
          hatchIndex++;
        } else {
          // Use partial hatch for this trip/truck
          tripHatches.push({
            hatchNo: currentHatch.hatchNo,
            quantity: neededForTrip
          });
          allocatedQuantity += neededForTrip;
          currentHatch.allocated = (currentHatch.allocated || 0) + neededForTrip;
        }
      }
      
      trips.push({
        tripId: `${idPrefix}-${dispatchNumber}-${String(i + 1).padStart(2, '0')}`,
        hatches: tripHatches,
        totalQuantity: allocatedQuantity
      });
    }
    
    console.log('Calculated trips/trucks:', trips);
    return trips;
  };

  // Function to get customer details (same logic as invoice viewer)
  const getCustomerDetails = async (customerName: string, customerType?: string) => {
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

  // Process and filter dispatches
  const processedDispatches = React.useMemo(() => {
    let filtered = [...dispatches];

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(dispatch => {
        const dispatchDate = new Date(dispatch.date_dispatched);
        return dispatchDate >= start && dispatchDate <= end;
      });
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(dispatch =>
        dispatch.dispatch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.created_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = (a as any)[sortColumn];
        let bValue = (b as any)[sortColumn];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [dispatches, startDate, endDate, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Toggle dispatch type between Delivery and Pick Up
  const handleTypeToggle = async (dispatchId: string, currentType: string) => {
    // Guard: prevent editing farm dispatches or locked dispatches
    const dispatch = dispatches.find(d => d.id === dispatchId);
    if (dispatch?.customer_type === 'Farm' || dispatch?.type_locked) {
      console.log('Cannot toggle dispatch type for farm customer or locked dispatch');
      return;
    }

    try {
      const newType = currentType === 'Delivery' ? 'Pick Up' : 'Delivery';
      
      const { error } = await supabase
        .from('dispatches')
        .update({ 
          type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId);

      if (error) {
        console.error('Error updating dispatch type:', error);
        setError('Failed to update dispatch type: ' + error.message);
      } else {
        // Update local state
        setDispatches(prev => 
          prev.map(dispatch => 
            dispatch.id === dispatchId 
              ? { ...dispatch, type: newType }
              : dispatch
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Handle viewing delivery receipt
  const handleViewReceipt = async (dispatch: Dispatch) => {
    try {
      setCurrentDispatch(dispatch);
      
      // Fetch invoice data for this dispatch
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', dispatch.invoice_id)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice data:', invoiceError);
        setError('Failed to fetch invoice data: ' + invoiceError.message);
      } else {
        // Get customer name and determine customer type (same logic as invoice viewer)
        let customerName = invoiceData.customer;
        let customerType = invoiceData.customerType;
        let quantity = invoiceData.qty;
        let usedHatches = invoiceData.usedHatches;
        
        // If not in invoice, try to get from sales_dispatch
        if (!customerName || !quantity || !usedHatches) {
          console.log('Missing data in invoice, fetching from sales_dispatch...');
          try {
            const { data: salesData, error: salesError } = await supabase
              .from('sales_dispatch')
              .select('customer, qty, hatch_date')
              .eq('po_number', invoiceData.po_number || invoiceData.invoice_number?.replace('INV', 'PO'))
              .single();
              
            if (!salesError && salesData) {
              if (!customerName) customerName = salesData.customer;
              if (!quantity) quantity = salesData.qty;
              console.log('Found data from sales_dispatch:', { customerName, quantity, hatchDate: salesData.hatch_date });
              
              // If we have hatch_date but no usedHatches, we need to fetch hatch data
              if (!usedHatches && salesData.hatch_date) {
                console.log('Fetching hatch data for date:', salesData.hatch_date);
                const { data: hatchData, error: hatchError } = await supabase
                  .from('hatch_cycles')
                  .select('hatch_no, chicks_hatched')
                  .eq('hatch_date', salesData.hatch_date)
                  .not('chicks_hatched', 'is', null)
                  .gt('chicks_hatched', 0);
                  
                if (!hatchError && hatchData && hatchData.length > 0) {
                  // Convert hatch data to usedHatches format
                  usedHatches = hatchData.map(hatch => ({
                    hatchNo: hatch.hatch_no,
                    chicksUsed: hatch.chicks_hatched
                  }));
                  console.log('Generated usedHatches from hatch data:', usedHatches);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching data from sales_dispatch:', error);
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
        
        // Fetch customer details
        const customerDetails = await getCustomerDetails(customerName || '', customerType);
        
        // Calculate trip distribution
        console.log('Data for trip calculation:', {
          quantity,
          trucks: dispatch.trucks,
          usedHatches,
          dispatchNumber: dispatch.dispatch_number,
          dispatchType: dispatch.type
        });
        
        const trips = calculateTripDistribution(
          quantity || 0,
          dispatch.trucks || 1,
          usedHatches || [],
          dispatch.dispatch_number,
          dispatch.type || 'Delivery'
        );
        
        console.log('Calculated trips:', trips);
        
        setDispatchInvoiceData(invoiceData);
        setCustomerDetails(customerDetails);
        setTripDistribution(trips);
        setIsReceiptModalVisible(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  const handleSearch = () => {
    // Search is handled by the processedDispatches useMemo
    // This function can be used for additional search logic if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dispatches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-white flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Individual Dispatch</h1>
            <button 
              onClick={fetchDispatches}
              className="px-3 py-1.5 bg-[#5c3a6b] text-white rounded-2xl hover:opacity-90 transition-opacity text-sm"
            >
              Refresh Dispatches
            </button>
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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
                <button 
                  onClick={handleSearch}
                  className="px-3 py-2 bg-[#5c3a6b] text-white hover:opacity-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Dispatch Table */}
          <div className="mt-6" style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div 
              className="overflow-auto flex-1" 
              style={{ maxHeight: '360px', overflowX: 'auto', overflowY: 'auto' }}
            >
              <table className="modern-table min-w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="sticky top-0 z-10" style={{
                  backgroundColor: '#ff8c42',
                  borderRadius: '8px 8px 0 0',
                  borderBottom: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <tr>
                    {[
                      'DISPATCH NUMBER', 'DATE', 'TYPE', 'TRUCKS', 'DISPATCH NOTE'
                    ].map((header, index) => {
                      const columnMap: { [key: string]: string } = {
                        'DISPATCH NUMBER': 'dispatch_number',
                        'DATE': 'date_dispatched',
                        'TYPE': 'type',
                        'TRUCKS': 'trucks',
                        'DISPATCH NOTE': 'receipt'
                      };
                      
                      return (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                          style={{ 
                            width: '200px', 
                            minWidth: '200px',
                            backgroundColor: '#ff8c42',
                            color: 'white',
                            fontWeight: '600',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div className="flex items-center">
                            <span className="text-white font-medium text-xs">{header}</span>
                            <div className="ml-1 flex flex-col">
                              <svg className="w-3 h-3 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                              <svg className="w-3 h-3 text-white opacity-50 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {processedDispatches.map((dispatch) => (
                    <tr key={dispatch.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#5C3A6B]">{dispatch.dispatch_number}</td>
                      <td className="px-4 py-3 text-sm">{new Date(dispatch.date_dispatched).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        {dispatch.customer_type === 'Farm' || dispatch.type_locked ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Delivery
                          </span>
                        ) : (
                          <button
                            onClick={() => handleTypeToggle(dispatch.id, dispatch.type || 'Delivery')}
                            className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                              dispatch.type === 'Delivery' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            {dispatch.type || 'Delivery'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{dispatch.trucks || 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleViewReceipt(dispatch)}
                          className="text-[#5c3a6b] hover:text-[#4a2c5a] underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {processedDispatches.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No dispatches found matching your criteria.
            </div>
        )}
      </div>
    </div>

      {/* Farm Dispatch Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800">Farm Dispatch</h2>
          <button 
            onClick={fetchFarmDispatches}
            className="px-3 py-1.5 bg-[#5c3a6b] text-white rounded-2xl hover:opacity-90 transition-opacity text-sm"
          >
            Refresh Dispatches
          </button>
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
              <button 
                onClick={handleSearch}
                className="px-3 py-2 bg-[#5c3a6b] text-white hover:opacity-90"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Table */}
        <div className="mt-6" style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div 
            className="overflow-auto flex-1" 
            style={{ maxHeight: '360px', overflowX: 'auto', overflowY: 'auto' }}
          >
            <table className="modern-table min-w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="sticky top-0 z-10" style={{
                backgroundColor: '#ff8c42',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <tr>
                  {[
                    'DISPATCH NUMBER', 'FARM NAME', 'DATE', 'STATUS', 'ACTIONS'
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
                        <div className="ml-1 flex flex-col">
                          <svg className="w-3 h-3 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                          <svg className="w-3 h-3 text-white opacity-50 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedFarmDispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#5C3A6B]">{dispatch.dispatch_number}</td>
                    <td className="px-4 py-3 text-sm">{dispatch.customer || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      {dispatch.created_at ? new Date(dispatch.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleFarmStatusToggle(dispatch.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          dispatch.status === 'received' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {dispatch.status === 'received' ? 'Received' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button 
                        onClick={() => handleViewFarmDispatch(dispatch)}
                        className="text-[#5C3A6B] hover:underline font-medium"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteFarmDispatch(dispatch.id)}
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
        
        {processedFarmDispatches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No farm dispatches found matching your criteria.
          </div>
        )}
      </div>

      {/* Dispatch Note Modal */}
      {isReceiptModalVisible && currentDispatch && dispatchInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Dispatch Note - {currentDispatch.dispatch_number}</h3>
              <div className="flex items-center space-x-3">
                {/* Download PDF Button */}
                <button 
                  onClick={downloadDispatchPDF}
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
                  onClick={() => setIsReceiptModalVisible(false)} 
                  className="text-gray-500 hover:text-gray-800 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Dispatch Note Content */}
            <div ref={dispatchRef} className="p-6 text-sm max-w-4xl mx-auto" style={{ minHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}>
              {/* Dispatch Header */}
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
                
                {/* Dispatch Details */}
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-black uppercase mb-4">DISPATCH NOTE</h2>
                  <div className="border border-black p-3">
                    <p className="text-sm font-bold">Tin #010067340</p>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                      <div>
                        <p className="font-semibold">Date</p>
                        <p>{new Date(currentDispatch.date_dispatched).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Dispatch #</p>
                        <p>{currentDispatch.dispatch_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deliver To / Dispatch To Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {currentDispatch.type === 'Delivery' ? 'Deliver To:' : 'Dispatch To:'}
                </h3>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="font-semibold pr-4 py-2">Customer Name:</td>
                        <td className="py-2">
                          {customerDetails?.name || dispatchInvoiceData.customer || 'EAT INS FARMS'}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-semibold pr-4 py-2">Address:</td>
                        <td className="py-2">
                          {customerDetails?.address || 'COWAN & HIGH STREET'}
                        </td>
                      </tr>
                      {customerDetails?.type === 'Farm' && customerDetails?.contactPerson && (
                        <tr>
                          <td className="font-semibold pr-4 py-2">Contact Person:</td>
                          <td className="py-2 text-gray-500">
                            {customerDetails.contactPerson}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="font-semibold pr-4 py-2">Phone:</td>
                        <td className="py-2">
                          {customerDetails?.contactNumber || '+5926335874'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trip/Truck Details Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {currentDispatch.type === 'Pick Up' ? 'Truck Details:' : 'Trip Details:'}
                </h3>
                <table className="w-full border border-black text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-3 text-left">
                        {currentDispatch.type === 'Pick Up' ? 'Truck ID' : 'Trip ID'}
                      </th>
                      <th className="border border-black p-3 text-left">Hatch NO's</th>
                      <th className="border border-black p-3 text-left">
                        {currentDispatch.type === 'Pick Up' ? 'Truck Quantity' : 'Trip Quantity'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripDistribution.length > 0 ? (
                      tripDistribution.map((trip, index) => (
                        <tr key={index}>
                          <td className="border border-black p-3">{trip.tripId}</td>
                          <td className="border border-black p-3">
                            {trip.hatches.map((hatch: any, hatchIndex: number) => (
                              <div key={hatchIndex}>{hatch.hatchNo}</div>
                            ))}
                          </td>
                          <td className="border border-black p-3">{trip.totalQuantity.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-black p-3" colSpan={3}>
                          <div className="text-center text-gray-500">
                            No trip details available. Check console for debugging information.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Section */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <p className="text-sm mb-4">
                    {currentDispatch.type === 'Delivery' 
                      ? 'Delivery completed successfully. All chicks delivered in good condition.'
                      : 'Dispatch completed successfully. All chicks dispatched in good condition.'
                    }
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-semibold">Dispatched by:</span> {currentDispatch.created_by || 'admin'}</p>
                    <p className="text-sm"><span className="font-semibold">Dispatch Date:</span> {new Date(currentDispatch.date_dispatched).toLocaleDateString()}</p>
                  </div>
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
  );
};

export default Dispatch;
