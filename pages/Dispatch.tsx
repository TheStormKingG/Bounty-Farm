import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabase';

interface Dispatch {
  id: string;
  dispatch_number: string;
  invoice_id: string;
  sales_dispatch_id: string;
  date_dispatched: string;
  type: string;
  trucks: number;
  trips: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

const Dispatch: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and search state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch dispatches from database
  const fetchDispatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('dispatches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dispatches:', error);
        setError('Failed to fetch dispatches: ' + error.message);
        return;
      }

      console.log('Fetched dispatches:', data); // Debug log
      setDispatches(data || []);
    } catch (err) {
      console.error('Unexpected error fetching dispatches:', err);
      setError('An unexpected error occurred while fetching dispatches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefreshDispatches = () => {
      console.log('Refreshing dispatches due to invoice payment status change');
      fetchDispatches();
    };

    window.addEventListener('refreshDispatches', handleRefreshDispatches);
    
    return () => {
      window.removeEventListener('refreshDispatches', handleRefreshDispatches);
    };
  }, []);

  // Process and filter dispatches
  const processedDispatches = React.useMemo(() => {
    let filtered = [...dispatches];

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(dispatch => {
        const dispatchDate = new Date(dispatch.date_dispatched);
        return dispatchDate >= start && dispatchDate <= end;
      });
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(dispatch =>
        dispatch.dispatch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.created_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = (a as any)[sortColumn];
        let bValue = (b as any)[sortColumn];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [dispatches, startDate, endDate, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSearch = () => {
    // Search is handled by the processedDispatches useMemo
    // This function can be used for additional search logic if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dispatches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-white flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dispatch</h1>
          
          {/* Filtering Section */}
          <div className="flex items-end gap-2 mb-6 mt-2">
            <div className="w-1/4">
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-1/4">
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <div className="relative flex rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: '#fffae5' }}>
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  onClick={handleSearch}
                  className="px-3 py-2 bg-[#5c3a6b] text-white hover:opacity-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Dispatch Table */}
          <div className="mt-6" style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div 
              className="overflow-auto flex-1" 
              style={{ maxHeight: '360px', overflowX: 'auto', overflowY: 'auto' }}
            >
              <table className="modern-table min-w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="sticky top-0 z-10" style={{
                  backgroundColor: '#ff8c42',
                  borderRadius: '8px 8px 0 0',
                  borderBottom: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <tr>
                    {[
                      'DISPATCH NUMBER', 'DATE', 'TYPE', 'TRUCKS', 'TRIPS'
                    ].map((header, index) => {
                      const columnMap: { [key: string]: string } = {
                        'DISPATCH NUMBER': 'dispatch_number',
                        'DATE': 'date_dispatched',
                        'TYPE': 'type',
                        'TRUCKS': 'trucks',
                        'TRIPS': 'trips'
                      };
                      
                      return (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                          style={{ 
                            width: '200px', 
                            minWidth: '200px',
                            backgroundColor: '#ff8c42',
                            color: 'white',
                            fontWeight: '600',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-xs">{header}</span>
                            <div className="flex items-center space-x-1 ml-2">
                              <button
                                onClick={() => handleSort(columnMap[header])}
                                className="p-1 hover:bg-gray-200 rounded"
                                title={`Sort by ${header}`}
                              >
                                {sortColumn === columnMap[header] ? (
                                  sortDirection === 'asc' ? '↑' : '↓'
                                ) : (
                                  '↕'
                                )}
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {processedDispatches.map((dispatch) => (
                    <tr key={dispatch.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#5C3A6B]">{dispatch.dispatch_number}</td>
                      <td className="px-4 py-3 text-sm">{new Date(dispatch.date_dispatched).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          dispatch.type === 'Delivery' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {dispatch.type || 'Delivery'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{dispatch.trucks || 1}</td>
                      <td className="px-4 py-3 text-sm">{dispatch.trips || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {processedDispatches.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No dispatches found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dispatch;
