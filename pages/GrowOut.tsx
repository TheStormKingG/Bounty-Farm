import React, { useState } from 'react';

const GrowOut: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Grow-Out Management</h1>
          <p className="text-gray-600">Track and manage flock growth and development phases</p>
        </div>

        {/* Week-by-Week Tracking */}
        <div className="bg-white rounded-lg shadow-md">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Daily Data Cards */}
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-3">{day}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Culls:</span>
                              <span className="text-sm font-medium">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Runts:</span>
                              <span className="text-sm font-medium">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Deaths:</span>
                              <span className="text-sm font-medium">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Feed Used:</span>
                              <span className="text-sm font-medium">0 kg</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Week Summary */}
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3">Week {week} Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">0</div>
                          <div className="text-sm text-gray-600">Total Culls</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">0</div>
                          <div className="text-sm text-gray-600">Total Runts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">0</div>
                          <div className="text-sm text-gray-600">Total Deaths</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-sm text-gray-600">Feed Used (kg)</div>
                        </div>
                      </div>
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

export default GrowOut;
