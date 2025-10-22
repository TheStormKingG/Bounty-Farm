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
  const [currentEditingDate, setCurrentEditingDate] = useState<Date | null>(null);
  const [flockStartDate, setFlockStartDate] = useState<Date | null>(null);
  const [submittedDates, setSubmittedDates] = useState<Set<string>>(new Set());
  const [todaysDataSubmitted, setTodaysDataSubmitted] = useState(false);
  const [mondayMeasuresSubmitted, setMondayMeasuresSubmitted] = useState(false);
  const [isMondayMeasuresOpen, setIsMondayMeasuresOpen] = useState(false);
  const [expandedBirds, setExpandedBirds] = useState<Set<string>>(new Set());
  const [mondayMeasuresData, setMondayMeasuresData] = useState({
    bird1: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
    bird2: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
    bird3: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
    bird4: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
    bird5: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' }
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

  // Check if today is Monday (TEMPORARILY ALWAYS TRUE FOR TESTING)
  const isTodayMonday = () => {
    // TODO: Revert this to only show on Mondays
    return true; // Temporarily always true for testing
    // const today = new Date();
    // return today.getDay() === 1; // 1 = Monday
  };

  // Check if a date button should be enabled
  const isDateEnabled = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Enable if data has been submitted for this date OR if the date has passed (including today)
    const hasData = submittedDates.has(dateString);
    const isPastOrToday = dateString <= today;
    
    if (hasData || isPastOrToday) {
      console.log(`Date ${dateString} is enabled - hasData: ${hasData}, isPastOrToday: ${isPastOrToday}`);
      return true;
    }
    
    console.log(`Date ${dateString} is disabled (future date with no data)`);
    return false;
  };

  // Handle Today's Info data changes
  const handleTodaysDataChange = (field: string, value: any) => {
    setTodaysData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generate week_day_id for a specific date
  const generateWeekDayId = (date: Date) => {
    if (!flockStartDate) {
      console.error('Flock start date not available');
      return `W1D1${date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}${date.getDate().toString().padStart(2, '0')}${date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}`;
    }
    
    // Calculate the difference in days from flock start date
    const startDate = new Date(flockStartDate);
    const targetDate = new Date(date);
    
    // Set both dates to start of day to avoid time zone issues
    startDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week number (1-based)
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    
    // Calculate day number within the week (1-based)
    // Day 1 = flock start date, Day 2 = next day, etc.
    const dayInWeek = daysDiff + 1;
    
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNumber = targetDate.getDate();
    const dayName = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][dayOfWeek];
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    const weekDayId = `W${weekNumber}D${dayInWeek}${dayName}${dayNumber.toString().padStart(2, '0')}${monthName}`;
    
    console.log(`Generated week_day_id: ${weekDayId} for date: ${targetDate.toISOString().split('T')[0]}, daysDiff: ${daysDiff}, weekNumber: ${weekNumber}, dayInWeek: ${dayInWeek}`);
    
    return weekDayId;
  };

  // Load existing data for a specific date
  const loadDataForDate = async (date: Date) => {
    try {
      const weekDayId = generateWeekDayId(date);
      const dateString = date.toISOString().split('T')[0];
      console.log('Loading data for date:', dateString, 'week_day_id:', weekDayId);
      
      // Try to query by week_day_id first
      let { data: existingData, error } = await supabase
        .from('daily_flock_data')
        .select('*')
        .eq('flock_id', flockId)
        .eq('week_day_id', weekDayId)
        .single();

      // If week_day_id column doesn't exist, fallback to date query
      if (error && ((error as any).status === 406 || error.message?.includes('column') || error.message?.includes('week_day_id'))) {
        console.log('week_day_id column issue, falling back to date query. Error:', error);
        const fallbackResult = await supabase
          .from('daily_flock_data')
          .select('*')
          .eq('flock_id', flockId)
          .eq('date', dateString)
          .single();
        
        existingData = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading data for date:', error);
        return null;
      }

      if (existingData) {
        console.log('Loaded existing data for', dateString, ':', existingData);
        return {
          culls: existingData.culls || 0,
          runts: existingData.runts || 0,
          deaths: existingData.deaths || 0,
          feedType: existingData.feed_type || 'Starter',
          feedUsed: existingData.feed_used || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading data for date:', error);
      return null;
    }
  };

  // Load existing Today's Info data when opening popup
  const loadTodaysData = async () => {
    if (!todaysDataSubmitted) return; // Only load if data was submitted
    
    try {
      const today = new Date();
      const existingData = await loadDataForDate(today);
      
      if (existingData) {
        setTodaysData(existingData);
        console.log('Loaded existing Today\'s Info data:', existingData);
      }
    } catch (error) {
      console.error('Error loading Today\'s Info data:', error);
    }
  };

  // Save Monday Measures data to database
  const saveMondayMeasuresData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check for existing data
      const { data: existingData, error: checkError } = await supabase
        .from('monday_measures')
        .select('id')
        .eq('flock_id', flockId)
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing Monday Measures data:', checkError);
        alert('Error checking existing data. Please try again.');
        return;
      }

      const dataToSave = {
        flock_id: flockId,
        farm_name: farmInfo.farmName,
        date: today,
        bird1_weight: mondayMeasuresData.bird1.weight,
        bird1_gait_score: mondayMeasuresData.bird1.gaitScore,
        bird1_dust_bathing: mondayMeasuresData.bird1.dustBathing,
        bird1_panting: mondayMeasuresData.bird1.panting,
        bird2_weight: mondayMeasuresData.bird2.weight,
        bird2_gait_score: mondayMeasuresData.bird2.gaitScore,
        bird2_dust_bathing: mondayMeasuresData.bird2.dustBathing,
        bird2_panting: mondayMeasuresData.bird2.panting,
        bird3_weight: mondayMeasuresData.bird3.weight,
        bird3_gait_score: mondayMeasuresData.bird3.gaitScore,
        bird3_dust_bathing: mondayMeasuresData.bird3.dustBathing,
        bird3_panting: mondayMeasuresData.bird3.panting,
        bird4_weight: mondayMeasuresData.bird4.weight,
        bird4_gait_score: mondayMeasuresData.bird4.gaitScore,
        bird4_dust_bathing: mondayMeasuresData.bird4.dustBathing,
        bird4_panting: mondayMeasuresData.bird4.panting,
        bird5_weight: mondayMeasuresData.bird5.weight,
        bird5_gait_score: mondayMeasuresData.bird5.gaitScore,
        bird5_dust_bathing: mondayMeasuresData.bird5.dustBathing,
        bird5_panting: mondayMeasuresData.bird5.panting
      };

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('monday_measures')
          .update(dataToSave)
          .eq('id', existingData.id);
        
        if (error) {
          console.error('Error updating Monday Measures data:', error);
          alert('Error updating data. Please try again.');
          return;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('monday_measures')
          .insert(dataToSave);
        
        if (error) {
          console.error('Error inserting Monday Measures data:', error);
          console.error('Error details:', error.message, error.code, error.details);
          alert('Error saving data. Please try again.');
          return;
        }
      }

      console.log('Successfully saved Monday Measures data:', dataToSave);
      alert('Monday Measures data saved successfully!');
      setIsMondayMeasuresOpen(false);
      
      // Mark Monday Measures as submitted
      setMondayMeasuresSubmitted(true);
      console.log('Monday Measures marked as submitted');
      
      // Reset form data
      setMondayMeasuresData({
        bird1: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
        bird2: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
        bird3: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
        bird4: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' },
        bird5: { weight: 0, gaitScore: 0, dustBathing: 'yes', panting: 'no' }
      });
      
    } catch (error) {
      console.error('Unexpected error saving Monday Measures data:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Save today's data to Supabase
  const saveTodaysData = async () => {
    const dateToSave = currentEditingDate || new Date();
    await saveDataForDate(dateToSave);
  };

  // Save data for a specific date
  const saveDataForDate = async (date: Date) => {
    try {
      const weekDayId = generateWeekDayId(date);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log('Saving data with week_day_id:', weekDayId, 'for date:', dateString);
      console.log('Looking for existing record with week_day_id:', weekDayId);
      
      // Check if data already exists for this specific week_day_id
      // Only use week_day_id for checking existing data to avoid conflicts
      let { data: existingData, error: checkError } = await supabase
        .from('daily_flock_data')
        .select('id')
        .eq('flock_id', flockId)
        .eq('week_day_id', weekDayId)
        .single();

      // If week_day_id column doesn't exist, fallback to date query
      if (checkError && ((checkError as any).status === 406 || checkError.message?.includes('column') || checkError.message?.includes('week_day_id'))) {
        console.log('week_day_id column issue, falling back to date query for existing data check. Error:', checkError);
        const fallbackResult = await supabase
          .from('daily_flock_data')
          .select('id')
          .eq('flock_id', flockId)
          .eq('date', dateString)
          .single();
        
        existingData = fallbackResult.data;
        checkError = fallbackResult.error;
      }

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing data:', checkError);
        alert('Error checking existing data. Please try again.');
        return;
      }

      console.log('Existing data check result:', existingData ? 'Found existing record' : 'No existing record found');

      const dataToSave = {
        flock_id: flockId,
        farm_name: farmInfo.farmName,
        date: dateString,
        week_day_id: weekDayId,
        culls: todaysData.culls,
        runts: todaysData.runts,
        deaths: todaysData.deaths,
        feed_type: todaysData.feedType,
        feed_used: todaysData.feedUsed,
        created_by: 'farmer',
        updated_by: 'farmer'
      };

      // Include week_day_id in the data to save
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

      console.log('Successfully saved data:', dataToSave);
      alert('Data saved successfully!');
      setIsTodaysInfoOpen(false);
      
      // Add date to submitted dates
      setSubmittedDates(prev => {
        const newSet = new Set([...prev, dateString]);
        console.log('Updated submittedDates:', Array.from(newSet));
        return newSet;
      });
      
      // If it's today's data, mark today's data as submitted
      const today = new Date().toISOString().split('T')[0];
      if (dateString === today) {
        setTodaysDataSubmitted(true);
        console.log('Today\'s data marked as submitted');
      }
      
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
    const dayNamesShort = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']; // 2-letter abbreviations for mobile
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      // Get the actual day of the week for this date
      const actualDayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = dayNames[actualDayOfWeek];
      const dayNameShort = dayNamesShort[actualDayOfWeek];
      
      dates.push({
        dayName: dayName, // Full weekday name
        dayNameShort: dayNameShort, // 2-letter abbreviation for mobile
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
        console.log('Loading submitted dates for flock:', flockId);
        const { data: existingData, error } = await supabase
          .from('daily_flock_data')
          .select('*')
          .eq('flock_id', flockId);

        if (error) {
          console.error('Error fetching submitted dates:', error);
          return;
        }

        console.log('Raw data from database:', existingData);
        console.log('All records for this flock:', existingData);

        if (existingData && existingData.length > 0) {
          const dates = existingData.map(record => {
            console.log('Record date:', record.date, 'Type:', typeof record.date);
            return record.date;
          });
          setSubmittedDates(new Set(dates));
          console.log('Loaded submitted dates:', dates);
          console.log('Submitted dates Set:', Array.from(new Set(dates)));
          
          // Check if today's data has been submitted
          const today = new Date().toISOString().split('T')[0];
          console.log('Today\'s date:', today);
          if (dates.includes(today)) {
            setTodaysDataSubmitted(true);
            console.log('Today\'s data already submitted');
          }
        } else {
          console.log('No existing data found for flock:', flockId);
        }
      } catch (error) {
        console.error('Error loading submitted dates:', error);
      }
    };

    loadSubmittedDates();
  }, [flockId]);

  // Load existing Monday Measures data from database
  useEffect(() => {
    const loadMondayMeasuresStatus = async () => {
      if (!flockId) return;
      
      try {
        console.log('Loading Monday Measures status for flock:', flockId);
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existingData, error } = await supabase
          .from('monday_measures')
          .select('id')
          .eq('flock_id', flockId)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching Monday Measures status:', error);
          return;
        }

        if (existingData) {
          setMondayMeasuresSubmitted(true);
          console.log('Monday Measures already submitted for today');
        } else {
          console.log('No Monday Measures data found for today');
        }
      } catch (error) {
        console.error('Error loading Monday Measures status:', error);
      }
    };

    loadMondayMeasuresStatus();
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
            onClick={() => {
              setCurrentEditingDate(new Date()); // Set to today's date
              setIsTodaysInfoOpen(true);
              loadTodaysData(); // Load existing data if submitted
            }}
            className={`w-full px-6 py-4 rounded-lg transition-all duration-200 text-lg font-semibold ${
              todaysDataSubmitted
                ? 'text-gray-800 shadow-md hover:shadow-lg hover:scale-105'
                : 'text-white'
            }`}
            style={todaysDataSubmitted ? { backgroundColor: '#fffae5' } : { backgroundColor: '#ff8c42' }}
            onMouseEnter={todaysDataSubmitted ? (e) => {
              e.target.style.backgroundColor = '#f5f0d8';
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
            } : (e) => e.target.style.backgroundColor = '#e67a35'}
            onMouseLeave={todaysDataSubmitted ? (e) => {
              e.target.style.backgroundColor = '#fffae5';
              e.target.style.transform = 'translateY(0) scale(1)';
            } : (e) => e.target.style.backgroundColor = '#ff8c42'}
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
              className={`w-full px-6 py-4 rounded-lg transition-all duration-200 text-lg font-semibold ${
                mondayMeasuresSubmitted
                  ? 'text-gray-800 shadow-md hover:shadow-lg hover:scale-105'
                  : 'text-white'
              }`}
              style={mondayMeasuresSubmitted ? { backgroundColor: '#fffae5' } : { backgroundColor: '#ff8c42' }}
              onMouseEnter={mondayMeasuresSubmitted ? (e) => {
                e.target.style.backgroundColor = '#f5f0d8';
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
              } : (e) => e.target.style.backgroundColor = '#e67a35'}
              onMouseLeave={mondayMeasuresSubmitted ? (e) => {
                e.target.style.backgroundColor = '#fffae5';
                e.target.style.transform = 'translateY(0) scale(1)';
              } : (e) => e.target.style.backgroundColor = '#ff8c42'}
            >
              Monday Measures{mondayMeasuresSubmitted && ' (Submitted)'}
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
                  className="w-full text-white px-4 py-3 rounded-lg transition-colors flex justify-between items-center"
                  style={{ backgroundColor: '#ff8c42' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
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
                        
                        console.log(`Button ${date.dayName}-${date.dayNumber}: isEnabled=${isEnabled}, hasData=${hasData}`);
                        console.log(`Date string: ${date.fullDate.toISOString().split('T')[0]}`);
                        console.log(`Submitted dates:`, Array.from(submittedDates));
                        console.log(`Today's date: ${new Date().toISOString().split('T')[0]}`);
                        
                        return (
                          <button
                            key={index}
                            disabled={!isEnabled}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                            onClick={async () => {
                              if (isEnabled) {
                                // Set the current editing date
                                setCurrentEditingDate(date.fullDate);
                                // Open Today's Info popup for this specific date
                                setIsTodaysInfoOpen(true);
                                // Load existing data for this specific date
                                const existingData = await loadDataForDate(date.fullDate);
                                if (existingData) {
                                  setTodaysData(existingData);
                                } else {
                                  // Reset to default values for new entry
                                  setTodaysData({ culls: 0, runts: 0, deaths: 0, feedType: 'Starter', feedUsed: 0 });
                                }
                              }
                            }}
                          >
                            {/* Show short day names on mobile, full names on desktop */}
                            <span className="block sm:hidden">{date.dayNameShort}-{date.dayNumber}</span>
                            <span className="hidden sm:block">{date.dayName}-{date.dayNumber}</span>
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
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Culls</span>
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
                        onFocus={(e) => e.target.select()}
                      />
                </div>
                  )}
                </div>

                {/* Runts */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('runts')}
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Runts</span>
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
                        onFocus={(e) => e.target.select()}
                      />
              </div>
                  )}
            </div>

                {/* Deaths */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('deaths')}
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Deaths</span>
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
                        onFocus={(e) => e.target.select()}
                      />
                </div>
                  )}
                </div>

                {/* Feed Used */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItemExpansion('feedUsed')}
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Feed Used</span>
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
                          step="1"
                          onFocus={(e) => e.target.select()}
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
                      className="px-4 py-2 text-white rounded-lg transition-colors"
                      style={{ backgroundColor: '#ff8c42' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
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
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Bird 1: From corner 1</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg):</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird1.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird1', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                          style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                          placeholder="Enter weight"
                          min="0"
                          step="1"
                          onFocus={(e) => e.target.select()}
                        />
                </div>
                      
                      {/* Gait Score */}
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          onFocus={(e) => e.target.select()}
                          value={mondayMeasuresData.bird1.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird1', 'gaitScore', parseInt(e.target.value))}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Bird 2: From corner 2</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg):</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird2.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird2', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                          style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                          placeholder="Enter weight"
                          min="0"
                          step="1"
                          onFocus={(e) => e.target.select()}
                        />
                </div>
                      
                      {/* Gait Score */}
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          onFocus={(e) => e.target.select()}
                          value={mondayMeasuresData.bird2.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird2', 'gaitScore', parseInt(e.target.value))}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Bird 3: From corner 3</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg):</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird3.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird3', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                          style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                          placeholder="Enter weight"
                          min="0"
                          step="1"
                          onFocus={(e) => e.target.select()}
                        />
                </div>
                      
                      {/* Gait Score */}
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          onFocus={(e) => e.target.select()}
                          value={mondayMeasuresData.bird3.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird3', 'gaitScore', parseInt(e.target.value))}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Bird 4: From corner 4</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg):</label>
                        <input
                          type="number"
                          value={mondayMeasuresData.bird4.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird4', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                          style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                          placeholder="Enter weight"
                          min="0"
                          step="1"
                          onFocus={(e) => e.target.select()}
                        />
          </div>

                      {/* Gait Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          onFocus={(e) => e.target.select()}
                          value={mondayMeasuresData.bird4.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird4', 'gaitScore', parseInt(e.target.value))}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                    className="w-full px-4 py-3 text-left rounded-lg flex justify-between items-center transition-colors"
                    style={{ backgroundColor: '#ff8c42' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
                  >
                    <span className="font-medium text-white">Bird 5: Middle</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg):</label>
                      <input
                        type="number"
                          value={mondayMeasuresData.bird5.weight}
                          onChange={(e) => handleMondayMeasuresChange('bird5', 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-orange-500"
                          style={{ '--tw-ring-color': '#ff8c42' } as React.CSSProperties}
                          placeholder="Enter weight"
                          min="0"
                          step="1"
                          onFocus={(e) => e.target.select()}
                      />
                    </div>
                      
                      {/* Gait Score */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gait Score (0-5):</label>
                      <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          onFocus={(e) => e.target.select()}
                          value={mondayMeasuresData.bird5.gaitScore}
                          onChange={(e) => handleMondayMeasuresChange('bird5', 'gaitScore', parseInt(e.target.value))}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                                className="mr-2 focus:ring-orange-500"
                                style={{ color: '#ff8c42' }}
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
                      onClick={saveMondayMeasuresData}
                      className="px-4 py-2 text-white rounded-lg transition-colors"
                      style={{ backgroundColor: '#ff8c42' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e67a35'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c42'}
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
