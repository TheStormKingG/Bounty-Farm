import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';
import html2pdf from 'html2pdf.js';

interface Flock {
  id: string;
  farmId: string;
  flockNumber: number;
  flockName: string;
  breed: string;
  quantity: number;
  startDate: string;
  status: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface Dispatch {
  id: string;
  invoiceId: string;
  customer: string;
  customerType: string;
  type: string;
  qty: number;
  hatchDate: string;
  usedHatches: any[];
  createdAt: string;
  trucks?: number;
  dispatch_number?: string;
  invoiceData?: {
    customer: string;
    customerType: string;
    qty: number;
    hatch_date: string;
  };
}

interface TripDetail {
  tripId: string;
  hatches: Array<{
    hatchNo: string;
    quantity: number;
  }>;
  totalQuantity: number;
}

const FarmDetail: React.FC = () => {
  const { farmId, farmName } = useParams<{ farmId?: string; farmName?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [farmInfo, setFarmInfo] = useState({
    farmName: '',
    farmAddress: '',
    contactPerson: '',
    contactNumber: ''
  });
  
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dispatch note modal state
  const [isDispatchModalVisible, setIsDispatchModalVisible] = useState(false);
  const [currentDispatch, setCurrentDispatch] = useState<Dispatch | null>(null);
  const [dispatchInvoiceData, setDispatchInvoiceData] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [tripDistribution, setTripDistribution] = useState<any[]>([]);
  const dispatchRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newFlockName, setNewFlockName] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newStatus, setNewStatus] = useState('Active');
  const [newNotes, setNewNotes] = useState('');

  // Get farm info from navigation state
  useEffect(() => {
    if (location.state) {
      setFarmInfo({
        farmName: location.state.farmName || '',
        farmAddress: location.state.farmAddress || '',
        contactPerson: location.state.contactPerson || '',
        contactNumber: location.state.contactNumber || ''
      });
    }
  }, [location.state]);

  // Calculate trip distribution for dispatches (exact copy from Dispatch.tsx)
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

