import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/supabase';
import { Role } from '../types';

interface FarmInfo {
  farmName: string;
  farmAddress: string;
  contactPerson: string;
  contactNumber: string;
}

interface Flock {
  id: string;
  farmId: string;
  flockNumber: number;
  flockName: string;
  breed: string;
  quantity: number;
  startDate: string;
  status: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

interface PenDetail {
  id: string;
  farm_id: string;
  pen_number: number;
  length_meters: number;
  width_meters: number;
  area_square_meters: number;
  min_birds: number;
  max_birds: number;
}

const FarmDetail: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  
  const [farmInfo, setFarmInfo] = useState<FarmInfo>({
    farmName: '',
    farmAddress: '',
    contactPerson: '',
    contactNumber: ''
  });
  
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [penDetails, setPenDetails] = useState<PenDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feed Delivery state
  const [isFeedDeliveryOpen, setIsFeedDeliveryOpen] = useState(false);
  const [feedDeliveryData, setFeedDeliveryData] = useState({
    feedType: 'Starter',
    numberOfBags: 0,
    deliveryNumber: 0,
    deliveryImage: null as File | null
  });
  const [feedDeliverySubmitted, setFeedDeliverySubmitted] = useState(false);
  
  // Purchase Delivery state
  const [isPurchaseDeliveryOpen, setIsPurchaseDeliveryOpen] = useState(false);
  const [purchaseDeliveryData, setPurchaseDeliveryData] = useState({
    invoiceNumber: '',
    amount: 0,
    invoiceImage: null as File | null
  });
  const [purchaseDeliverySubmitted, setPurchaseDeliverySubmitted] = useState(false);
  
  // User state
  const [user, setUser] = useState<any>(null);

