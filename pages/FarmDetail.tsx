import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

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
  const { farmId } = useParams<{ farmId: string }>();
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
  const handleViewDispatch = (dispatch: Dispatch) => {
    // For now, just show an alert. Later we can implement a modal like in Dispatch.tsx
    alert(`Viewing dispatch note for ${dispatch.dispatch_number}`);
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
        .select('po_number, customer, hatch_date')
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
          qty: matchingSalesDispatch ? parseInt(matchingSalesDispatch.qty) || 0 : 0,
          hatch_date: matchingSalesDispatch?.hatch_date,
          usedHatches: [] // Will be calculated if needed
        };
      });

      console.log('Mapped dispatches:', mappedDispatches);
          const belongsToFarm = customerName === farmInfo.farmName;
          console.log('Dispatch belongs to farm:', belongsToFarm);
          
          if (!belongsToFarm) {
            console.log('Skipping dispatch - does not belong to current farm');
            return null; // Skip this dispatch
          }
          
          // If not in invoice, try to get from sales_dispatch
          if (!customerName || !quantity) {
            console.log('Missing data in invoice, fetching from sales_dispatch...');
            try {
              const { data: salesData, error: salesError } = await supabase
                .from('sales_dispatch')
                .select('customer, qty, hatch_date')
                .eq('invoice_id', dispatch.invoice_id)
                .single();
                
              if (!salesError && salesData) {
                customerName = customerName || salesData.customer;
                quantity = quantity || salesData.qty;
                console.log('Found data from sales_dispatch:', { customerName, quantity, hatchDate: salesData.hatch_date });
              }
            } catch (error) {
              console.error('Error fetching from sales_dispatch:', error);
            }
          }

          // Fetch hatch data to get usedHatches if not available
          if (!usedHatches && invoiceData?.hatch_date) {
            console.log('Fetching hatch data for date:', invoiceData.hatch_date);
            try {
              const { data: hatchData, error: hatchError } = await supabase
                .from('hatch_cycles')
                .select('hatch_no, chicks_hatched')
                .eq('hatch_date', invoiceData.hatch_date)
                .not('chicks_hatched', 'is', null)
                .gt('chicks_hatched', 0);
                
              if (!hatchError && hatchData && hatchData.length > 0) {
                // Convert hatch data to usedHatches format (same as Dispatch.tsx)
                usedHatches = hatchData.map(hatch => ({
                  hatchNo: hatch.hatch_no,
                  chicksUsed: hatch.chicks_hatched
                }));
                console.log('Generated usedHatches from hatch data:', usedHatches);
              }
            } catch (error) {
              console.error('Error fetching hatch data:', error);
            }
          }

          return {
            id: dispatch.id,
            invoiceId: dispatch.invoice_id,
            customer: customerName,
            customerType: customerType,
            type: dispatch.type,
            qty: quantity,
            hatchDate: invoiceData?.hatch_date || dispatch.hatch_date,
            usedHatches: usedHatches,
            createdAt: dispatch.created_at,
            trucks: dispatch.trucks,
            dispatch_number: dispatch.dispatch_number,
            invoiceData: invoiceData
          };
        })
      );

      // Filter out null values (dispatches that don't belong to this farm)
      const validDispatches = mappedDispatches.filter(dispatch => dispatch !== null);

      console.log('Final mapped dispatches:', validDispatches);
      setDispatches(validDispatches);
      
      // If no dispatches found, let's try a broader search for testing
      if (validDispatches.length === 0) {
        console.log('No dispatches found for today, trying broader search...');
        const { data: allDispatches, error: allError } = await supabase
          .from('dispatches')
          .select('*')
          .eq('customer', farmInfo.farmName)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (!allError && allDispatches && allDispatches.length > 0) {
          console.log('Found dispatches for this farm (not today):', allDispatches);
          // For testing, let's show the most recent dispatch
          const recentDispatch = allDispatches[0];
          const { data: invoiceData } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', recentDispatch.invoice_id)
            .single();
            
          const mockDispatch: Dispatch = {
            id: recentDispatch.id,
            invoiceId: recentDispatch.invoice_id,
            customer: recentDispatch.customer,
            customerType: recentDispatch.customerType,
            type: recentDispatch.type,
            qty: invoiceData?.qty || recentDispatch.qty || 1000,
            hatchDate: invoiceData?.hatch_date || recentDispatch.hatch_date || new Date().toISOString().split('T')[0],
            usedHatches: invoiceData?.usedHatches || recentDispatch.usedHatches || '2025-071-BFL',
            createdAt: recentDispatch.created_at,
            invoiceData: invoiceData
          };
          
          console.log('Setting mock dispatch for testing:', mockDispatch);
          setDispatches([mockDispatch]);
        }
      }
    } catch (err) {
      console.error('Error fetching farm dispatches:', err);
    }
  };

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

    if (farmId) {
      fetchFlocks();
    }
  }, [farmId, user?.email]);

  // Fetch dispatches when farm info is available
  useEffect(() => {
    if (farmInfo.farmName) {
      fetchFarmDispatches();
    }
  }, [farmInfo.farmName]);

  // Handle add new flock
  const handleAddFlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmId) return;

    try {
      // For now, we'll just add to local state
      // In the future, this would insert into the flocks table
      const newFlock: Flock = {
        id: Date.now().toString(),
        farmId,
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
    navigate(`/farm/${farmId}/flock/${flock.id}`, { 
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
    </div>
  );
};

export default FarmDetail;