  // Handle viewing dispatch note
  const handleViewDispatch = async (dispatch: Dispatch) => {
    try {
      setCurrentDispatch(dispatch);
      
      // Fetch invoice data for this dispatch
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', dispatch.invoiceId)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice data:', invoiceError);
        setError('Failed to fetch invoice data: ' + invoiceError.message);
      } else {
        // Get customer name and determine customer type
        let customerName = farmInfo.farmName; // Use farm name
        let customerType = 'Farm';
        let quantity = dispatch.qty || 0;
        let usedHatches = dispatch.usedHatches || [];
        
        // If not available, try to get from sales_dispatch
        if (!quantity || !usedHatches.length) {
          console.log('Missing data, fetching from sales_dispatch...');
          try {
            const { data: salesData, error: salesError } = await supabase
              .from('sales_dispatch')
              .select('customer, qty, hatch_date')
              .eq('customer', farmInfo.farmName)
              .eq('po_number', dispatch.dispatch_number?.replace('DISP', 'PO'))
              .single();
              
            if (!salesError && salesData) {
              if (!quantity) quantity = parseInt(salesData.qty || '0') || 0;
              console.log('Found data from sales_dispatch:', { customerName, quantity, hatchDate: salesData.hatch_date });
              
              // If we have hatch_date but no usedHatches, fetch hatch data
              if (!usedHatches.length && salesData.hatch_date) {
                console.log('Fetching hatch data for date:', salesData.hatch_date);
                const { data: hatchData, error: hatchError } = await supabase
                  .from('hatch_cycles')
                  .select('hatch_no, chicks_hatched')
                  .eq('hatch_date', salesData.hatch_date)
                  .not('chicks_hatched', 'is', null)
                  .gt('chicks_hatched', 0);
                  
                if (!hatchError && hatchData && hatchData.length > 0) {
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
        
        // Fetch customer details
        const customerDetails = await getCustomerDetails(customerName, customerType);
        
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
        setIsDispatchModalVisible(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Get customer details function
  const getCustomerDetails = async (customerName: string, customerType: string) => {
    try {
      if (customerType === 'Farm') {
        const { data, error } = await supabase
          .from('farm_customers')
          .select('*')
          .eq('farm_name', customerName)
          .single();
        
        if (error) {
          console.error('Error fetching farm customer details:', error);
          return null;
        }
        
        return {
          name: data.farm_name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          contactPerson: data.contact_person
        };
      } else {
        const { data, error } = await supabase
          .from('individual_customers')
          .select('*')
          .eq('name', customerName)
          .single();
        
        if (error) {
          console.error('Error fetching individual customer details:', error);
          return null;
        }
        
        return {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email
        };
      }
    } catch (error) {
      console.error('Error in getCustomerDetails:', error);
      return null;
    }
  };

  // Download dispatch PDF function
  const downloadDispatchPDF = () => {
    if (!dispatchRef.current) return;
    
    const element = dispatchRef.current;
    const opt = {
      margin: 0.3,
      filename: `dispatch-note-${currentDispatch?.dispatch_number}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Fetch dispatches for this farm
  const fetchFarmDispatches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching dispatches for farm:', farmInfo.farmName, 'on date:', today);
      
      // Fetch dispatches with their invoice data using a join
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatches')
        .select(`
          *,
          invoices!inner(
            id,
            invoice_number,
            date_sent,
            created_at
          )
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('type', 'Delivery') // Only get Delivery dispatches for farm customers
        .order('created_at', { ascending: false });

      if (dispatchError) {
        console.error('Error fetching dispatches:', dispatchError);
        return;
      }

      console.log('All Delivery dispatches for today:', dispatchData);
      console.log('Number of dispatches found:', dispatchData?.length || 0);

      // Now we need to check which invoices belong to this farm customer
      // We'll fetch the sales_dispatch records to match by customer name
      const { data: salesDispatchData, error: salesError } = await supabase
        .from('sales_dispatch')
        .select('po_number, customer, hatch_date, qty')
        .eq('customer', farmInfo.farmName)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (salesError) {
        console.error('Error fetching sales dispatch data:', salesError);
        return;
      }

      console.log('Sales dispatch data for farm:', salesDispatchData);

      // Filter dispatches that belong to this farm customer
      const farmDispatches = (dispatchData || []).filter(dispatch => {
        // Check if the dispatch's invoice corresponds to a PO for this farm customer
        const matchingSalesDispatch = salesDispatchData?.find(sales => {
          const invoiceNumber = dispatch.invoices?.invoice_number;
          const expectedInvoiceNumber = sales.po_number?.replace('PO', 'INV');
          return invoiceNumber === expectedInvoiceNumber;
        });
        
        console.log('Checking dispatch:', dispatch.dispatch_number, 'invoice:', dispatch.invoices?.invoice_number, 'matches farm:', !!matchingSalesDispatch);
        return !!matchingSalesDispatch;
      });

      console.log('Farm dispatches after filtering:', farmDispatches);
      console.log('Number of farm dispatches:', farmDispatches.length);

      // Map the dispatches to our Dispatch interface
      const mappedDispatches: Dispatch[] = farmDispatches.map(dispatch => {
        // Get the matching sales dispatch data for additional info
        const matchingSalesDispatch = salesDispatchData?.find(sales => {
          const invoiceNumber = dispatch.invoices?.invoice_number;
          const expectedInvoiceNumber = sales.po_number?.replace('PO', 'INV');
          return invoiceNumber === expectedInvoiceNumber;
        });

        console.log('Mapping dispatch:', dispatch.dispatch_number, 'with sales data:', matchingSalesDispatch);
        
        return {
          id: dispatch.id,
          dispatch_number: dispatch.dispatch_number,
          invoice_id: dispatch.invoice_id,
          sales_dispatch_id: '', // Not needed for this view
          date_dispatched: dispatch.date_dispatched,
          type: dispatch.type,
          trucks: dispatch.trucks,
          payment_status: dispatch.payment_status || 'pending',
          created_by: dispatch.created_by,
          created_at: dispatch.created_at,
          updated_by: dispatch.updated_by,
          updated_at: dispatch.updated_at,
          customer: farmInfo.farmName, // Use the farm name
          customer_type: 'Farm',
          type_locked: dispatch.type_locked,
          // Additional data for trip calculation
          qty: matchingSalesDispatch ? parseInt(matchingSalesDispatch.qty || '0') || 0 : 0,
          hatch_date: matchingSalesDispatch?.hatch_date,
          usedHatches: [], // Will be calculated if needed
          // Required Dispatch interface properties
          invoiceId: dispatch.invoice_id,
          customerType: 'Farm',
          hatchDate: matchingSalesDispatch?.hatch_date || '',
          createdAt: dispatch.created_at
        };
      });

      console.log('Mapped dispatches:', mappedDispatches);

      setDispatches(mappedDispatches);
    } catch (error) {
      console.error('Error fetching farm dispatches:', error);
    }
  };

  // Set farm info based on parameters
  useEffect(() => {
    if (farmName) {
      // If farmName is provided (for farmers), set it directly
      setFarmInfo(prev => ({
        ...prev,
        farmName: decodeURIComponent(farmName)
      }));
    } else if (farmId) {
      // If farmId is provided (for admins), fetch farm info from database
      const fetchFarmInfo = async () => {
        try {
          const { data, error } = await supabase
            .from('farm_customers')
            .select('farm_name, farm_address, contact_person, contact_number')
            .eq('id', farmId)
            .single();

          if (error) {
            console.error('Error fetching farm info:', error);
            setError('Failed to fetch farm information');
            return;
          }

          if (data) {
            setFarmInfo({
              farmName: data.farm_name,
              farmAddress: data.farm_address,
              contactPerson: data.contact_person,
              contactNumber: data.contact_number
            });
          }
        } catch (err) {
          console.error('Unexpected error fetching farm info:', err);
          setError('An unexpected error occurred while fetching farm information');
        }
      };

      fetchFarmInfo();
    }
  }, [farmId, farmName]);

  // Fetch flocks for this farm
  useEffect(() => {
    const fetchFlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For now, we'll create mock data since the flocks table doesn't exist yet
        // In the future, this would fetch from a flocks table
        const mockFlocks: Flock[] = [
          {
            id: '1',
            farmId: farmId || '',
            flockNumber: 1,
            flockName: 'Flock 1',
            breed: 'Broiler',
            quantity: 1000,
            startDate: '2024-01-15',
            status: 'Active',
            notes: 'First flock for this farm',
            createdBy: user?.email || 'Unknown',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            farmId: farmId || '',
            flockNumber: 2,
            flockName: 'Flock 2',
            breed: 'Layer',
            quantity: 500,
            startDate: '2024-02-01',
            status: 'Active',
            notes: 'Layer flock for egg production',
            createdBy: user?.email || 'Unknown',
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            farmId: farmId || '',
            flockNumber: 3,
            flockName: 'Flock 3',
            breed: 'Breeder',
            quantity: 200,
            startDate: '2024-03-01',
            status: 'Completed',
            notes: 'Breeder flock for reproduction',
            createdBy: user?.email || 'Unknown',
            createdAt: new Date().toISOString(),
          }
        ];
        
        setFlocks(mockFlocks);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred.');
        setFlocks([]);
      } finally {
        setLoading(false);
      }
    };

    if (farmId || farmName) {
      fetchFlocks();
    }
  }, [farmId, farmName, user?.email]);

  // Fetch dispatches when farm info is available
  useEffect(() => {
    if (farmInfo.farmName) {
      fetchFarmDispatches();
    }
  }, [farmInfo.farmName]);

  // Handle add new flock
  const handleAddFlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmId && !farmName) return;

    try {
      // For now, we'll just add to local state
      // In the future, this would insert into the flocks table
      const newFlock: Flock = {
        id: Date.now().toString(),
        farmId: farmId || farmName || '',
        flockNumber: flocks.length + 1,
        flockName: newFlockName,
        breed: newBreed,
        quantity: parseInt(newQuantity),
        startDate: newStartDate,
        status: newStatus,
        notes: newNotes,
        createdBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString(),
      };

      setFlocks(prev => [newFlock, ...prev]);
      
      // Reset form
      setNewFlockName('');
      setNewBreed('');
      setNewQuantity('');
      setNewStartDate('');
      setNewStatus('Active');
      setNewNotes('');
      setIsAddModalVisible(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Handle flock click - navigate to flock detail
  const handleFlockClick = (flock: Flock) => {
    navigate(`/farm/${farmId || farmName}/flock/${flock.id}`, { 
      state: { 
        flockName: flock.flockName,
        breed: flock.breed,
        quantity: flock.quantity,
        startDate: flock.startDate,
        status: flock.status,
        notes: flock.notes,
        farmName: farmInfo.farmName,
        farmAddress: farmInfo.farmAddress,
        contactPerson: farmInfo.contactPerson,
        contactNumber: farmInfo.contactNumber
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flocks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Flocks</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => navigate('/farm')} 
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Farms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => navigate('/farm')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              title="Back to Farms"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">{farmInfo.farmName}</h1>
          </div>
          
          {/* Farm Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Farm Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600 font-medium">Address:</span>
                <p className="text-gray-800">{farmInfo.farmAddress}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Contact Person:</span>
                <p className="text-gray-800">{farmInfo.contactPerson}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Contact Number:</span>
                <p className="text-gray-800">{farmInfo.contactNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Dispatches Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Incoming Dispatches</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Dispatch Number
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Trips
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Dispatch Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <span className="text-gray-400 text-2xl">🚚</span>
                        </div>
                        <p className="text-lg font-medium mb-2">No Incoming Dispatches</p>
                        <p className="text-sm">Dispatches will appear here when invoices are paid for this farm.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dispatches.map(dispatch => (
                    <tr key={dispatch.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                        {dispatch.dispatch_number}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                        {dispatch.date_dispatched ? new Date(dispatch.date_dispatched).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                        {dispatch.trucks || 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                        <button
                          onClick={() => handleViewDispatch(dispatch)}
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flock Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Flock Management</h2>
              <button
                onClick={() => setIsAddModalVisible(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Flock
              </button>
            </div>
          </div>

          {/* Flock Cards Grid */}
          <div className="p-6">
            {flocks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">🐔</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Flocks Found</h3>
                <p className="text-gray-500 mb-6">
                  Add your first flock to start tracking poultry operations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flocks.map(flock => (
                  <div key={flock.id} className="bg-[#fffae5] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    {/* Clickable Header */}
                    <button 
                      onClick={() => handleFlockClick(flock)}
                      className="w-full bg-[#ff8c42] rounded-xl px-4 py-3 mb-4 flex justify-between items-center shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#e67e22] cursor-pointer"
                    >
                      <span className="font-bold text-black">{flock.flockName}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>

                    {/* Flock Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-20 text-sm">Breed:</span>
                        <span className="text-gray-800 text-sm flex-1">{flock.breed}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-20 text-sm">Quantity:</span>
                        <span className="text-gray-800 text-sm flex-1">{flock.quantity.toLocaleString()}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-20 text-sm">Start Date:</span>
                        <span className="text-gray-800 text-sm flex-1">{new Date(flock.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-20 text-sm">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          flock.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : flock.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {flock.status}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <div>Created: {new Date(flock.createdAt).toLocaleDateString()}</div>
                        {flock.updatedAt && (
                          <div>Updated: {new Date(flock.updatedAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Flock Modal */}
        {isAddModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Add New Flock</h2>
                <form onSubmit={handleAddFlock}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Flock Name
                      </label>
                      <input
                        type="text"
                        value={newFlockName}
                        onChange={(e) => setNewFlockName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Breed
                      </label>
                      <select
                        value={newBreed}
                        onChange={(e) => setNewBreed(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Breed</option>
                        <option value="Broiler">Broiler</option>
                        <option value="Layer">Layer</option>
                        <option value="Breeder">Breeder</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsAddModalVisible(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Flock
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Note Modal */}
      {isDispatchModalVisible && currentDispatch && dispatchInvoiceData && (
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
                  onClick={() => setIsDispatchModalVisible(false)} 
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
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDgiIGN5PSI0OCIgcj0iNDgiIGZpbGw9IiNGRkY0QzQiLz4KPHN2ZyB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNFNjcxMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIi8+Cjwvc3ZnPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  
                  {/* Company Details */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">BOUNTY FARM LIMITED</h1>
                    <div className="text-gray-600 space-y-1">
                      <p>14 Barima Ave., Bel Air Park, Georgetown, Guyana</p>
                      <p>Tel No. 225-9311-4 | Fax No.2271032</p>
                      <p>office@bountyfarmgy.com</p>
                    </div>
                  </div>
                </div>
                
                {/* Dispatch Note Header */}
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">DISPATCH NOTE</h2>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Tin #010067340</p>
                    <p className="text-sm text-gray-600 mb-1">Date: {dispatchInvoiceData?.date_sent ? new Date(dispatchInvoiceData.date_sent).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Dispatch #: {currentDispatch.dispatch_number}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {currentDispatch.type === 'Delivery' ? 'Deliver to:' : 'Dispatch to:'}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {customerDetails ? (
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">Customer Name: {customerDetails.name}</p>
                      <p className="text-gray-600">Address: {customerDetails.address}</p>
                      <p className="text-gray-600">Phone: {customerDetails.phone}</p>
                      {customerDetails.email && <p className="text-gray-600">Email: {customerDetails.email}</p>}
                      {customerDetails.contactPerson && <p className="text-gray-600">Contact Person: {customerDetails.contactPerson}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-600">Customer details not available</p>
                  )}
                </div>
              </div>

              {/* Trip Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Trip Details:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Trip ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Hatch NO's</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Trip Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tripDistribution.map((trip, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">
                            {trip.tripId}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">
                            {trip.hatches.map((hatch: any, hatchIndex: number) => (
                              <div key={hatchIndex} className="text-xs">
                                {hatch.hatchNo}
                              </div>
                            ))}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">
                            {trip.totalQuantity.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-2">
                  Dispatch completed successfully. All chicks dispatched in good condition.
                </p>
                <p className="text-gray-600 text-sm">
                  Dispatched by: {currentDispatch.created_by || 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmDetail;