  // Get user info
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        console.log('Fetched user profile:', profile);
        setUser(profile);
      }
    };
    getUser();
  }, []);

  // Fetch farm information
  useEffect(() => {
    const fetchFarmInfo = async () => {
      try {
        console.log('Fetching farm info for farmId:', farmId);
        setLoading(true);
        setError(null);
        
        if (farmId) {
          const { data: farmData, error: farmError } = await supabase
            .from('farm_customers')
          .select('*')
            .eq('id', farmId)
          .single();

          if (farmError) {
            console.error('Error fetching farm info:', farmError);
            setError('Farm not found');
          return;
          }

          if (farmData) {
            console.log('Farm data found:', farmData);
            setFarmInfo({
              farmName: farmData.farm_name || '',
              farmAddress: farmData.farm_address || '',
              contactPerson: farmData.contact_person || '',
              contactNumber: farmData.contact_number || ''
            });
          } else {
            console.log('No farm data found');
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching farm info:', err);
        setError('An unexpected error occurred while fetching farm information');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmInfo();
  }, [farmId]);

  // Fetch flocks for this farm
  useEffect(() => {
    const fetchFlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For now, create some sample flocks
        const sampleFlocks: Flock[] = [
          {
            id: 'flock-1',
            farmId: farmId || '',
            flockNumber: 1,
            flockName: 'Pen 1',
            breed: 'Broiler',
            quantity: 1000,
            startDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            notes: 'Sample pen',
            createdBy: 'System',
            createdAt: new Date().toISOString()
          }
        ];
        
        setFlocks(sampleFlocks);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
        setFlocks([]);
      } finally {
        setLoading(false);
      }
    };
    
    console.log('farmInfo.farmName:', farmInfo.farmName);
    if (farmInfo.farmName) {
      console.log('Fetching flocks and pen details...');
      fetchFlocks();
      fetchPenDetails();
    } else {
      console.log('No farm name, skipping flock fetch');
    }
  }, [farmInfo.farmName, farmId]);

  // Fetch pen details
  const fetchPenDetails = async () => {
    try {
      if (!farmId) return;
      
      const { data: penData, error } = await supabase
        .from('farm_pens')
          .select('*')
        .eq('farm_id', farmId)
        .order('pen_number', { ascending: true });
        
        if (error) {
        console.error('Error fetching pen details:', error);
        return;
      }

      setPenDetails(penData || []);
    } catch (error) {
      console.error('Error fetching pen details:', error);
    }
  };

  // Handle Feed Delivery data changes
  const handleFeedDeliveryChange = (field: string, value: any) => {
    setFeedDeliveryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Feed Delivery image upload
  const handleFeedDeliveryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeedDeliveryData(prev => ({
        ...prev,
        deliveryImage: file
      }));
    }
  };

  // Handle Purchase Delivery data changes
  const handlePurchaseDeliveryChange = (field: string, value: any) => {
    setPurchaseDeliveryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Purchase Delivery image upload
  const handlePurchaseDeliveryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPurchaseDeliveryData(prev => ({
        ...prev,
        invoiceImage: file
      }));
    }
  };

  // Save Purchase Delivery data to database
  const savePurchaseDeliveryData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const dataToSave = {
          farm_name: farmInfo.farmName,
        date: today,
        invoice_number: purchaseDeliveryData.invoiceNumber,
        amount: purchaseDeliveryData.amount,
        created_by: user?.name || 'farmer',
        updated_by: user?.name || 'farmer'
      };

      // Check if data already exists for today with same invoice number
      const { data: existingData } = await supabase
        .from('purchase_delivery')
        .select('id')
        .eq('farm_name', farmInfo.farmName)
        .eq('date', today)
        .eq('invoice_number', purchaseDeliveryData.invoiceNumber)
        .single();

      let imageUrl = null;

      // Upload image if provided
      if (purchaseDeliveryData.invoiceImage) {
        const fileExt = purchaseDeliveryData.invoiceImage.name.split('.').pop();
        const fileName = `purchase-delivery-${farmInfo.farmName}-${today}-${purchaseDeliveryData.invoiceNumber}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('purchase-delivery-images')
          .upload(fileName, purchaseDeliveryData.invoiceImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Error uploading image. Please try again.');
          return;
        }

        imageUrl = uploadData.path;
      }

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('purchase_delivery')
          .update({
            ...dataToSave,
            invoice_image_url: imageUrl
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating Purchase Delivery data:', updateError);
          alert('Error updating Purchase Delivery data. Please try again.');
        return;
      }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('purchase_delivery')
          .insert([{
            ...dataToSave,
            invoice_image_url: imageUrl
          }]);

        if (insertError) {
          console.error('Error inserting Purchase Delivery data:', insertError);
          alert('Error saving Purchase Delivery data. Please try again.');
        return;
        }
      }

      console.log('Successfully saved Purchase Delivery data:', dataToSave);
      alert('Purchase Delivery data saved successfully!');
      
      // Mark Purchase Delivery as submitted
      setPurchaseDeliverySubmitted(true);
      console.log('Purchase Delivery marked as submitted');
      
      setIsPurchaseDeliveryOpen(false);
    } catch (error) {
      console.error('Unexpected error saving Purchase Delivery data:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Save Feed Delivery data to database
  const saveFeedDeliveryData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const dataToSave = {
        flock_id: 'farm-wide', // Since this is farm-level, not pen-specific
        farm_name: farmInfo.farmName,
        date: today,
        feed_type: feedDeliveryData.feedType,
        number_of_bags: feedDeliveryData.numberOfBags,
        delivery_number: feedDeliveryData.deliveryNumber,
        created_by: user?.name || 'farmer',
        updated_by: user?.name || 'farmer'
      };

      // Check if data already exists for today
      const { data: existingData } = await supabase
        .from('feed_delivery')
        .select('id')
        .eq('farm_name', farmInfo.farmName)
        .eq('date', today)
        .eq('delivery_number', feedDeliveryData.deliveryNumber)
            .single();

      let imageUrl = null;

      // Upload image if provided
      if (feedDeliveryData.deliveryImage) {
        const fileExt = feedDeliveryData.deliveryImage.name.split('.').pop();
        const fileName = `feed-delivery-${farmInfo.farmName}-${today}-${feedDeliveryData.deliveryNumber}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feed-delivery-images')
          .upload(fileName, feedDeliveryData.deliveryImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Error uploading image. Please try again.');
          return;
        }

        imageUrl = uploadData.path;
      }

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('feed_delivery')
          .update({
            ...dataToSave,
            delivery_image_url: imageUrl
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating Feed Delivery data:', updateError);
          alert('Error updating Feed Delivery data. Please try again.');
          return;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('feed_delivery')
          .insert([{
            ...dataToSave,
            delivery_image_url: imageUrl
          }]);

        if (insertError) {
          console.error('Error inserting Feed Delivery data:', insertError);
          alert('Error saving Feed Delivery data. Please try again.');
          return;
        }
      }

      console.log('Successfully saved Feed Delivery data:', dataToSave);
      alert('Feed Delivery data saved successfully!');
      
      // Mark Feed Delivery as submitted
      setFeedDeliverySubmitted(true);
      console.log('Feed Delivery marked as submitted');
      
      setIsFeedDeliveryOpen(false);
    } catch (error) {
      console.error('Unexpected error saving Feed Delivery data:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleFlockClick = (flock: Flock) => {
    navigate(`/farm/${farmId}/pen/${flock.flockNumber}`, { 
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
        contactNumber: farmInfo.contactNumber,
        penNumber: flock.flockNumber
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

        {/* Admin View - General Info and Pen Details Tables */}
        {(() => {
          console.log('User role check:', user?.role, 'Role.Admin:', Role.Admin, 'Is Admin:', user?.role === Role.Admin);
          return user?.role === Role.Admin;
        })() ? (
          <>
            {/* General Info Table */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">General Info</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Name</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmInfo.farmName}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Address</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmInfo.farmAddress}</td>
                      </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Contact</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmInfo.contactPerson}</td>
                            </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Phone</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmInfo.contactNumber}</td>
                              </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
            {/* Pen Details Table */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Pen Details</h2>
                      <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pen #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length (m)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Width (m)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            </tr>
                          </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {penDetails.length > 0 ? (
                      penDetails.map((pen) => (
                        <tr key={pen.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pen.pen_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pen.length_meters}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pen.width_meters}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pen.min_birds} - {pen.max_birds} birds</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No pen details available</td>
                                </tr>
                    )}
                          </tbody>
                        </table>
                      </div>
                    </div>
          </>
        ) : (
          <>
            {/* Farmer View - Deliveries */}
            {console.log('Rendering farmer view for role:', user?.role)}
            <div className="bg-white rounded-lg shadow-md mb-6 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Deliveries</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Feed Button */}
                            <button
                  onClick={() => setIsFeedDeliveryOpen(true)}
                  className={`bg-[#ff8c42] hover:bg-[#e67e22] text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 h-16 flex items-center justify-center w-full ${
                    feedDeliverySubmitted ? 'bg-[#fffae5] text-gray-800' : ''
                  }`}
                  onMouseEnter={feedDeliverySubmitted ? (e) => {
                    e.target.style.backgroundColor = '#f5f0d8';
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                  } : (e) => e.target.style.backgroundColor = '#e67e22'}
                  onMouseLeave={feedDeliverySubmitted ? (e) => {
                    e.target.style.backgroundColor = '#fffae5';
                    e.target.style.transform = 'translateY(0) scale(1)';
                  } : (e) => e.target.style.backgroundColor = '#ff8c42'}
                >
                  Feed{feedDeliverySubmitted && ' ✓'}
                            </button>

                {/* Purchase Delivery Button */}
                            <button
                  onClick={() => setIsPurchaseDeliveryOpen(true)}
                  className={`bg-[#ff8c42] hover:bg-[#e67e22] text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 h-16 flex items-center justify-center w-full ${
                    purchaseDeliverySubmitted ? 'bg-[#fffae5] text-gray-800' : ''
                  }`}
                  onMouseEnter={purchaseDeliverySubmitted ? (e) => {
                    e.target.style.backgroundColor = '#f5f0d8';
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                  } : (e) => e.target.style.backgroundColor = '#e67e22'}
                  onMouseLeave={purchaseDeliverySubmitted ? (e) => {
                    e.target.style.backgroundColor = '#fffae5';
                    e.target.style.transform = 'translateY(0) scale(1)';
                  } : (e) => e.target.style.backgroundColor = '#ff8c42'}
                >
                  Purchase{purchaseDeliverySubmitted && ' ✓'}
                            </button>
                          </div>
                  </div>

            {/* Pens - Only for Farmers */}
            {user?.role !== Role.Admin && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Pens</h2>
            </div>
          </div>

                {/* Pen Cards Grid */}
          <div className="p-6">
            {flocks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">🐔</span>
                </div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pens Found</h3>
                <p className="text-gray-500 mb-6">
                        Add your first pen to start tracking poultry operations.
                </p>
              </div>
            ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {flocks.map(flock => {
                        // Find pen details for this flock
                        const penDetail = penDetails.find(pen => pen.pen_number === flock.flockNumber);
                        
                        return (
                    <button 
                            key={flock.id}
                      onClick={() => handleFlockClick(flock)}
                            className="bg-[#ff8c42] hover:bg-[#e67e22] text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 aspect-square flex flex-col items-center justify-center p-2"
                          >
                            <div className="text-center">
                              <div className="font-bold text-lg mb-1">Pen {flock.flockNumber}</div>
                              {penDetail && (
                                <div className="text-xs leading-tight">
                                  <div>{penDetail.length_meters}m × {penDetail.width_meters}m</div>
                                  <div>{penDetail.area_square_meters}m²</div>
                                  <div>Holds {penDetail.min_birds} to {penDetail.max_birds} Birds</div>
                      </div>
                              )}
                      </div>
                          </button>
                        );
                      })}
                      </div>
                        )}
                      </div>
              </div>
            )}
          </>
            )}
      </div>

      {/* Feed Delivery Modal */}
      {isFeedDeliveryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Feed Delivery</h3>
                  <button 
                onClick={() => setIsFeedDeliveryOpen(false)} 
                  className="text-gray-500 hover:text-gray-800 text-2xl"
                >
                  &times;
                </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Feed Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feed Type</label>
                <div className="space-y-2">
                  {['Starter', 'Grower', 'Finisher'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="feedType"
                        value={type}
                        checked={feedDeliveryData.feedType === type}
                        onChange={(e) => handleFeedDeliveryChange('feedType', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                  </div>
                </div>
                
              {/* Number of Bags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Bags</label>
                                    <input
                                      type="number"
                  value={feedDeliveryData.numberOfBags}
                  onChange={(e) => handleFeedDeliveryChange('numberOfBags', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      min="0"
                />
              </div>

              {/* Delivery Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Number</label>
                              <input
                                type="number"
                  value={feedDeliveryData.deliveryNumber}
                  onChange={(e) => handleFeedDeliveryChange('deliveryNumber', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                              />
              </div>

              {/* Delivery Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeedDeliveryImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t">
                              <button
                onClick={() => setIsFeedDeliveryOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
                              </button>
                    <button
                onClick={saveFeedDeliveryData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
                    </button>
                  </div>
                      </div>
                    </div>
                  )}
                  
      {/* Purchase Delivery Modal */}
      {isPurchaseDeliveryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Purchase Delivery</h3>
              <button 
                onClick={() => setIsPurchaseDeliveryOpen(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
                        </div>
            
            <div className="p-6 space-y-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                <input
                  type="text"
                  value={purchaseDeliveryData.invoiceNumber}
                  onChange={(e) => handlePurchaseDeliveryChange('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                        </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={purchaseDeliveryData.amount}
                  onChange={(e) => handlePurchaseDeliveryChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
                        </div>

              {/* Invoice Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePurchaseDeliveryImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                      </div>
                    </div>
                  
            <div className="flex justify-end space-x-3 p-6 border-t">
                    <button
                onClick={() => setIsPurchaseDeliveryOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePurchaseDeliveryData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
                    </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmDetail;