import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

interface FarmInfo {
  farmName: string;
  farmAddress: string;
  contactPerson: string;
  contactNumber: string;
}

const FlockDetail: React.FC = () => {
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
  const [flockStartDate, setFlockStartDate] = useState<Date | null>(null);
  const [submittedDates, setSubmittedDates] = useState<Set<string>>(new Set());
  const [todaysDataSubmitted, setTodaysDataSubmitted] = useState(false);
  const [isMondayMeasuresOpen, setIsMondayMeasuresOpen] = useState(false);
  const [expandedBirds, setExpandedBirds] = useState<Set<string>>(new Set());
  const [mondayMeasuresData, setMondayMeasuresData] = useState({
    bird1: { weight: 0, gaitScore: 0, dustBathing: 'no', panting: 'no' },
    bird2: { weight: 0, gaitScore: 0, dustBathing: 'no', panting: 'no' },
    bird3: { weight: 0, gaitScore: 0, dustBathing: 'no', panting: 'no' },
    bird4: { weight: 0, gaitScore: 0, dustBathing: 'no', panting: 'no' },
    bird5: { weight: 0, gaitScore: 0, dustBathing: 'no', panting: 'no' }
  });
  const [todaysData, setTodaysData] = useState({
    culls: 0,
    runts: 0,
    deaths: 0,
    feedType: 'Starter',
    feedUsed: 0
  });

  // Toggle week expansion
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

  // Toggle Today's Info item expansion
  const toggleItemExpansion = (item: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  // Toggle Monday Measures bird expansion
  const toggleBirdExpansion = (bird: string) => {
    setExpandedBirds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bird)) {
        newSet.delete(bird);
      } else {
        newSet.add(bird);
      }
      return newSet;
    });
  };

  // Handle Monday Measures data changes
  const handleMondayMeasuresChange = (bird: string, field: string, value: any) => {
    setMondayMeasuresData(prev => ({
      ...prev,
      [bird]: {
        ...prev[bird],
        [field]: value
      }
    }));
  };

  // Check if today is Monday
  const isTodayMonday = () => {
    const today = new Date();
    return today.getDay() === 1; // 1 = Monday
  };

  // Check if a date button should be enabled
  const isDateEnabled = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Enable if data has been submitted for this date
    if (submittedDates.has(dateString)) {
      return true;
    }
    
    // Enable if the date has passed (including today)
    if (dateString <= today) {
      return true;
    }
    
    return false;
  };

  // Handle Today's Info data changes
  const handleTodaysDataChange = (field: string, value: any) => {
    setTodaysData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save today's data to Supabase
  const saveTodaysData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if data already exists for today
      const { data: existingData, error: checkError } = await supabase
        .from('daily_flock_data')
        .select('id')
        .eq('flock_id', flockId)
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing data:', checkError);
        alert('Error checking existing data. Please try again.');
        return;
      }

      const dataToSave = {
        flock_id: flockId,
        farm_name: farmInfo.farmName,
        date: today,
        culls: todaysData.culls,
        runts: todaysData.runts,
        deaths: todaysData.deaths,
        feed_type: todaysData.feedType,
        feed_used: todaysData.feedUsed,
        created_by: 'farmer',
        updated_by: 'farmer'
      };

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('daily_flock_data')
          .update(dataToSave)
          .eq('id', existingData.id);

        if (error) {
          console.error('Error updating daily flock data:', error);
          alert('Error updating data. Please try again.');
          return;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('daily_flock_data')
          .insert(dataToSave);

        if (error) {
          console.error('Error inserting daily flock data:', error);
          console.error('Error details:', error.message, error.code, error.details);
          alert('Error saving data. Please try again.');
          return;
        }
      }

      console.log('Successfully saved today\'s data:', dataToSave);
      alert('Data saved successfully!');
      setIsTodaysInfoOpen(false);
      
      // Add today's date to submitted dates
      setSubmittedDates(prev => new Set([...prev, today]));
      
      // Mark today's data as submitted
      setTodaysDataSubmitted(true);
      
      // Reset form data
      setTodaysData({
        culls: 0,
        runts: 0,
        deaths: 0,
        feedType: 'Starter',
        feedUsed: 0
      });
      
    } catch (error) {
      console.error('Unexpected error saving data:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Calculate dates for a given week based on flock start date
  const getWeekDates = (week: number) => {
    // Use flock start date if available, otherwise default to current date
    const startDate = flockStartDate || new Date();
    
    // For week 1, start from the actual flock start date
    // For subsequent weeks, calculate from the start date
    let weekStart: Date;
    
    if (week === 1) {
      // Week 1 starts on the actual flock start date
      weekStart = new Date(startDate);
    } else {
      // For weeks 2+, calculate from the start date
      weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (week - 1) * 7);
    }
    
    const dates = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      // Get the actual day of the week for this date
      const actualDayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = dayNames[actualDayOfWeek];
      
      dates.push({
        dayName: dayName,
        dayNumber: date.getDate().toString().padStart(2, '0'),
        fullDate: date,
        monthName: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear()
      });
    }
    
    return dates;
  };

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
    // Set loading to false after farm info is processed
    setLoading(false);
  }, [location.state]);

  // Fetch flock start date from received dispatches
  useEffect(() => {
    const fetchFlockStartDate = async () => {
      if (!farmInfo.farmName) return;
      
      try {
        // Get received dispatches for this farm
        const { data: receivedDispatches } = await supabase
          .from('received_dispatches')
          .select('confirmed_at')
          .eq('farm_name', farmInfo.farmName)
          .order('confirmed_at', { ascending: true })
          .limit(1);

        if (receivedDispatches && receivedDispatches.length > 0) {
          const startDate = new Date(receivedDispatches[0].confirmed_at);
          setFlockStartDate(startDate);
          console.log('Flock start date set to:', startDate);
        }
      } catch (error) {
        console.error('Error fetching flock start date:', error);
      }
    };

    fetchFlockStartDate();
  }, [farmInfo.farmName]);

  // Load existing submitted dates from database
  useEffect(() => {
    const loadSubmittedDates = async () => {
      if (!flockId) return;
      
      try {
        const { data: existingData } = await supabase
          .from('daily_flock_data')
          .select('date')
          .eq('flock_id', flockId);

        if (existingData) {
          const dates = existingData.map(record => record.date);
          setSubmittedDates(new Set(dates));
          console.log('Loaded submitted dates:', dates);
          
          // Check if today's data has been submitted
          const today = new Date().toISOString().split('T')[0];
          if (dates.includes(today)) {
            setTodaysDataSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Error loading submitted dates:', error);
      }
    };

    loadSubmittedDates();
  }, [flockId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm details...</p>
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
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Farm</h2>
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
              onClick={() => navigate(`/farm/${farmId}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              title="Back to Flocks"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">
              {(() => {
                // Extract flock number from flockId (e.g., "flock-0-1" -> "Flock 1")
                const flockNumber = flockId?.split('-').pop() || '1';
                return `Flock ${flockNumber} - ${farmInfo.farmName}`;
              })()}
            </h1>
          </div>
          </div>
          
        {/* Today's Info Button */}
        <div className="bg-white rounded-lg shadow-md mt-6 p-6">
          <button 
            onClick={() => setIsTodaysInfoOpen(true)}
            disabled={todaysDataSubmitted}
            className={`w-full px-6 py-4 rounded-lg transition-colors text-lg font-semibold ${
              todaysDataSubmitted
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Today's Info: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            {todaysDataSubmitted && ' (Submitted)'}
          </button>
        </div>

        {/* Monday Measures Button - Only show on Mondays */}
        {isTodayMonday() && (
          <div className="bg-white rounded-lg shadow-md mt-6 p-6">
            <button
              onClick={() => setIsMondayMeasuresOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg transition-colors text-lg font-semibold"
            >
              Monday Measures
            </button>
          </div>
        )}

        {/* Week-by-Week Tracking */}
        <div className="bg-white rounded-lg shadow-md mt-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Week-by-Week Tracking</h2>
            <p className="text-sm text-gray-600 mt-1">Click on any week to expand and view detailed tracking data</p>
          </div>

          <div className="p-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((week) => (
              <div key={week} className="mb-4">
                {/* Week Header */}
                <button
                  onClick={() => toggleWeekExpansion(week)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-between items-center"
                >
                  <span className="font-semibold">Week {week}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedWeeks.has(week) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Week Content */}
                {expandedWeeks.has(week) && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Week {week} - {getWeekDates(week)[0].monthName} {getWeekDates(week)[0].year}
                      </h3>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {getWeekDates(week).map((date, index) => {
                        const isEnabled = isDateEnabled(date.fullDate);
                        const hasData = submittedDates.has(date.fullDate.toISOString().split('T')[0]);
                        
                        return (
                          <button
                            key={index}
                            disabled={!isEnabled}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isEnabled
                                ? hasData
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={
                              isEnabled
                                ? hasData
                                  ? `${date.dayName}-${date.dayNumber} - Data submitted (click to edit)`
                                  : `${date.dayName}-${date.dayNumber} - Click to submit data`
                                : `${date.dayName}-${date.dayNumber} - No data entered`
                            }
                            onClick={() => {
                              if (isEnabled) {
                                // Open Today's Info popup for this specific date
                                setIsTodaysInfoOpen(true);
                                // TODO: Load existing data for this date if available
                              }
                            }}
                          >
                            {date.dayName}-{date.dayNumber}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      Blue buttons: Submit data | Green buttons: Data submitted (click to edit) | Gray buttons: Future dates
                        </div>
                      </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Info Popup Modal */}
        {isTodaysInfoOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">
                  Today's Info - {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={() => setIsTodaysInfoOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Culls */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('culls')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Culls</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedItems.has('culls') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedItems.has('culls') && (
                    <div className="p-4 border-t border-gray-200">
                      <input
                        type="number"
                        value={todaysData.culls}
                        onChange={(e) => handleTodaysDataChange('culls', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter number of culls"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Runts */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('runts')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Runts</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedItems.has('runts') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedItems.has('runts') && (
                    <div className="p-4 border-t border-gray-200">
                      <input
                        type="number"
                        value={todaysData.runts}
                        onChange={(e) => handleTodaysDataChange('runts', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter number of runts"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Deaths */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('deaths')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Deaths</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedItems.has('deaths') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedItems.has('deaths') && (
                    <div className="p-4 border-t border-gray-200">
                      <input
                        type="number"
                        value={todaysData.deaths}
                        onChange={(e) => handleTodaysDataChange('deaths', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter number of deaths"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Feed Used */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('feedUsed')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Feed Used</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedItems.has('feedUsed') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedItems.has('feedUsed') && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Feed Type Radio Options */}
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
                      
                      {/* Feed Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount Used:</label>
                      <input
                          type="number"
                          value={todaysData.feedUsed}
                          onChange={(e) => handleTodaysDataChange('feedUsed', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter amount of feed used"
                          min="0"
                          step="0.1"
                      />
                    </div>
                    </div>
                  )}
                    </div>

                  </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 p-6 border-t">
                    <button
                  onClick={() => setIsTodaysInfoOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                  onClick={saveTodaysData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                  Save Data
                    </button>
              </div>
            </div>
          </div>
        )}

        {/* Monday Measures Popup Modal */}
        {isMondayMeasuresOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">
                  Monday Measures - {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => setIsMondayMeasuresOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Bird 1: From corner 1 */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleBirdExpansion('bird1')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Bird 1: From corner 1</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedBirds.has('bird1') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedBirds.has('bird1') && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird1.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird1', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter weight"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      
                      {/* Gait Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={mondayMeasuresData.bird1.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird1', 'gaitScore', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span className="font-medium">{mondayMeasuresData.bird1.gaitScore}</span>
                          <span>5</span>
                        </div>
                      </div>
                      
                      {/* Dust Bathing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dust Bathing:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird1-dustBathing"
                                value={option}
                                checked={mondayMeasuresData.bird1.dustBathing === option}
                                onChange={(e) => handleMondayMeasuresChange('bird1', 'dustBathing', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Panting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Panting:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird1-panting"
                                value={option}
                                checked={mondayMeasuresData.bird1.panting === option}
                                onChange={(e) => handleMondayMeasuresChange('bird1', 'panting', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bird 2: From corner 2 */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleBirdExpansion('bird2')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Bird 2: From corner 2</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedBirds.has('bird2') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedBirds.has('bird2') && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird2.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird2', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter weight"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      
                      {/* Gait Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={mondayMeasuresData.bird2.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird2', 'gaitScore', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span className="font-medium">{mondayMeasuresData.bird2.gaitScore}</span>
                          <span>5</span>
                        </div>
                      </div>
                      
                      {/* Dust Bathing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dust Bathing:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird2-dustBathing"
                                value={option}
                                checked={mondayMeasuresData.bird2.dustBathing === option}
                                onChange={(e) => handleMondayMeasuresChange('bird2', 'dustBathing', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Panting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Panting:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird2-panting"
                                value={option}
                                checked={mondayMeasuresData.bird2.panting === option}
                                onChange={(e) => handleMondayMeasuresChange('bird2', 'panting', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bird 3: From corner 3 */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleBirdExpansion('bird3')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Bird 3: From corner 3</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedBirds.has('bird3') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedBirds.has('bird3') && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird3.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird3', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter weight"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      
                      {/* Gait Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={mondayMeasuresData.bird3.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird3', 'gaitScore', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span className="font-medium">{mondayMeasuresData.bird3.gaitScore}</span>
                          <span>5</span>
                        </div>
                      </div>
                      
                      {/* Dust Bathing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dust Bathing:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird3-dustBathing"
                                value={option}
                                checked={mondayMeasuresData.bird3.dustBathing === option}
                                onChange={(e) => handleMondayMeasuresChange('bird3', 'dustBathing', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Panting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Panting:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird3-panting"
                                value={option}
                                checked={mondayMeasuresData.bird3.panting === option}
                                onChange={(e) => handleMondayMeasuresChange('bird3', 'panting', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bird 4: From corner 4 */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleBirdExpansion('bird4')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Bird 4: From corner 4</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedBirds.has('bird4') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedBirds.has('bird4') && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird4.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird4', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter weight"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      
                      {/* Gait Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={mondayMeasuresData.bird4.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird4', 'gaitScore', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span className="font-medium">{mondayMeasuresData.bird4.gaitScore}</span>
                          <span>5</span>
                        </div>
                      </div>
                      
                      {/* Dust Bathing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dust Bathing:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird4-dustBathing"
                                value={option}
                                checked={mondayMeasuresData.bird4.dustBathing === option}
                                onChange={(e) => handleMondayMeasuresChange('bird4', 'dustBathing', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Panting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Panting:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird4-panting"
                                value={option}
                                checked={mondayMeasuresData.bird4.panting === option}
                                onChange={(e) => handleMondayMeasuresChange('bird4', 'panting', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bird 5: Middle */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleBirdExpansion('bird5')}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">Bird 5: Middle</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedBirds.has('bird5') ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedBirds.has('bird5') && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird5.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird5', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter weight"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      
                      {/* Gait Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={mondayMeasuresData.bird5.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird5', 'gaitScore', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span className="font-medium">{mondayMeasuresData.bird5.gaitScore}</span>
                          <span>5</span>
                        </div>
                      </div>
                      
                      {/* Dust Bathing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dust Bathing:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird5-dustBathing"
                                value={option}
                                checked={mondayMeasuresData.bird5.dustBathing === option}
                                onChange={(e) => handleMondayMeasuresChange('bird5', 'dustBathing', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Panting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Panting:</label>
                        <div className="space-y-2">
                          {['yes', 'no'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="bird5-panting"
                                value={option}
                                checked={mondayMeasuresData.bird5.panting === option}
                                onChange={(e) => handleMondayMeasuresChange('bird5', 'panting', e.target.value)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 p-6 border-t">
                <button
                  onClick={() => setIsMondayMeasuresOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Save Monday Measures data
                    alert('Monday Measures data saved successfully!');
                    setIsMondayMeasuresOpen(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Data
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FlockDetail;
