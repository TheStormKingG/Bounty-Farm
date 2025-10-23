import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  flockName: string;
  breed: string;
  quantity: number;
  startDate: string;
  status: string;
  notes?: string;
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
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

const PenPage: React.FC = () => {
  const { farmId, penNumber } = useParams<{ farmId: string; penNumber: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [farmInfo, setFarmInfo] = useState<FarmInfo>({
    farmName: '',
    farmAddress: '',
    contactPerson: '',
    contactNumber: '',
  });
  
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [penDetails, setPenDetails] = useState<PenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Today's Info modal state
  const [isTodaysInfoOpen, setIsTodaysInfoOpen] = useState(false);
  const [currentEditingDate, setCurrentEditingDate] = useState<Date | null>(null);
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);
  const [todaysData, setTodaysData] = useState({
    culls: 0,
    runts: 0,
    deaths: 0,
    feedType: 'Starter',
    feedUsed: 0
  });

  // Get farm info from navigation state
  useEffect(() => {
    if (location.state?.farmName) {
      setFarmInfo({
        farmName: location.state.farmName,
        farmAddress: location.state.farmAddress,
        contactPerson: location.state.contactPerson,
        contactNumber: location.state.contactNumber,
      });
    }
  }, [location.state]);

  // Load flocks for this pen
  useEffect(() => {
    loadFlocks();
  }, [farmId, penNumber]);

  const loadFlocks = async () => {
    try {
      setLoading(true);
      
      // Fetch pen details
      if (farmId && penNumber) {
        const { data: penData, error: penError } = await supabase
          .from('farm_pens')
          .select('*')
          .eq('farm_id', farmId)
          .eq('pen_number', parseInt(penNumber))
          .single();

        if (penError) {
          console.error('Error fetching pen details:', penError);
        } else {
          setPenDetails(penData);
        }
      }
      
      // For now, we'll create mock flocks for the pen
      // In a real implementation, you'd fetch from the database
      const mockFlocks: Flock[] = [
        {
          id: `flock-${penNumber}-1`,
          flockName: `Flock 1`,
          breed: 'Ross 308',
          quantity: 5000,
          startDate: new Date().toISOString(),
          status: 'Active',
          notes: 'First flock in pen'
        },
        {
          id: `flock-${penNumber}-2`,
          flockName: `Flock 2`,
          breed: 'Cobb 500',
          quantity: 4500,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Active',
          notes: 'Second flock in pen'
        }
      ];
      
      setFlocks(mockFlocks);
    } catch (error) {
      console.error('Error loading flocks:', error);
      setError('Failed to load flocks');
    } finally {
      setLoading(false);
    }
  };

  const handleFlockClick = (flock: Flock) => {
    setSelectedFlock(flock);
    setCurrentEditingDate(new Date());
    setTodaysData({ culls: 0, runts: 0, deaths: 0, feedType: 'Starter', feedUsed: 0 });
    setIsTodaysInfoOpen(true);
  };

  const handleTodaysDataChange = (field: string, value: any) => {
    setTodaysData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveTodaysData = async () => {
    try {
      const date = currentEditingDate || new Date();
      const dateStr = date.toISOString().split('T')[0];
      
      const dataToSave = {
        flock_id: selectedFlock?.id,
        farm_name: farmInfo.farmName,
        date: dateStr,
        culls: todaysData.culls,
        runts: todaysData.runts,
        deaths: todaysData.deaths,
        feed_type: todaysData.feedType,
        feed_used: todaysData.feedUsed,
        created_by: user?.name || 'farmer',
        updated_by: user?.name || 'farmer'
      };

      // Check if data already exists for this date
      const { data: existingData } = await supabase
        .from('daily_flock_data')
        .select('id')
        .eq('flock_id', selectedFlock?.id)
        .eq('date', dateStr)
        .single();

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('daily_flock_data')
          .update(dataToSave)
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating today\'s info:', updateError);
          alert('Error updating data. Please try again.');
          return;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('daily_flock_data')
          .insert([dataToSave]);

        if (insertError) {
          console.error('Error inserting today\'s info:', insertError);
          alert('Error saving data. Please try again.');
          return;
        }
      }

      alert('Data saved successfully!');
      setIsTodaysInfoOpen(false);
    } catch (error) {
      console.error('Unexpected error saving today\'s info:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pen details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Pen Details</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  onClick={() => navigate(`/farm/${farmId}`)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {farmInfo.farmName}
                </button>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">Pen {penNumber}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Pen {penNumber}</h1>
              <p className="text-gray-600 mt-1">{farmInfo.farmName}</p>
              {penDetails && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-700">Dimensions</div>
                    <div className="text-gray-600">{penDetails.length_meters}m × {penDetails.width_meters}m</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-700">Surface Area</div>
                    <div className="text-gray-600">{penDetails.area_square_meters}m²</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-700">Max Birds</div>
                    <div className="text-gray-600">{penDetails.min_birds} to {penDetails.max_birds} birds</div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/farm/${farmId}`)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Farm
            </button>
          </div>
        </div>

        {/* Flocks */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Flocks</h2>
            </div>
          </div>

          <div className="p-6">
            {flocks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">🐔</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Flocks Found</h3>
                <p className="text-gray-500 mb-6">
                  No flocks are currently assigned to this pen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {flocks.map(flock => (
                  <button 
                    key={flock.id}
                    onClick={() => handleFlockClick(flock)}
                    className="bg-[#ff8c42] hover:bg-[#e67e22] text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 aspect-square flex items-center justify-center"
                  >
                    {flock.flockName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Info Popup Modal */}
        {isTodaysInfoOpen && selectedFlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">
                  Today's Info - {selectedFlock.flockName} (Pen {penNumber})
                </h3>
                <button
                  onClick={() => setIsTodaysInfoOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Culls */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Culls:</label>
                  <input
                    type="number"
                    min="0"
                    value={todaysData.culls}
                    onChange={(e) => handleTodaysDataChange('culls', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter number of culls"
                  />
                </div>

                {/* Runts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Runts:</label>
                  <input
                    type="number"
                    min="0"
                    value={todaysData.runts}
                    onChange={(e) => handleTodaysDataChange('runts', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter number of runts"
                  />
                </div>

                {/* Deaths */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deaths:</label>
                  <input
                    type="number"
                    min="0"
                    value={todaysData.deaths}
                    onChange={(e) => handleTodaysDataChange('deaths', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter number of deaths"
                  />
                </div>

                {/* Feed Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feed Type:</label>
                  <div className="space-y-2">
                    {['Starter', 'Grower', 'Finisher'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="feedType"
                          value={type}
                          checked={todaysData.feedType === type}
                          onChange={(e) => handleTodaysDataChange('feedType', e.target.value)}
                          className="mr-2 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Feed Used */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feed Used (kg):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={todaysData.feedUsed}
                    onChange={(e) => handleTodaysDataChange('feedUsed', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter amount of feed used"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={saveTodaysData}
                    className="px-6 py-3 text-white rounded-lg transition-all duration-200 text-lg font-semibold"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    Save Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PenPage;
