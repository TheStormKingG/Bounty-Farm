import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';
import { Role } from '../types';
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
  status?: 'pending' | 'received';
  difference?: number;
  reason?: 'DOA' | 'N/A';
}

interface Placement {
  id: string;
  tripId: string;
  penFlock: number;
  quantity: number;
}

const FarmDetail: React.FC = () => {
  const { farmId, farmName } = useParams<{ farmId?: string; farmName?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('FarmDetail component rendered:', {
    farmId,
    farmName,
    pathname: location.pathname,
    user: user?.role
  });

  // Set farmer view based on user role
  useEffect(() => {
    setIsFarmerView(user?.role === Role.Farmer);
  }, [user?.role]);
  
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
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isFarmerView, setIsFarmerView] = useState(false);
  const [receivedDispatches, setReceivedDispatches] = useState<any[]>([]);
  const [dispatchTimers, setDispatchTimers] = useState<{ [key: string]: number }>({});
  const [doaValues, setDoaValues] = useState<{ [key: string]: number }>({});
  const [naValues, setNaValues] = useState<{ [key: string]: number }>({});
  const [expandedReceivedDispatches, setExpandedReceivedDispatches] = useState<Set<string>>(new Set());
  const dispatchRef = useRef<HTMLDivElement>(null);
  
  // Track if received dispatches have been loaded
  const [receivedDispatchesLoaded, setReceivedDispatchesLoaded] = useState(false);
  
  // Modal states

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

  // Handle editing receipt with existing data
  const handleEditReceipt = async (receipt: any) => {
    try {
      // Find the original dispatch
      const originalDispatch = dispatches.find(d => d.id === receipt.id);
      if (!originalDispatch) return;

      setCurrentDispatch(originalDispatch);
      
      // Load existing receipt data into state
      setPlacements(receipt.placements || []);
      setDoaValues(receipt.tripDistribution?.reduce((acc: any, trip: any) => {
        acc[trip.tripId] = trip.doa || 0;
        return acc;
      }, {}) || {});
      setNaValues(receipt.tripDistribution?.reduce((acc: any, trip: any) => {
        acc[trip.tripId] = trip.na || 0;
        return acc;
      }, {}) || {});

      // Fetch invoice data for this dispatch
      if (!originalDispatch.invoiceId) {
        console.error('No invoice ID found for dispatch:', originalDispatch);
        setError('No invoice ID found for dispatch');
        return;
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', originalDispatch.invoiceId)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice data:', invoiceError);
        setError('Failed to fetch invoice data: ' + invoiceError.message);
      } else {
        // Get customer name and determine customer type
        let customerName = farmInfo.farmName; // Use farm name
        let customerType = 'Farm';
        let quantity = originalDispatch.qty || 0;
        let usedHatches = originalDispatch.usedHatches || [];

        // Fetch hatch cycles data
        const { data: hatchCycles, error: hatchError } = await supabase
          .from('hatch_cycles')
          .select('hatch_no, hatch_date, qty')
          .in('hatch_no', usedHatches);

        if (hatchError) {
          console.error('Error fetching hatch cycles:', hatchError);
        }

        // Calculate trip distribution
        const tripDistribution = calculateTripDistribution(quantity, 1, hatchCycles || [], originalDispatch.dispatch_number, 'Delivery');

        // Set the trip distribution for the modal
        setTripDistribution(tripDistribution);

        // Open the modal
        setIsDispatchModalVisible(true);
      }
    } catch (error) {
      console.error('Error in handleEditReceipt:', error);
      setError('Failed to load receipt for editing: ' + (error as Error).message);
    }
  };

  // Handle viewing dispatch note for received dispatches
  const handleViewReceivedDispatch = async (receipt: any) => {
    try {
      // Create a mock dispatch object from the receipt data
      const mockDispatch: Dispatch = {
        id: receipt.id,
        invoiceId: '', // No invoice for farm dispatches
        customer: farmInfo.farmName,
        customerType: 'Farm',
        type: 'Delivery',
        qty: receipt.tripDistribution?.reduce((sum: number, trip: any) => sum + (trip.totalQuantity || 0), 0) || 0,
        hatchDate: receipt.confirmedAt,
        usedHatches: receipt.tripDistribution?.flatMap((trip: any) => trip.hatches || []) || [],
        createdAt: receipt.confirmedAt,
        trucks: receipt.tripDistribution?.length || 1,
        dispatch_number: receipt.dispatchNumber
      };

      // Use the existing handleViewDispatch function with the mock dispatch
      await handleViewDispatch(mockDispatch);
    } catch (error) {
      console.error('Error viewing received dispatch:', error);
      setError('Failed to view dispatch note: ' + (error as Error).message);
    }
  };

  // Handle viewing dispatch note
  const handleViewDispatch = async (dispatch: Dispatch) => {
    try {
      setCurrentDispatch(dispatch);
      
      // For farm dispatches, we don't need invoice data since they're post-paid
      let invoiceData = null;
      
      if (dispatch.invoiceId) {
        // Only fetch invoice data if it exists (for individual customers)
        const { data: fetchedInvoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', dispatch.invoiceId)
          .single();

        if (invoiceError) {
          console.error('Error fetching invoice data:', invoiceError);
          setError('Failed to fetch invoice data: ' + invoiceError.message);
          return;
        }
        invoiceData = fetchedInvoiceData;
      }

      // For farm dispatches, create mock invoice data or use dispatch data directly
      if (!invoiceData) {
        // Create mock invoice data for farm dispatches
        invoiceData = {
          invoice_number: dispatch.dispatch_number?.replace('-DISP', '-INV') || 'N/A',
          customer: farmInfo.farmName,
          total_amount: 0, // Will be calculated after growout
          created_at: dispatch.createdAt,
          payment_status: 'Post-paid' // Farm dispatches are post-paid
        };
      }

      // Get customer details (works for both farm and individual dispatches)
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
        
        // Initialize trip distribution with default status values for farmer view
        const tripsWithStatus = trips.map(trip => ({
          ...trip,
          status: 'pending' as 'pending' | 'received',
          reason: 'DOA' as 'DOA' | 'N/A'
        }));
        
        setDispatchInvoiceData(invoiceData);
        setCustomerDetails(customerDetails);
        setTripDistribution(tripsWithStatus);
        
        // Clear placements when opening modal
        setPlacements([]);
        
        setIsDispatchModalVisible(true);
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

  // Placement management functions
  const addPlacement = () => {
    const newPlacement: Placement = {
      id: Date.now().toString(),
      tripId: tripDistribution[0]?.tripId || '',
      penFlock: 1,
      quantity: 0
    };
    setPlacements([...placements, newPlacement]);
  };

  const updatePlacement = (id: string, field: keyof Placement, value: string | number) => {
    setPlacements(placements.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));

    // Auto-calculate N/A when quantity changes
    if (field === 'quantity') {
      const updatedPlacement = placements.find(p => p.id === id);
      if (updatedPlacement) {
        const tripId = updatedPlacement.tripId;
        const difference = calculateTripDifference(tripId);
        const doaValue = doaValues[tripId] || 0;
        const naValue = Math.max(0, difference - doaValue);
        updateNaValue(tripId, naValue);
      }
    }
  };

  const removePlacement = (id: string) => {
    setPlacements(placements.filter(p => p.id !== id));
  };

  const calculateTripDifference = (tripId: string) => {
    const trip = tripDistribution.find(t => t.tripId === tripId);
    if (!trip) return 0;
    
    const placedQuantity = placements
      .filter(p => p.tripId === tripId)
      .reduce((sum, p) => sum + p.quantity, 0);
    
    // Positive when placed > trip quantity (over-placement)
    return placedQuantity - trip.totalQuantity;
  };

  const calculatePenFlockSummary = () => {
    const summary: { [key: number]: number } = {};
    placements.forEach(placement => {
      summary[placement.penFlock] = (summary[placement.penFlock] || 0) + placement.quantity;
    });
    return summary;
  };

  const updateTripStatus = (tripId: string, status: 'pending' | 'received') => {
    setTripDistribution(tripDistribution.map(trip => 
      trip.tripId === tripId ? { ...trip, status } : trip
    ));
  };

  const updateTripReason = (tripId: string, reason: 'DOA' | 'N/A') => {
    setTripDistribution(tripDistribution.map(trip => 
      trip.tripId === tripId ? { ...trip, reason } : trip
    ));
  };

  // Update DOA and N/A values
  const updateDoaValue = (tripId: string, value: number) => {
    setDoaValues(prev => ({ ...prev, [tripId]: value }));
  };

  const updateNaValue = (tripId: string, value: number) => {
    setNaValues(prev => ({ ...prev, [tripId]: value }));
  };

  // Confirm Receipt functionality
  const confirmReceipt = async () => {
    if (!currentDispatch) return;
    
    const receiptData = {
      id: currentDispatch.id,
      dispatchNumber: currentDispatch.dispatch_number,
      confirmedAt: new Date().toISOString(),
      tripDistribution: tripDistribution.map(trip => ({
        ...trip,
        difference: calculateTripDifference(trip.tripId),
        status: calculateTripDifference(trip.tripId) === 0 ? 'received' : trip.status,
        doa: doaValues[trip.tripId] || 0,
        na: naValues[trip.tripId] || 0
      })),
      placements: placements,
      penFlockSummary: calculatePenFlockSummary(),
      confirmedBy: user?.name || 'Farmer'
    };
    
    // Check if we're editing an existing receipt
    const existingReceiptIndex = receivedDispatches.findIndex(r => r.id === currentDispatch.id);
    
    if (existingReceiptIndex >= 0) {
      // Update existing receipt - increment edit count
      const existingReceipt = receivedDispatches[existingReceiptIndex];
      const editCount = (existingReceipt.editCount || 0) + 1;
      const timerDuration = editCount === 1 ? 3 * 60 : 60; // 3 minutes for first edit, 60 seconds for subsequent
      
      updateReceipt(currentDispatch.id, { ...receiptData, editCount });
      
      // Update dispatch status in main dispatches table
      const { error: updateError } = await supabase
        .from('dispatches')
        .update({ status: 'received' })
        .eq('id', currentDispatch.id);
      
      if (updateError) {
        console.error('Error updating dispatch status:', updateError);
      } else {
        console.log('Successfully updated dispatch status to received for:', currentDispatch.id);
      }
      
      // Trigger refresh event for Dispatch page
      window.dispatchEvent(new CustomEvent('refreshDispatches'));
      
      // Set new timer duration
      setDispatchTimers(prev => ({
        ...prev,
        [currentDispatch.id]: timerDuration
      }));
    } else {
      // Create new receipt
      setReceivedDispatches(prev => [receiptData, ...prev]);
      setDispatchTimers(prev => ({
        ...prev,
        [currentDispatch.id]: 4 * 60 + 9 // 4 minutes 9 seconds for initial confirmation
      }));
      
      // Save to database for cross-device persistence
      const updatedReceivedDispatches = [receiptData, ...receivedDispatches];
      await saveReceivedDispatchesToDB(updatedReceivedDispatches);
      
      // Update dispatch status in main dispatches table
      const { error: updateError } = await supabase
        .from('dispatches')
        .update({ status: 'received' })
        .eq('id', currentDispatch.id);
      
      if (updateError) {
        console.error('Error updating dispatch status:', updateError);
      } else {
        console.log('Successfully updated dispatch status to received for:', currentDispatch.id);
      }
      
      // Trigger refresh event for Dispatch page
      window.dispatchEvent(new CustomEvent('refreshDispatches'));
      
      // Start timer
      const timerInterval = setInterval(() => {
        setDispatchTimers(prev => {
          const newTimers = { ...prev };
          if (newTimers[currentDispatch.id] > 0) {
            newTimers[currentDispatch.id]--;
          } else {
            clearInterval(timerInterval);
          }
          return newTimers;
        });
      }, 1000);
    }
    
    setIsDispatchModalVisible(false);
  };

  // Save received dispatches to database for cross-device persistence
  const saveReceivedDispatchesToDB = async (dispatches: any[]) => {
    try {
      // First, clear existing records for this farm
      await supabase
        .from('received_dispatches')
        .delete()
        .eq('farm_name', farmInfo.farmName);

      // Insert new records
      if (dispatches.length > 0) {
        const records = dispatches.map(receipt => ({
          farm_name: farmInfo.farmName,
          dispatch_id: receipt.id,
          dispatch_number: receipt.dispatchNumber,
          confirmed_at: receipt.confirmedAt,
          trip_distribution: receipt.tripDistribution,
          placements: receipt.placements,
          pen_flock_summary: receipt.penFlockSummary,
          confirmed_by: receipt.confirmedBy,
          edit_count: receipt.editCount || 0,
          updated_at: receipt.updatedAt || receipt.confirmedAt,
          status: receipt.status || 'Confirmed'
        }));

        const { error } = await supabase
          .from('received_dispatches')
          .insert(records);

        if (error) {
          console.error('Error saving received dispatches to DB:', error);
          console.error('Error details:', error.message, error.code, error.details);
          console.error('Records being inserted:', records);
        }
      }
    } catch (error) {
      console.error('Error in saveReceivedDispatchesToDB:', error);
    }
  };

  // Load received dispatches from database
  const loadReceivedDispatchesFromDB = async () => {
    try {
      console.log('Loading received dispatches for farm:', farmInfo.farmName);
      const { data, error } = await supabase
        .from('received_dispatches')
        .select('*')
        .eq('farm_name', farmInfo.farmName)
        .order('confirmed_at', { ascending: false });

      if (error) {
        console.error('Error loading received dispatches from DB:', error);
        return [];
      }

      console.log('Loaded received dispatches from DB:', data);
      const mappedData = data.map(record => ({
        id: record.dispatch_id,
        dispatch_id: record.dispatch_id, // Add this for consistency
        dispatchNumber: record.dispatch_number,
        confirmedAt: record.confirmed_at,
        tripDistribution: record.trip_distribution,
        placements: record.placements,
        penFlockSummary: record.pen_flock_summary,
        confirmedBy: record.confirmed_by,
        editCount: record.edit_count || 0,
        updatedAt: record.updated_at,
        status: record.status || 'Confirmed' // Ensure status is set
      }));
      
      console.log('Mapped received dispatches:', mappedData);
      return mappedData;
    } catch (error) {
      console.error('Error in loadReceivedDispatchesFromDB:', error);
      return [];
    }
  };

  // Update existing receipt instead of creating new one
  const updateReceipt = async (receiptId: string, updatedData: any) => {
    const updatedReceivedDispatches = receivedDispatches.map(receipt => 
      receipt.id === receiptId 
        ? { ...receipt, ...updatedData, updatedAt: new Date().toISOString() }
        : receipt
    );
    
    setReceivedDispatches(updatedReceivedDispatches);
    await saveReceivedDispatchesToDB(updatedReceivedDispatches);
  };

  // Toggle expanded state for received dispatches
  const toggleExpandedReceivedDispatch = (dispatchId: string) => {
    setExpandedReceivedDispatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dispatchId)) {
        newSet.delete(dispatchId);
      } else {
        newSet.add(dispatchId);
      }
      return newSet;
    });
  };

  // Format timer display
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Extract trip ID ending (e.g., "TRIP-BFLOS-053-DISP-01" -> "DISP-01")
  const getTripIdEnding = (tripId: string) => {
    const parts = tripId.split('-');
    return parts.slice(-2).join('-'); // Get last two parts (DISP-01)
  };

  // Get hatches for a specific pen/flock based on placements
  const getHatchesForPenFlock = (penFlock: number) => {
    const penPlacements = placements.filter(p => p.penFlock === penFlock);
    const tripIds = [...new Set(penPlacements.map(p => p.tripId))];
    
    return tripIds.flatMap(tripId => {
      const trip = tripDistribution.find(t => t.tripId === tripId);
      return trip?.hatches || [];
    });
  };

  // Get hatches for a specific pen/flock in received dispatch
  const getHatchesForPenFlockReceived = (penFlock: number, receipt: any) => {
    const penPlacements = receipt.placements.filter((p: any) => p.penFlock === penFlock);
    const tripIds = [...new Set(penPlacements.map((p: any) => p.tripId))];
    
    return tripIds.flatMap((tripId: string) => {
      const trip = receipt.tripDistribution.find((t: any) => t.tripId === tripId);
      return trip?.hatches || [];
    });
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
    console.log('FarmDetail debug:', {
      farmId,
      farmName,
      decodedFarmName: farmName ? decodeURIComponent(farmName) : null,
      userRole: user?.role,
      userName: user?.name
    });
    
    // Check if farmer is trying to access a farm that's not theirs
    if (user?.role === Role.Farmer && farmId) {
      const checkFarmerAccess = async () => {
        try {
          const { data: farmData, error: farmError } = await supabase
            .from('farm_customers')
            .select('id, farm_name')
            .eq('id', farmId)
            .single();

          if (farmError || !farmData) {
            console.error('Error finding farm for access check:', farmError);
            setError('Farm not found.');
            return;
          }

          // Check if the farmer's name matches the farm name
          if (farmData.farm_name !== user.name) {
            console.error('Farmer access denied:', {
              farmerName: user.name,
              farmName: farmData.farm_name,
              farmId
            });
            setError('Access denied. You can only access your own farm.');
            return;
          }

          console.log('Farmer access granted to farm:', farmData);
        } catch (err) {
          console.error('Unexpected error in farmer access check:', err);
          setError('An unexpected error occurred while checking access.');
        }
      };

      checkFarmerAccess();
    }
    
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
  // Fetch flocks based on received dispatches
  useEffect(() => {
    const fetchFlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current received dispatches
        const currentReceivedDispatches = receivedDispatches;
        
        // Create flocks based on received dispatches data
        const autoFlocks: Flock[] = [];
        let flockCounter = 1;
        
        // Process each received dispatch to create flocks
        for (const [receiptIndex, receipt] of currentReceivedDispatches.entries()) {
          if (receipt.penFlockSummary) {
            // Convert pen/flock summary to flock objects
            for (const [penFlockNumber, quantity] of Object.entries(receipt.penFlockSummary)) {
              const penFlockNum = parseInt(penFlockNumber);
              const totalQuantity = quantity as number;
              
              // Get hatch information for this pen/flock
              const hatches = getHatchesForPenFlockReceived(penFlockNum, receipt);
              const hatchNumbers = hatches.map((h: any) => h.hatchNo).join(', ');
              
              // Fetch breed data from hatches table
              let breed = 'Broiler'; // Default breed
              if (hatches.length > 0) {
                try {
                  const { data: hatchData } = await supabase
                    .from('hatch_cycles')
                    .select('breed, supplier')
                    .in('hatch_no', hatches.map((h: any) => h.hatchNo))
                    .limit(1);
                  
                  if (hatchData && hatchData.length > 0) {
                    breed = hatchData[0].breed || 'Broiler';
                  }
                } catch (error) {
                  console.error('Error fetching breed data:', error);
                }
              }
              
              // Determine status based on dispatch age
              const dispatchDate = new Date(receipt.confirmedAt);
              const daysSinceDispatch = Math.floor((Date.now() - dispatchDate.getTime()) / (1000 * 60 * 60 * 24));
              const status = daysSinceDispatch > 30 ? 'Completed' : 'Active';
              
              const flock: Flock = {
                id: `flock-${receiptIndex}-${penFlockNum}`,
                farmId: farmId || '',
                flockNumber: flockCounter++,
                flockName: `Flock ${penFlockNum}`,
                breed: breed,
                quantity: totalQuantity,
                startDate: dispatchDate.toISOString().split('T')[0],
                status: status,
                notes: `Auto-created from dispatch ${receipt.dispatchNumber}. Hatches: ${hatchNumbers}`,
                createdBy: receipt.confirmedBy || 'System',
                createdAt: receipt.confirmedAt,
              };
              
              autoFlocks.push(flock);
            }
          }
        }
        
        // Sort flocks by flock number
        autoFlocks.sort((a, b) => a.flockNumber - b.flockNumber);
        
        setFlocks(autoFlocks);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred.');
        setFlocks([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (farmInfo.farmName && receivedDispatchesLoaded) {
      fetchFlocks();
    }
  }, [farmInfo.farmName, receivedDispatchesLoaded, farmId]);

  // Fetch dispatches when farm info is available
  useEffect(() => {
    if (farmInfo.farmName) {
      fetchFarmDispatches();
    }
  }, [farmInfo.farmName]);

  // Load received dispatches from database on component mount
  useEffect(() => {
    const loadDispatches = async () => {
      if (farmInfo.farmName) {
        const dbDispatches = await loadReceivedDispatchesFromDB();
        setReceivedDispatches(dbDispatches);
        setReceivedDispatchesLoaded(true); // Mark as loaded
        
        // Restore timers for farmer view
        if (isFarmerView) {
          const now = Date.now();
          dbDispatches.forEach((receipt: any) => {
            const confirmedAt = new Date(receipt.confirmedAt).getTime();
            const elapsed = Math.floor((now - confirmedAt) / 1000);
            const remaining = Math.max(0, (4 * 60 + 9) - elapsed); // 4 minutes 9 seconds
            if (remaining > 0) {
              setDispatchTimers(prev => ({ ...prev, [receipt.id]: remaining }));
            }
          });
        }
      }
    };
    
    loadDispatches();
  }, [farmInfo.farmName, isFarmerView]);

  // Start timer intervals for active timers
  useEffect(() => {
    const intervals: { [key: string]: NodeJS.Timeout } = {};
    
    // Start intervals for all active timers
    Object.keys(dispatchTimers).forEach(receiptId => {
      if (dispatchTimers[receiptId] > 0) {
        intervals[receiptId] = setInterval(() => {
          setDispatchTimers(prev => {
            const newTimers = { ...prev };
            if (newTimers[receiptId] > 0) {
              newTimers[receiptId]--;
            } else {
              // Timer expired, clear the interval
              if (intervals[receiptId]) {
                clearInterval(intervals[receiptId]);
                delete intervals[receiptId];
              }
            }
            return newTimers;
          });
        }, 1000);
      }
    });

    // Cleanup function
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [dispatchTimers]);

  // Calculate flock age in weeks and days
  const calculateFlockAge = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return { weeks, days };
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
        </div>

        {/* Incoming Dispatches Section - Different views for Admin vs Farmer */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Incoming Dispatches</h2>
          
          {isFarmerView ? (
            /* Farmer View - Chicks Arriving Button */
            <div className="text-center py-8">
              {dispatches.filter(dispatch => 
                !receivedDispatches.some(received => 
                  received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                )
              ).length > 0 ? (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      const incomingDispatches = dispatches.filter(dispatch => 
                        !receivedDispatches.some(received => 
                          received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                        )
                      );
                      if (incomingDispatches.length > 0) {
                        handleViewDispatch(incomingDispatches[0]);
                      }
                    }}
                    className="text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg"
                    style={{ backgroundColor: '#ff8c42' }}
             onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
             onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    Chicks Arriving
                  </button>
                  <p className="text-sm text-gray-600">
                    {dispatches.filter(dispatch => 
                      !receivedDispatches.some(received => 
                        received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                      )
                    ).length} dispatch{dispatches.filter(dispatch => 
                      !receivedDispatches.some(received => 
                        received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                      )
                    ).length > 1 ? 'es' : ''} scheduled for today
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    disabled
                    className="bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg cursor-not-allowed"
                  >
                    Chicks Arriving
                  </button>
                  <p className="text-sm text-gray-500">No incoming dispatches</p>
                </div>
              )}
            </div>
          ) : (
            /* Admin View - Table */
            <div className="overflow-x-auto">
            <table className="modern-table min-w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="sticky top-0 z-10" style={{
                backgroundColor: '#ff8c42',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <tr>
                  {[
                    'Dispatch Number', 'Date', 'Trips', 'Dispatch Note'
                  ].map((header, index) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                      style={{ 
                        width: '25%', 
                        minWidth: '25%',
                        backgroundColor: '#ff8c42',
                        color: 'white',
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div className="flex items-center">
                        <span className="text-white font-medium text-xs">{header}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
                <tbody>
                  {dispatches.filter(dispatch => {
                    const isConfirmed = receivedDispatches.some(received => 
                      received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                    );
                    console.log(`Dispatch ${dispatch.dispatch_number} (ID: ${dispatch.id}) - isConfirmed: ${isConfirmed}`);
                    console.log('Received dispatches:', receivedDispatches.map(r => ({ id: r.id, dispatch_id: r.dispatch_id, status: r.status, dispatchNumber: r.dispatchNumber })));
                    if (isConfirmed) {
                      console.log('Matching received dispatch:', receivedDispatches.find(received => 
                        received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                      ));
                    }
                    return !isConfirmed;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500" style={{ width: '100%' }}>
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
                    dispatches.filter(dispatch => {
                      const isConfirmed = receivedDispatches.some(received => 
                        received.dispatch_id === dispatch.id && received.status === 'Confirmed'
                      );
                      console.log(`Filtering dispatch ${dispatch.dispatch_number} (ID: ${dispatch.id}) - isConfirmed: ${isConfirmed}`);
                      return !isConfirmed;
                    }).map(dispatch => (
                      <tr key={dispatch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-800 break-words" style={{ width: '25%', minWidth: '25%' }}>
                          {dispatch.dispatch_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-800 break-words" style={{ width: '25%', minWidth: '25%' }}>
                          {dispatch.date_dispatched ? new Date(dispatch.date_dispatched).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-800 break-words" style={{ width: '25%', minWidth: '25%' }}>
                          {dispatch.trucks || 1}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-800 break-words" style={{ width: '25%', minWidth: '25%' }}>
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
          )}
        </div>

        {/* Received Dispatches Section */}
        {receivedDispatches.length > 0 && (
          <>
            {console.log('Received dispatches:', receivedDispatches)}
            {console.log('Dispatches:', dispatches)}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Received Dispatches</h2>
            <div className="space-y-4">
              {receivedDispatches.map((receipt, index) => {
                const timer = dispatchTimers[receipt.id] || 0;
                const isEditable = isFarmerView && timer > 0;
                const isExpanded = expandedReceivedDispatches.has(receipt.id);
                
                return (
                  <div key={receipt.id} className="mb-4">
                    {/* Header with expand/collapse button */}
                    <button
                      onClick={() => toggleExpandedReceivedDispatch(receipt.id)}
                      className="w-full text-white px-4 py-3 rounded-lg transition-colors flex justify-between items-center"
                      style={{ backgroundColor: '#ff8c42' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                    >
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-white">
                          {receipt.dispatchNumber}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <p className="text-sm text-white opacity-90">
                          Confirmed by: {receipt.confirmedBy} • {new Date(receipt.confirmedAt).toLocaleString()}
                        </p>
                        <svg
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {isEditable && (
                      <div className="text-right mt-2">
                        <div className="text-sm text-gray-600 mb-1">Edit Time Remaining:</div>
                        <div className={`text-lg font-bold ${timer < 300 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatTimer(timer)}
                        </div>
                      </div>
                    )}
                    
                    {/* Expanded content */}
                    {isExpanded && (
                      <>
                    
                    {/* Trip Summary */}
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Trip Summary:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 table-fixed">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Trip ID</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Quantity</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receipt.tripDistribution.map((trip: any, tripIndex: number) => (
                              <tr key={tripIndex} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-xs text-gray-800">
                                  {trip.tripId}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs text-gray-800">
                                  {trip.totalQuantity.toLocaleString()}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs text-gray-800">
                                  <span className={`font-medium ${
                                    trip.difference > 0 ? 'text-green-600' :
                                    trip.difference < 0 ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {trip.difference > 0 ? `+${trip.difference.toLocaleString()}` : trip.difference.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Pen/Flock Summary */}
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Pen/Flock Summary:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 table-fixed">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Pen/Flock</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Hatches</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Total Chicks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(receipt.penFlockSummary)
                              .sort(([a], [b]) => parseInt(a) - parseInt(b))
                              .map(([penFlock, total]) => (
                                <tr key={penFlock} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-800">
                                    {penFlock}
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-800">
                                    {getHatchesForPenFlockReceived(parseInt(penFlock), receipt)
                                      .map((hatch: any, index: number) => (
                                        <div key={index} className="text-xs">
                                          {hatch.hatchNo}
                                        </div>
                                      ))
                                    }
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-800 font-medium">
                                    {total.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* DOA/N/A Summary Note for Received Dispatch */}
                    {receipt.tripDistribution && receipt.tripDistribution.some((trip: any) => trip.doa > 0 || trip.na > 0) && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">DOA Total:</span>
                            <span className="text-red-600 font-semibold">
                              {receipt.tripDistribution.reduce((sum: number, trip: any) => sum + (trip.doa || 0), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-medium">N/A Total:</span>
                            <span className="text-gray-600 font-semibold">
                              {receipt.tripDistribution.reduce((sum: number, trip: any) => sum + (trip.na || 0), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-300">
                            <span className="font-medium">Total Difference:</span>
                            <span className="text-blue-600 font-semibold">
                              {(receipt.tripDistribution.reduce((sum: number, trip: any) => sum + (trip.doa || 0), 0) + 
                                receipt.tripDistribution.reduce((sum: number, trip: any) => sum + (trip.na || 0), 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                        {/* View Dispatch Note Button - Admin Only */}
                        {!isFarmerView && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => handleViewReceivedDispatch(receipt)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                              View Dispatch Note
                            </button>
                          </div>
                        )}
                        
                        {/* Edit Receipt Button - Only show when editable */}
                        {isEditable && (
                          <div className="text-center pt-3 border-t border-gray-300">
                            <p className="text-sm text-gray-600 mb-2">
                              You can make edits/corrections until the timer expires
                            </p>
                            <button
                              onClick={() => handleEditReceipt(receipt)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                            >
                              Edit Receipt
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}

        {/* Pen Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Pen Management</h2>
            </div>
          </div>

          {/* Pen Cards Grid */}
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-4xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Pen Management</h3>
              <p className="text-gray-500 mb-6">
                Manage and track individual pens within this farm.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg max-w-md mx-auto">
                <p className="text-blue-800 font-semibold mb-2">Coming Soon...</p>
                <p className="text-blue-700">
                  Pen management features will be available in the next update.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Flock Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Flock Management</h2>
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
                      <span className="font-bold text-white uppercase text-sm tracking-wider">{flock.flockName}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>

                    {/* Flock Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Breed:</span>
                        <span className="text-gray-800 text-sm flex-1">{flock.breed}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Date Started:</span>
                        <span className="text-gray-800 text-sm flex-1">{new Date(flock.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Flock Age:</span>
                        <span className="text-gray-800 text-sm flex-1">
                          {(() => {
                            const age = calculateFlockAge(flock.startDate);
                            return `${age.weeks} weeks ${age.days} days`;
                          })()}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Weight:</span>
                        <span className="text-gray-500 text-sm flex-1 italic">Coming Soon</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Mortality:</span>
                        <span className="text-gray-500 text-sm flex-1 italic">Coming Soon</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Starting Qty:</span>
                        <span className="text-gray-800 text-sm flex-1">{flock.quantity.toLocaleString()}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Current Qty:</span>
                        <span className="text-gray-500 text-sm flex-1 italic">Coming Soon</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Current FCR:</span>
                        <span className="text-gray-500 text-sm flex-1 italic">Coming Soon</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 font-medium w-24 text-sm">Status:</span>
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
      </div>

      {/* Dispatch Note Modal */}
      {isDispatchModalVisible && currentDispatch && dispatchInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 pr-2">Dispatch Note - {currentDispatch.dispatch_number}</h3>
              <div className="flex items-center space-x-3">
                {/* Download PDF Button - Admin Only */}
                {!isFarmerView && (
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
                )}
                
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
                
                {/* Dispatch Note Header - Admin Only */}
                {!isFarmerView && (
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">DISPATCH NOTE</h2>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Tin #010067340</p>
                      <p className="text-sm text-gray-600 mb-1">Date: {dispatchInvoiceData?.date_sent ? new Date(dispatchInvoiceData.date_sent).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Dispatch #: {currentDispatch.dispatch_number}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Details */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                  {currentDispatch.type === 'Delivery' ? 'Deliver to:' : 'Dispatch to:'}
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  {customerDetails ? (
                    <div className="space-y-1 text-sm sm:text-base">
                      <p className="font-medium text-gray-800">Customer Name: {customerDetails.name}</p>
                      <p className="text-gray-600">Address: {customerDetails.address}</p>
                      <p className="text-gray-600">Phone: {customerDetails.phone}</p>
                      {customerDetails.email && <p className="text-gray-600">Email: {customerDetails.email}</p>}
                      {customerDetails.contactPerson && <p className="text-gray-600">Contact Person: {customerDetails.contactPerson}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm sm:text-base">Customer details not available</p>
                  )}
                </div>
              </div>

              {/* Trip Details */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Trip Details:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Trip ID</th>
                        {!isFarmerView && (
                          <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Hatch NO's</th>
                        )}
                        <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Trip Quantity</th>
                        {isFarmerView && (
                          <>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Difference</th>
                            {tripDistribution.some(trip => calculateTripDifference(trip.tripId) < 0) && (
                              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">DOA</th>
                            )}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tripDistribution.map((trip, index) => {
                        const difference = calculateTripDifference(trip.tripId);
                        const showDoaNa = difference < 0; // Only show DOA/N/A fields when under-placed (negative difference)
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                              {trip.tripId}
                            </td>
                            {!isFarmerView && (
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                                {trip.hatches.map((hatch: any, hatchIndex: number) => (
                                  <div key={hatchIndex} className="text-xs">
                                    {hatch.hatchNo}
                                  </div>
                                ))}
                              </td>
                            )}
                            <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                              {trip.totalQuantity.toLocaleString()}
                            </td>
                            {isFarmerView && (
                              <>
                                <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                                  <span className={`font-medium ${
                                    difference > 0 ? 'text-green-600' : // Over-placed (positive) = green
                                    difference < 0 ? 'text-red-600' :   // Under-placed (negative) = red
                                    'text-gray-600'                      // Exact match = gray
                                  }`}>
                                    {difference > 0 ? `+${difference.toLocaleString()}` : difference.toLocaleString()}
                                  </span>
                                </td>
                                {showDoaNa && (
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                                    <input
                                      type="number"
                                      value={doaValues[trip.tripId] || 0}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        const maxDoa = Math.abs(difference);
                                        if (value <= maxDoa) {
                                          updateDoaValue(trip.tripId, value);
                                          // Auto-calculate N/A as remaining difference
                                          updateNaValue(trip.tripId, maxDoa - value);
                                        }
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                      min="0"
                                      max={Math.abs(difference)}
                                    />
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Placement Table - Farmer View Only */}
              {isFarmerView && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Placement:</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-sm font-semibold text-gray-700 w-32 sm:w-auto">Trip #</th>
                          <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-sm font-semibold text-gray-700 w-20 sm:w-auto">Pen/Flock</th>
                          <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-sm font-semibold text-gray-700 w-24 sm:w-auto">Quantity</th>
                          <th className="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-700 w-12">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {placements.map(placement => (
                          <tr key={placement.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm text-gray-800">
                              <select
                                value={placement.tripId}
                                onChange={(e) => updatePlacement(placement.id, 'tripId', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {tripDistribution.map(trip => (
                                  <option key={trip.tripId} value={trip.tripId}>
                                    {getTripIdEnding(trip.tripId)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm text-gray-800">
                              <select
                                value={placement.penFlock}
                                onChange={(e) => updatePlacement(placement.id, 'penFlock', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                  <option key={num} value={num}>
                                    {num}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm text-gray-800">
                              <input
                                type="number"
                                value={placement.quantity}
                                onChange={(e) => updatePlacement(placement.id, 'quantity', parseInt(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-800">
                              <button
                                onClick={() => removePlacement(placement.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove placement"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3,6 5,6 21,6"></polyline>
                                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={addPlacement}
                      className="mt-3 w-full text-white font-medium py-2 px-4 rounded transition-colors"
                      style={{ backgroundColor: '#ff8c42' }}
             onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
             onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                    >
                      + Add Placement
                    </button>
                  </div>
                  
                  {/* Summary Table */}
                  {Object.keys(calculatePenFlockSummary()).length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Pen/Flock Summary:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Pen/Flock</th>
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Hatches</th>
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Total Chicks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(calculatePenFlockSummary())
                              .sort(([a], [b]) => parseInt(a) - parseInt(b))
                              .map(([penFlock, total]) => (
                                <tr key={penFlock} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">
                                    {penFlock}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">
                                    {getHatchesForPenFlock(parseInt(penFlock))
                                      .map((hatch: any, index: number) => (
                                        <div key={index} className="text-xs">
                                          {hatch.hatchNo}
                                        </div>
                                      ))
                                    }
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800 font-medium">
                                    {total.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* DOA/N/A Summary Note */}
                  {Object.keys(doaValues).length > 0 ? (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">DOA Total:</span>
                          <span className="text-red-600 font-semibold">
                            {Object.values(doaValues).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium">N/A Total:</span>
                          <span className="text-gray-600 font-semibold">
                            {Object.values(naValues).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-300">
                          <span className="font-medium">Total Difference:</span>
                          <span className="text-blue-600 font-semibold">
                            {(() => {
                              const doaTotal = Object.values(doaValues).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
                              const naTotal = Object.values(naValues).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
                              return (Number(doaTotal) + Number(naTotal)).toLocaleString();
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Confirm Receipt Button */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={confirmReceipt}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg"
                    >
                      Confirm Receipt
                    </button>
                  </div>
                </div>
              )}

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
