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

  // Calculate dates for a given week
  const getWeekDates = (week: number) => {
    // Assuming flock started on a specific date - for now using current date as reference
    // In a real implementation, this would be based on the actual flock start date
    const startDate = new Date(); // This should be the actual flock start date
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week - 1) * 7);
    
    const dates = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push({
        dayName: dayNames[i],
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
          <button className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
            Today's Info: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </button>
        </div>

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
                      {getWeekDates(week).map((date, index) => (
                        <button
                          key={index}
                          disabled
                          className="bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                          title={`${date.dayName}-${date.dayNumber} - No data entered`}
                        >
                          {date.dayName}-{date.dayNumber}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      Buttons will be enabled when data is entered for each day
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlockDetail;
