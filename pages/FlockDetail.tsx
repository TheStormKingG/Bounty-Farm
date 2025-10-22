import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

interface FarmInfo {
  farmName: string;
  farmAddress: string;
  contactPerson: string;
  contactNumber: string;
  // Operational Scope
  operationalScope: string;
  title: string;
  dcn: string;
  growOutNumber?: number;
  totalChickensStarted?: number;
  // Feed Usage
  starterUsedDelivered: string;
  growerUsedDelivered: string;
  finisherUsedDelivered: string;
  // Batch Details
  creationDate: string;
  breed: string;
  batchNumber: string;
  dateStarted: string;
  dateCompleted: string;
  remainingOnFarm?: number;
  totalSlaughterWeight?: number;
  onFarmAvgWeight?: number;
  estimatedProcessedWeight?: number;
  flockAge?: number;
  // Approval & Revision
  approvalDate: string;
  versionNumber?: number;
  currentRevisionDate: string;
  scheduledRevisionDate: string;
  // Performance Metrics
  avgSlaughterWeight?: number;
  slaughterAge?: number;
  dailyGain?: number;
  viability?: number;
  fcrToDate?: number;
  fcrAtSlaughter?: number;
  fcrAt1500g?: number;
  pef?: number;
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
          
          {/* Farm Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 text-2xl font-bold">BF</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{farmInfo.title}</h2>
                  <p className="text-sm text-gray-600">BOUNTY FARM LTD - SUPERIOR QUALITY CHICKEN</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">FARM/REARER: {farmInfo.farmName}</p>
                <p className="text-sm text-gray-600">DCN: {farmInfo.dcn}</p>
              </div>
            </div>

            {/* Operational Scope */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Operational Scope</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-blue-700 font-medium">OPERATIONAL SCOPE:</span>
                  <p className="text-blue-800 font-semibold">{farmInfo.operationalScope}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">GROW-OUT #:</span>
                  <p className="text-blue-800 font-semibold">{farmInfo.growOutNumber || '0'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">TOTAL CHICKENS STARTED:</span>
                  <p className="text-blue-800 font-semibold">{farmInfo.totalChickensStarted?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>

            {/* Feed Usage */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Feed Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-green-700 font-medium">STARTER USED/DELIVERED:</span>
                  <p className="text-green-800 font-semibold">{farmInfo.starterUsedDelivered}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">GROWER USED/DELIVERED:</span>
                  <p className="text-green-800 font-semibold">{farmInfo.growerUsedDelivered}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">FINISHER USED/DELIVERED:</span>
                  <p className="text-green-800 font-semibold">{farmInfo.finisherUsedDelivered}</p>
                </div>
              </div>
            </div>

            {/* Batch Details */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Batch Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-yellow-700 font-medium">CREATION DATE:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.creationDate}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">BREED:</span>
                  <p className="text-blue-600 font-semibold">{farmInfo.breed}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">BATCH #:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.batchNumber}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">DATE STARTED:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.dateStarted}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">DATE COMPLETED:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.dateCompleted}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">REMAINING ON FARM:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.remainingOnFarm?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">TOTAL SLAUGHTER WEIGHT:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.totalSlaughterWeight?.toLocaleString() || '0'}g</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">ON FARM AVG WEIGHT:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.onFarmAvgWeight || '0'}g</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">ESTIMATED PROCESSED WEIGHT:</span>
                  <p className="text-yellow-800 font-semibold">{farmInfo.estimatedProcessedWeight?.toLocaleString() || '0'}g</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">FLOCK AGE:</span>
                  <p className="text-yellow-800 font-bold text-lg">{farmInfo.flockAge || '0'} days</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-purple-700 font-medium">↓AVG SLAUGHTER WEIGHT (g)↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.avgSlaughterWeight || '0'}g</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓SLAUGHTER AGE (d)↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.slaughterAge || '0'} days</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓DAILY GAIN (g)↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.dailyGain?.toFixed(4) || '0.0000'}g</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓VIABILITY (%)↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.viability || '0'}%</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓FCR TO-DATE↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.fcrToDate?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓FCR AT SLAUGHTER↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.fcrAtSlaughter?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓FCR AT 1500g↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.fcrAt1500g?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">↓PEF↓:</span>
                  <p className="text-purple-800 font-semibold">{farmInfo.pef?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Approval & Revision */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Approval & Revision</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-700 font-medium">APPROVAL DATE:</span>
                  <p className="text-gray-800 font-semibold">{farmInfo.approvalDate || 'Pending'}</p>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">VERSION NUMBER:</span>
                  <p className="text-gray-800 font-semibold">{farmInfo.versionNumber || '0'}</p>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">CURRENT REVISION DATE:</span>
                  <p className="text-gray-800 font-semibold">{farmInfo.currentRevisionDate || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">SCHEDULED REVISION DATE:</span>
                  <p className="text-gray-800 font-semibold">{farmInfo.scheduledRevisionDate}</p>
                </div>
              </div>
            </div>

            {/* Basic Farm Contact Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Farm Contact Information</h3>
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
