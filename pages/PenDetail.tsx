import React, { useState, useEffect, useRef } from 'react';
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

const PenDetail: React.FC = () => {
  const { farmId, flockId } = useParams<{ farmId: string; flockId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [farmInfo, setFarmInfo] = useState<FarmInfo>({
    farmName: '',
    farmAddress: '',
    contactPerson: '',
    contactNumber: '',
    // Operational Scope
    operationalScope: 'LIVE PRODUCTION',
    title: 'GROW-OUT AND WELFARE REGISTER',
    dcn: 'RGS-15-IMS',
    growOutNumber: 2,
    totalChickensStarted: 10000,
    // Feed Usage
    starterUsedDelivered: '1.5_cELL OF dEL aMT',
    growerUsedDelivered: '1_cELL OF dEL aMT',
    finisherUsedDelivered: '0_cELL OF dEL aMT',
    // Batch Details
    creationDate: '30/06/2025',
    breed: 'R/R',
    batchNumber: '123456',
    dateStarted: '25/05/2025',
    dateCompleted: '10/07/2025',
    remainingOnFarm: 6999,
    totalSlaughterWeight: 60000,
    onFarmAvgWeight: 1360.78,
    estimatedProcessedWeight: 46800,
    flockAge: 144,
    // Approval & Revision
    approvalDate: '',
    versionNumber: 1,
    currentRevisionDate: '',
    scheduledRevisionDate: '30/06/2025',
    // Performance Metrics
    avgSlaughterWeight: 20,
    slaughterAge: 43,
    dailyGain: 0.4651162791,
    viability: 0.3,
    fcrToDate: 73.33311777,
    fcrAtSlaughter: 1.663170667,
    fcrAt1500g: 2.255170667,
    pef: 0.838969124,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Week tracking state
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  
  // Today's Info popup state
  const [isTodaysInfoOpen, setIsTodaysInfoOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentEditingDate, setCurrentEditingDate] = useState<Date | null>(null);
  const [flockStartDate, setFlockStartDate] = useState<Date | null>(null);
  
  // Testing Thursdays popup state
  const [isTestingThursdaysOpen, setIsTestingThursdaysOpen] = useState(false);
  const [testingThursdaysSubmitted, setTestingThursdaysSubmitted] = useState(false);
  const [testingThursdaysData, setTestingThursdaysData] = useState({
    ammoniaLevelsPpm: 0,
    drinkersFlowRateMlMin: 0,
    litterMoisture: 'Dry',
    lightIntensityLx: 0
  });
  
  // Today's Info data state
  const [todaysData, setTodaysData] = useState({
    culls: 0,
    runts: 0,
    deaths: 0,
    feedType: 'Starter',
    feedUsed: 0
  });
  
  // Submitted dates tracking
  const [submittedDates, setSubmittedDates] = useState<Set<string>>(new Set());

  // Get farm info from navigation state
  useEffect(() => {
    if (location.state?.farmInfo) {
      setFarmInfo(location.state.farmInfo);
    }
  }, [location.state]);

  // Load submitted dates on component mount
  useEffect(() => {
    loadSubmittedDates();
  }, []);

  const loadSubmittedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('todays_info')
        .select('date')
        .eq('flock_id', flockId);

      if (error) {
        console.error('Error loading submitted dates:', error);
        return;
      }

      const dates = new Set(data?.map(item => item.date) || []);
      setSubmittedDates(dates);
    } catch (error) {
      console.error('Unexpected error loading submitted dates:', error);
    }
  };

  const loadDataForDate = async (date: Date): Promise<any> => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('todays_info')
        .select('*')
        .eq('flock_id', flockId)
        .eq('date', dateStr)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading data for date:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error loading data for date:', error);
      return null;
    }
  };

  const saveTodaysData = async () => {
    try {
      const date = currentEditingDate || new Date();
      const dateStr = date.toISOString().split('T')[0];
      
      const dataToSave = {
        flock_id: flockId,
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
        .from('todays_info')
        .select('id')
        .eq('flock_id', flockId)
        .eq('date', dateStr)
        .single();

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('todays_info')
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
          .from('todays_info')
          .insert([dataToSave]);

        if (insertError) {
          console.error('Error inserting today\'s info:', insertError);
          alert('Error saving data. Please try again.');
          return;
        }
      }

      // Add date to submitted dates
      setSubmittedDates(prev => new Set([...prev, dateStr]));
      
      alert('Data saved successfully!');
      setIsTodaysInfoOpen(false);
    } catch (error) {
      console.error('Unexpected error saving today\'s info:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const saveTestingThursdaysData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const dataToSave = {
        flock_id: flockId,
        farm_name: farmInfo.farmName,
        date: today,
        ammonia_levels_ppm: testingThursdaysData.ammoniaLevelsPpm,
        drinkers_flow_rate_ml_min: testingThursdaysData.drinkersFlowRateMlMin,
        litter_moisture: testingThursdaysData.litterMoisture,
        light_intensity_lx: testingThursdaysData.lightIntensityLx,
        created_by: user?.name || 'farmer',
        updated_by: user?.name || 'farmer'
      };

      // Check if data already exists for today
      const { data: existingData } = await supabase
        .from('testing_thursdays')
        .select('id')
        .eq('flock_id', flockId)
        .eq('date', today)
        .single();

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('testing_thursdays')
          .update(dataToSave)
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating testing thursdays data:', updateError);
          alert('Error updating data. Please try again.');
          return;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('testing_thursdays')
          .insert([dataToSave]);

        if (insertError) {
          console.error('Error inserting testing thursdays data:', insertError);
          alert('Error saving data. Please try again.');
          return;
        }
      }

      setTestingThursdaysSubmitted(true);
      alert('Testing Thursdays data saved successfully!');
      setIsTestingThursdaysOpen(false);
    } catch (error) {
      console.error('Unexpected error saving testing thursdays data:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleTodaysDataChange = (field: string, value: any) => {
    setTodaysData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestingThursdaysDataChange = (field: string, value: any) => {
    setTestingThursdaysData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleWeekExpansion = (week: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(week)) {
        newSet.delete(week);
      } else {
        newSet.add(week);
      }
      return newSet;
    });
  };

  const getWeekDates = (week: number) => {
    const startDate = flockStartDate || new Date();
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week - 1) * 7);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push({
        fullDate: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNameShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear()
      });
    }
    return dates;
  };

  const isDateEnabled = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date <= today;
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{farmInfo.farmName}</h1>
              <p className="text-gray-600 mt-1">{farmInfo.farmAddress}</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Farm Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Farm Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Contact Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Contact Person:</span> {farmInfo.contactPerson}</p>
                <p><span className="font-medium">Contact Number:</span> {farmInfo.contactNumber}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Operational Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Operational Scope:</span> {farmInfo.operationalScope}</p>
                <p><span className="font-medium">Title:</span> {farmInfo.title}</p>
                <p><span className="font-medium">DCN:</span> {farmInfo.dcn}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Today's Info Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={() => {
                setCurrentEditingDate(new Date());
                setIsTodaysInfoOpen(true);
                setTodaysData({ culls: 0, runts: 0, deaths: 0, feedType: 'Starter', feedUsed: 0 });
              }}
              className="w-full px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold"
            >
              Today's Info
            </button>
          </div>

          {/* Testing Thursdays Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={() => setIsTestingThursdaysOpen(true)}
              className={`w-full px-6 py-4 rounded-lg transition-all duration-200 text-lg font-semibold ${
                testingThursdaysSubmitted
                  ? 'text-gray-800 shadow-md hover:shadow-lg hover:scale-105'
                  : 'text-white'
              }`}
              style={testingThursdaysSubmitted ? { backgroundColor: '#fffae5' } : { backgroundColor: '#ff8c42' }}
              onMouseEnter={testingThursdaysSubmitted ? (e) => {
                e.target.style.backgroundColor = '#f5f0d8';
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
              } : (e) => e.target.style.backgroundColor = '#e67a35'}
              onMouseLeave={testingThursdaysSubmitted ? (e) => {
                e.target.style.backgroundColor = '#fffae5';
                e.target.style.transform = 'translateY(0) scale(1)';
              } : (e) => e.target.style.backgroundColor = '#ff8c42'}
            >
              Testing Thursdays{testingThursdaysSubmitted && ' (Submitted)'}
            </button>
          </div>
        </div>

        {/* Today's Info Popup Modal */}
        {isTodaysInfoOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentEditingDate ? (() => {
                    const date = currentEditingDate;
                    const today = new Date();
                    const isToday = date.toDateString() === today.toDateString();
                    
                    if (isToday) {
                      return `Today's Info - ${date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`;
                    } else {
                      // Calculate week and day for past dates
                      const startDate = flockStartDate || new Date();
                      const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      const weekNumber = Math.floor(daysDiff / 7) + 1;
                      const dayInWeek = (daysDiff % 7) + 1;
                      
                      return `Wk ${weekNumber} Day ${dayInWeek} ${date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`;
                    }
                  })() : `Today's Info - ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`}
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

        {/* Testing Thursdays Popup Modal */}
        {isTestingThursdaysOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Testing Thursdays - {farmInfo.farmName}</h3>
                <button
                  onClick={() => setIsTestingThursdaysOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Ammonia Levels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ammonia Levels (ppm):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={testingThursdaysData.ammoniaLevelsPpm}
                    onChange={(e) => handleTestingThursdaysDataChange('ammoniaLevelsPpm', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter ammonia levels"
                  />
                </div>

                {/* Drinkers Flow Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Drinkers Flow Rate (ml/min):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={testingThursdaysData.drinkersFlowRateMlMin}
                    onChange={(e) => handleTestingThursdaysDataChange('drinkersFlowRateMlMin', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter drinkers flow rate"
                  />
                </div>

                {/* Litter Moisture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Litter Moisture:</label>
                  <div className="space-y-2">
                    {['Dry', 'Moist', 'Wet'].map((moisture) => (
                      <label key={moisture} className="flex items-center">
                        <input
                          type="radio"
                          name="litterMoisture"
                          value={moisture}
                          checked={testingThursdaysData.litterMoisture === moisture}
                          onChange={(e) => handleTestingThursdaysDataChange('litterMoisture', e.target.value)}
                          className="mr-2 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{moisture}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Light Intensity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Light Intensity (lx):</label>
                  <input
                    type="number"
                    min="0"
                    value={testingThursdaysData.lightIntensityLx}
                    onChange={(e) => handleTestingThursdaysDataChange('lightIntensityLx', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                    placeholder="Enter light intensity"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={saveTestingThursdaysData}
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

export default PenDetail;