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

  // Modal state for delivery receipt
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [currentDispatch, setCurrentDispatch] = useState<Dispatch | null>(null);
  const [dispatchInvoiceData, setDispatchInvoiceData] = useState<any>(null);

  // Fetch dispatches from database
  const fetchDispatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to fetch dispatches from Supabase...');
      
      const { data, error } = await supabase
        .from('dispatches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dispatches:', error);
        console.error('Error details:', error.message, error.code, error.details);
        setError('Failed to fetch dispatches: ' + error.message);
        return;
      }

      console.log('Fetched dispatches:', data); // Debug log
      console.log('Number of dispatches found:', data?.length || 0);
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
      console.log('Dispatch component received refreshDispatches event');
      console.log('Refreshing dispatches due to invoice payment status change');
      fetchDispatches();
    };

    console.log('Dispatch component setting up event listener for refreshDispatches');
    window.addEventListener('refreshDispatches', handleRefreshDispatches);
    
    return () => {
      console.log('Dispatch component removing event listener');
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

  // Toggle dispatch type between Delivery and Pick Up
  const handleTypeToggle = async (dispatchId: string, currentType: string) => {
    try {
      const newType = currentType === 'Delivery' ? 'Pick Up' : 'Delivery';
      
      const { error } = await supabase
        .from('dispatches')
        .update({ 
          type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId);

      if (error) {
        console.error('Error updating dispatch type:', error);
        setError('Failed to update dispatch type: ' + error.message);
      } else {
        // Update local state
        setDispatches(prev => 
          prev.map(dispatch => 
            dispatch.id === dispatchId 
              ? { ...dispatch, type: newType }
              : dispatch
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Handle viewing delivery receipt
  const handleViewReceipt = async (dispatch: Dispatch) => {
    try {
      setCurrentDispatch(dispatch);
      
      // Fetch invoice data for this dispatch
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', dispatch.invoice_id)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice data:', invoiceError);
        setError('Failed to fetch invoice data: ' + invoiceError.message);
      } else {
        setDispatchInvoiceData(invoiceData);
        setIsReceiptModalVisible(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
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
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Dispatch</h1>
            <button 
              onClick={fetchDispatches}
              className="px-4 py-2 bg-[#5c3a6b] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Refresh Dispatches
            </button>
          </div>
          
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
                      'DISPATCH NUMBER', 'DATE', 'TYPE', 'TRUCKS', 'RECEIPT'
                    ].map((header, index) => {
                      const columnMap: { [key: string]: string } = {
                        'DISPATCH NUMBER': 'dispatch_number',
                        'DATE': 'date_dispatched',
                        'TYPE': 'type',
                        'TRUCKS': 'trucks',
                        'RECEIPT': 'receipt'
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
                        <button
                          onClick={() => handleTypeToggle(dispatch.id, dispatch.type || 'Delivery')}
                          className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                            dispatch.type === 'Delivery' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {dispatch.type || 'Delivery'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">{dispatch.trucks || 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleViewReceipt(dispatch)}
                          className="text-[#5c3a6b] hover:text-[#4a2c5a] underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
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

      {/* Delivery Receipt Modal */}
      {isReceiptModalVisible && currentDispatch && dispatchInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Delivery Receipt - {currentDispatch.dispatch_number}</h3>
              <button 
                onClick={() => setIsReceiptModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            
            {/* Delivery Receipt Content */}
            <div className="p-6">
              {/* Receipt Header */}
              <div className="flex justify-between items-start mb-8">
                {/* Company Info */}
                <div className="flex items-start space-x-4">
                  {/* Company Logo */}
                  <div className="w-20 h-20">
                    <img 
                      src="/images/BPF-Stefan-8.png" 
                      alt="Bounty Farm Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black uppercase">BOUNTY FARM LIMITED</h1>
                    <p className="text-sm text-gray-600">14 BARIMA AVENUE, BEL AIR PARK, GUYANA Georgetown</p>
                    <p className="text-sm text-gray-600">Tel No. 225-9311-4 | Fax No.2271032</p>
                    <p className="text-sm text-gray-600">office@bountyfarmgy.com</p>
                  </div>
                </div>
                
                {/* Receipt Details */}
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-black uppercase mb-4">DELIVERY RECEIPT</h2>
                  <div className="border border-black p-3">
                    <p className="text-sm font-bold">Tin #010067340</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <p className="font-semibold">Date</p>
                        <p>{new Date(currentDispatch.date_dispatched).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Dispatch #</p>
                        <p>{currentDispatch.dispatch_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Delivery Information:</h3>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Dispatch Type</p>
                      <p className="text-lg">{currentDispatch.type || 'Delivery'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Number of Trucks</p>
                      <p className="text-lg">{currentDispatch.trucks || 1}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Trip Details:</h3>
                <table className="w-full border border-black">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left">Trip ID</th>
                      <th className="border border-black p-2 text-left">Truck Number</th>
                      <th className="border border-black p-2 text-left">Driver</th>
                      <th className="border border-black p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: currentDispatch.trucks || 1 }, (_, index) => (
                      <tr key={index}>
                        <td className="border border-black p-2">TRIP-{currentDispatch.dispatch_number}-{String(index + 1).padStart(2, '0')}</td>
                        <td className="border border-black p-2">TRUCK-{String(index + 1).padStart(2, '0')}</td>
                        <td className="border border-black p-2">Driver {index + 1}</td>
                        <td className="border border-black p-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Related Invoice:</h3>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Invoice Number</p>
                      <p>{dispatchInvoiceData.invoice_number}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Customer</p>
                      <p>{dispatchInvoiceData.customer}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Quantity</p>
                      <p>{dispatchInvoiceData.qty?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Hatch Date</p>
                      <p>{dispatchInvoiceData.hatch_date ? new Date(dispatchInvoiceData.hatch_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm mb-4">Delivery completed successfully. All chicks delivered in good condition.</p>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-semibold">Dispatched by:</span> {currentDispatch.created_by || 'admin'}</p>
                    <p className="text-sm"><span className="font-semibold">Dispatch Date:</span> {new Date(currentDispatch.date_dispatched).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Company Slogan */}
              <div className="text-center mt-8">
                <p className="text-lg font-bold text-gray-700">BOUNTY FARM... THINK QUALITY, BUY BOUNTY!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispatch;
