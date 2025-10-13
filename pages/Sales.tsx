import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

// Custom CSS for sticky columns
const stickyColumnStyles = `
  .sticky-column-1 {
    position: sticky !important;
    left: 0px !important;
    background-color: #ff8c42 !important;
    z-index: 10 !important;
  }
  
  .sticky-column-2 {
    position: sticky !important;
    left: 150px !important;
    background-color: #ff8c42 !important;
    z-index: 10 !important;
  }
  
  .sticky-column-3 {
    position: sticky !important;
    left: 300px !important;
    background-color: #ff8c42 !important;
    z-index: 10 !important;
  }
  
  .sticky-header-1 {
    position: sticky !important;
    left: 0px !important;
    background-color: #ff8c42 !important;
    z-index: 20 !important;
  }
  
  .sticky-header-2 {
    position: sticky !important;
    left: 150px !important;
    background-color: #ff8c42 !important;
    z-index: 20 !important;
  }
  
  .sticky-header-3 {
    position: sticky !important;
    left: 300px !important;
    background-color: #ff8c42 !important;
    z-index: 20 !important;
  }
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = stickyColumnStyles;
  document.head.appendChild(styleSheet);
}

interface SalesDispatch {
  id: string;
  poNumber: string;
  dateOrdered: string;
  customer: string;
  qty: number;
  hatchDate: string;
  batchesRequired: number;
  trucksRequired: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

const Sales: React.FC = () => {
  const { user } = useAuth();
  const [salesDispatch, setSalesDispatch] = useState<SalesDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  
  // Filtering and search state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rowCount, setRowCount] = useState('50');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SalesDispatch | null>(null);
  const [newRecordData, setNewRecordData] = useState<Partial<SalesDispatch>>({});

  // Fetch sales dispatch records from database
  useEffect(() => {
    const fetchSalesDispatch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('sales_dispatch')
          .select('*')
          .order('date_ordered', { ascending: false });

        if (error) {
          console.error('Error fetching sales dispatch records:', error);
          setError('Failed to fetch sales dispatch records from database');
          setSalesDispatch([]);
        } else {
          const mappedRecords: SalesDispatch[] = (data || []).map((record: any) => ({
            id: record.id,
            poNumber: record.po_number,
            dateOrdered: record.date_ordered,
            customer: record.customer,
            qty: record.qty,
            hatchDate: record.hatch_date,
            batchesRequired: record.batches_required,
            trucksRequired: record.trucks_required,
            createdBy: record.created_by || 'admin',
            createdAt: record.created_at || new Date().toISOString(),
            updatedBy: record.updated_by || 'admin',
            updatedAt: record.updated_at || new Date().toISOString(),
          }));
          setSalesDispatch(mappedRecords);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Database connection failed');
        setSalesDispatch([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesDispatch();
  }, []);

  // Process and filter sales dispatch records
  const processedRecords = useMemo(() => {
    let filtered = [...salesDispatch];

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.dateOrdered);
        return recordDate >= start && recordDate <= end;
      });
    }

    // Search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.poNumber.toLowerCase().includes(searchLower) ||
        record.customer.toLowerCase().includes(searchLower) ||
        record.createdBy.toLowerCase().includes(searchLower) ||
        record.updatedBy.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof SalesDispatch];
        let bValue: any = b[sortColumn as keyof SalesDispatch];

        // Handle date sorting
        if (sortColumn === 'dateOrdered' || sortColumn === 'hatchDate' || sortColumn === 'createdAt' || sortColumn === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        // Handle number sorting
        if (sortColumn === 'qty' || sortColumn === 'batchesRequired' || sortColumn === 'trucksRequired') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [salesDispatch, startDate, endDate, searchTerm, sortColumn, sortDirection]);

  // Generate next PO number
  const generateNextPONumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('sales_dispatch')
        .select('po_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last PO number:', error);
        return 'BFLOS-001';
      }

      if (!data || data.length === 0) {
        return 'BFLOS-001';
      }

      const lastPONumber = data[0].po_number;
      const match = lastPONumber.match(/BFLOS-(\d+)/);
      
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        return `BFLOS-${nextNumber.toString().padStart(3, '0')}`;
      }

      return 'BFLOS-001';
    } catch (error) {
      console.error('Error generating PO number:', error);
      return 'BFLOS-001';
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };


  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.poNumber || !newRecordData.customer || !newRecordData.qty) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('sales_dispatch')
        .insert([{
          po_number: newRecordData.poNumber,
          date_ordered: newRecordData.dateOrdered,
          customer: newRecordData.customer,
          qty: newRecordData.qty,
          hatch_date: newRecordData.hatchDate,
          batches_required: newRecordData.batchesRequired || 1,
          trucks_required: newRecordData.trucksRequired || 1,
          created_by: user?.name || 'admin',
          updated_by: user?.name || 'admin',
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating sales dispatch record:', error);
        setError('Failed to create sales dispatch record: ' + error.message);
        return;
      }

      const newRecord: SalesDispatch = {
        id: data.id,
        poNumber: data.po_number,
        dateOrdered: data.date_ordered,
        customer: data.customer,
        qty: data.qty,
        hatchDate: data.hatch_date,
        batchesRequired: data.batches_required,
        trucksRequired: data.trucks_required,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
      };

      setSalesDispatch(prev => [newRecord, ...prev]);
      setIsAddModalVisible(false);
      setNewRecordData({});
      alert(`Sales dispatch record "${newRecord.poNumber}" added successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while adding sales dispatch record');
    }
  };

  const handleEditRecord = (record: SalesDispatch) => {
    setCurrentRecord(record);
    setNewRecordData({
      poNumber: record.poNumber,
      dateOrdered: record.dateOrdered,
      customer: record.customer,
      qty: record.qty,
      hatchDate: record.hatchDate,
      batchesRequired: record.batchesRequired,
      trucksRequired: record.trucksRequired,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    
    if (!newRecordData.poNumber || !newRecordData.customer || !newRecordData.qty) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('sales_dispatch')
        .update({
          po_number: newRecordData.poNumber,
          date_ordered: newRecordData.dateOrdered,
          customer: newRecordData.customer,
          qty: newRecordData.qty,
          hatch_date: newRecordData.hatchDate,
          batches_required: newRecordData.batchesRequired,
          trucks_required: newRecordData.trucksRequired,
          updated_by: user?.name || 'admin',
        })
        .eq('id', currentRecord.id);

      if (error) {
        console.error('Error updating sales dispatch record:', error);
        setError('Failed to update sales dispatch record');
        return;
      }

      setSalesDispatch(prev => prev.map(r => 
        r.id === currentRecord.id 
          ? { 
              ...r, 
              poNumber: newRecordData.poNumber!,
              dateOrdered: newRecordData.dateOrdered!,
              customer: newRecordData.customer!,
              qty: newRecordData.qty!,
              hatchDate: newRecordData.hatchDate!,
              batchesRequired: newRecordData.batchesRequired!,
              trucksRequired: newRecordData.trucksRequired!,
              updatedBy: user?.name || 'admin', 
              updatedAt: new Date().toISOString() 
            }
          : r
      ));
      setIsEditModalVisible(false);
      setCurrentRecord(null);
      setNewRecordData({});
      alert(`Sales dispatch record "${newRecordData.poNumber}" updated successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while updating sales dispatch record');
    }
  };

  const handleDeleteRecord = async (recordId: string, poNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete the sales dispatch record "${poNumber}"?`)) {
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('sales_dispatch')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting sales dispatch record:', error);
        setError('Failed to delete sales dispatch record');
        return;
      }

      setSalesDispatch(prev => prev.filter(r => r.id !== recordId));
      alert('Sales dispatch record deleted successfully');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while deleting sales dispatch record');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
    setNewRecordData(prev => ({
            ...prev,
            [name]: isNumber ? (value === '' ? undefined : Number(value)) : value,
        }));
    };

    return (
    <div className="space-y-8 animate-fade-in-up">

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Combined Filtering and Table Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Purchase Orders</h2>
                <button
            onClick={async () => {
              const nextPO = await generateNextPONumber();
              setNewRecordData({ ...newRecordData, poNumber: nextPO });
              setIsAddModalVisible(true);
            }} 
            className="btn-primary px-6 py-3 text-sm"
          >
            <span>+</span> Create PO
          </button>
        </div>
        {/* Filtering Section */}
        <div className="flex items-end gap-2 mb-6 mt-2">
          <div className="w-1/4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="Start"
            />
          </div>
          <div className="w-1/4">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="End"
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
              <button className="px-4 py-2 text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#5c3a6b' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                </button>
            </div>
          </div>
                </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-[#AAAAAA]">Loading sales dispatch records...</div>
                        </div>
        ) : (
          <div className="mt-6" style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {/* Single Table with Sticky Header */}
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
                      'PO Number', 'Date Ordered', 'Customer', 'Qty', 'Hatch Date',
                      'Batches Required', 'Trucks Required', 'Created By', 'Created At',
                      'Updated By', 'Updated At', 'Actions'
                    ].map((header, index) => {
                      const fieldName = header.toLowerCase().replace(/\s+/g, '').replace('number', 'Number').replace('ordered', 'Ordered').replace('required', 'Required').replace('created', 'Created').replace('updated', 'Updated').replace('at', 'At');
                      const isCurrentSort = sortColumn === fieldName;
                      const isAscending = isCurrentSort && sortDirection === 'asc';
                      const isDescending = isCurrentSort && sortDirection === 'desc';
                      
                      return (
                        <th
                          key={header}
                          className={`px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider ${index < 3 ? 'sticky-header-' + (index + 1) : ''}`}
                          style={{ 
                            width: '150px', 
                            minWidth: '150px',
                            backgroundColor: '#ff8c42',
                            color: 'white',
                            fontWeight: '600',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            left: index < 3 ? `${index * 150}px` : 'auto'
                          }}
                        >
                          <div className="flex items-center">
                            <span className="text-white font-medium text-xs">{header}</span>
                            {header !== 'Actions' && (
                              <div className="ml-4 flex space-x-1">
                                <button
                                  onClick={() => handleSort(fieldName)}
                                  className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
                                >
                                  {isAscending ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 15l-6-6-6 6"/>
                                    </svg>
                                  ) : isDescending ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M6 9l6 6 6-6"/>
                                    </svg>
                                  ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                                    </svg>
                                  )}
                                </button>
                                <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                                    </tr>
                                </thead>
                <tbody>
                  {processedRecords.map(record => (
                    <tr key={record.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                      <td className={`px-4 py-3 text-sm font-medium sticky-column-1`} style={{ 
                        width: '150px', 
                        minWidth: '150px',
                        backgroundColor: '#ff8c42',
                        color: 'white'
                      }}>
                        {record.poNumber}
                      </td>
                      <td className={`px-4 py-3 text-sm sticky-column-2`} style={{ 
                        width: '150px', 
                        minWidth: '150px',
                        backgroundColor: '#ff8c42',
                        color: 'white'
                      }}>
                        {new Date(record.dateOrdered).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 text-sm sticky-column-3`} style={{ 
                        width: '150px', 
                        minWidth: '150px',
                        backgroundColor: '#ff8c42',
                        color: 'white'
                      }}>
                        {record.customer}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{new Date(record.hatchDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{record.batchesRequired}</td>
                      <td className="px-4 py-3 text-sm">{record.trucksRequired}</td>
                      <td className="px-4 py-3 text-sm">{record.createdBy}</td>
                      <td className="px-4 py-3 text-sm">{new Date(record.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{record.updatedBy}</td>
                      <td className="px-4 py-3 text-sm">{new Date(record.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="text-[#5C3A6B] hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id, record.poNumber)}
                          className="text-[#F86F6F] hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    </div>
                </div>
            )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
          <button className="btn-primary px-6 py-3 text-sm">
            <span>+</span> Create Invoice
          </button>
        </div>
        
        {/* Filtering Section */}
        <div className="flex items-end gap-2 mb-6 mt-2">
          <div className="w-1/4">
            <input
              type="date"
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="Start"
            />
          </div>
          <div className="w-1/4">
            <input
              type="date"
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="End"
            />
          </div>
          <div className="flex-1">
            <div className="relative flex rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: '#fffae5' }}>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-900"
              />
              <button className="px-3 py-2 bg-[#5c3a6b] text-white hover:opacity-90">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
                        
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
                    'Invoice Number', 'Date Sent', 'Payment Status', 'Actions'
                  ].map((header, index) => (
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
                      <div className="flex items-center">
                        <span className="text-white font-medium text-xs">{header}</span>
                        {header !== 'Actions' && (
                          <div className="ml-4 flex space-x-1">
                            <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                              </svg>
                            </button>
                            <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                              </svg>
                            </button>
                            </div>
                        )}
                            </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                  <td className="px-4 py-3 text-sm">INV-001</td>
                  <td className="px-4 py-3 text-sm">10/15/2025</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Paid</span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button className="text-[#5C3A6B] hover:underline font-medium">View</button>
                    <button className="text-[#5C3A6B] hover:underline font-medium">Print</button>
                  </td>
                </tr>
                <tr className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                  <td className="px-4 py-3 text-sm">INV-002</td>
                  <td className="px-4 py-3 text-sm">10/16/2025</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button className="text-[#5C3A6B] hover:underline font-medium">View</button>
                    <button className="text-[#5C3A6B] hover:underline font-medium">Print</button>
                  </td>
                </tr>
              </tbody>
            </table>
                            </div>
                            </div>
                        </div>

      {/* Dispatch Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Dispatch</h2>
          <button className="btn-primary px-6 py-3 text-sm">
            <span>+</span> Create Dispatch
          </button>
        </div>
        
        {/* Filtering Section */}
        <div className="flex items-end gap-2 mb-6 mt-2">
          <div className="w-1/4">
            <input
              type="date"
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="Start"
            />
          </div>
          <div className="w-1/4">
            <input
              type="date"
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="End"
            />
          </div>
          <div className="flex-1">
            <div className="relative flex rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: '#fffae5' }}>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-900"
              />
              <button className="px-3 py-2 bg-[#5c3a6b] text-white hover:opacity-90">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
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
                    'Dispatch Number', 'Date', 'Type', 'Trucks', 'Trips'
                  ].map((header, index) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                      style={{ 
                        width: '150px', 
                        minWidth: '150px',
                        backgroundColor: '#ff8c42',
                        color: 'white',
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div className="flex items-center">
                        <span className="text-white font-medium text-xs">{header}</span>
                        {header !== 'Type' && header !== 'Trucks' && header !== 'Trips' && (
                          <div className="ml-4 flex space-x-1">
                            <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                              </svg>
                            </button>
                            <button className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                                            </tr>
                                        </thead>
              <tbody>
                <tr className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                  <td className="px-4 py-3 text-sm">DISP-001</td>
                  <td className="px-4 py-3 text-sm">10/15/2025</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Pickup</span>
                  </td>
                  <td className="px-4 py-3 text-sm">2</td>
                  <td className="px-4 py-3 text-sm">3</td>
                </tr>
                <tr className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                  <td className="px-4 py-3 text-sm">DISP-002</td>
                  <td className="px-4 py-3 text-sm">10/16/2025</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Delivery</span>
                  </td>
                  <td className="px-4 py-3 text-sm">1</td>
                  <td className="px-4 py-3 text-sm">2</td>
                                                </tr>
                                        </tbody>
                                    </table>
                        </div>
                    </div>
                </div>

      {/* Add Record Modal */}
      {isAddModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Create Purchase Order (PO)</h3>
              <button 
                onClick={() => setIsAddModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
                        </div>
            <form onSubmit={handleAddRecord} className="space-y-4">
                                <div>
                <label className="block text-sm font-medium text-gray-700">PO Number</label>
                <input
                  type="text"
                  name="poNumber"
                  value={newRecordData.poNumber || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 bg-gray-100"
                  placeholder="Auto-generated"
                  readOnly
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Date Ordered</label>
                <input
                  type="date"
                  name="dateOrdered"
                  value={newRecordData.dateOrdered || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <input
                  type="text"
                  name="customer"
                  value={newRecordData.customer || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter customer name"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="qty"
                  value={newRecordData.qty || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter quantity"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Hatch Date</label>
                <input
                  type="date"
                  name="hatchDate"
                  value={newRecordData.hatchDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Batches Required</label>
                <input
                  type="number"
                  name="batchesRequired"
                  value={newRecordData.batchesRequired || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter batches required"
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Trucks Required</label>
                <input
                  type="number"
                  name="trucksRequired"
                  value={newRecordData.trucksRequired || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter trucks required"
                />
                                </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalVisible(false)}
                  className="px-6 py-3 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#5C3A6B] text-white rounded-md hover:opacity-90"
                >
                  Create PO
                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

      {/* Edit Record Modal */}
      {isEditModalVisible && currentRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Edit Sales Dispatch Record</h3>
              <button 
                onClick={() => setIsEditModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
                        </div>
            <form onSubmit={handleUpdateRecord} className="space-y-4">
                                <div>
                <label className="block text-sm font-medium text-gray-700">PO Number</label>
                <input
                  type="text"
                  name="poNumber"
                  value={newRecordData.poNumber || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter PO number"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Date Ordered</label>
                <input
                  type="date"
                  name="dateOrdered"
                  value={newRecordData.dateOrdered || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <input
                  type="text"
                  name="customer"
                  value={newRecordData.customer || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter customer name"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="qty"
                  value={newRecordData.qty || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter quantity"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Hatch Date</label>
                <input
                  type="date"
                  name="hatchDate"
                  value={newRecordData.hatchDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Batches Required</label>
                <input
                  type="number"
                  name="batchesRequired"
                  value={newRecordData.batchesRequired || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter batches required"
                />
                                </div>
                                <div>
                <label className="block text-sm font-medium text-gray-700">Trucks Required</label>
                <input
                  type="number"
                  name="trucksRequired"
                  value={newRecordData.trucksRequired || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter trucks required"
                />
                                </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalVisible(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-blue px-6 py-3"
                >
                  Update Record
                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;