import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabase';
import { useAuth } from '../context/AuthContext';

interface FarmCustomer {
  id: string;
  farmName: string;
  farmAddress: string;
  contactPerson: string;
  contactNumber: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface IndividualCustomer {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

const Customers: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Farm customers state
  const [farmCustomers, setFarmCustomers] = useState<FarmCustomer[]>([]);
  const [farmStartDate, setFarmStartDate] = useState('');
  const [farmEndDate, setFarmEndDate] = useState('');
  const [farmSearchTerm, setFarmSearchTerm] = useState('');
  const [farmSortColumn, setFarmSortColumn] = useState<string>('');
  const [farmSortDirection, setFarmSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Individual customers state
  const [individualCustomers, setIndividualCustomers] = useState<IndividualCustomer[]>([]);
  const [individualStartDate, setIndividualStartDate] = useState('');
  const [individualEndDate, setIndividualEndDate] = useState('');
  const [individualSearchTerm, setIndividualSearchTerm] = useState('');
  const [individualSortColumn, setIndividualSortColumn] = useState<string>('');
  const [individualSortDirection, setIndividualSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isFarmModalVisible, setIsFarmModalVisible] = useState(false);
  const [isIndividualModalVisible, setIsIndividualModalVisible] = useState(false);
  const [newFarmData, setNewFarmData] = useState<Partial<FarmCustomer>>({});
  const [newIndividualData, setNewIndividualData] = useState<Partial<IndividualCustomer>>({});

  // Form handlers
  const handleFarmFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFarmData(prev => ({ ...prev, [name]: value }));
  };

  const handleIndividualFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewIndividualData(prev => ({ ...prev, [name]: value }));
  };

  // Add farm customer
  const handleAddFarmCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('farm_customers')
        .insert([{
          farm_name: newFarmData.farmName,
          farm_address: newFarmData.farmAddress,
          contact_person: newFarmData.contactPerson,
          contact_number: newFarmData.contactNumber,
          created_by: user?.email || 'admin'
        }]);

      if (error) {
        console.error('Error adding farm customer:', error);
        setError('Failed to add farm customer: ' + error.message);
      } else {
        setIsFarmModalVisible(false);
        setNewFarmData({});
        fetchFarmCustomers(); // Refresh the table
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Add individual customer
  const handleAddIndividualCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('individual_customers')
        .insert([{
          name: newIndividualData.name,
          address: newIndividualData.address,
          phone_number: newIndividualData.phoneNumber,
          created_by: user?.email || 'admin'
        }]);

      if (error) {
        console.error('Error adding individual customer:', error);
        setError('Failed to add individual customer: ' + error.message);
      } else {
        setIsIndividualModalVisible(false);
        setNewIndividualData({});
        fetchIndividualCustomers(); // Refresh the table
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Fetch farm customers
  const fetchFarmCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('farm_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching farm customers:', error);
        setError('Failed to fetch farm customers: ' + error.message);
        setFarmCustomers([]);
      } else {
        const mappedCustomers: FarmCustomer[] = (data || []).map((record: any) => ({
          id: record.id,
          farmName: record.farm_name,
          farmAddress: record.farm_address,
          contactPerson: record.contact_person,
          contactNumber: record.contact_number,
          createdBy: record.created_by,
          createdAt: record.created_at,
          updatedBy: record.updated_by,
          updatedAt: record.updated_at,
        }));
        setFarmCustomers(mappedCustomers);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
      setFarmCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual customers
  const fetchIndividualCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('individual_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching individual customers:', error);
        setError('Failed to fetch individual customers: ' + error.message);
        setIndividualCustomers([]);
      } else {
        const mappedCustomers: IndividualCustomer[] = (data || []).map((record: any) => ({
          id: record.id,
          name: record.name,
          address: record.address,
          phoneNumber: record.phone_number,
          createdBy: record.created_by,
          createdAt: record.created_at,
          updatedBy: record.updated_by,
          updatedAt: record.updated_at,
        }));
        setIndividualCustomers(mappedCustomers);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
      setIndividualCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmCustomers();
    fetchIndividualCustomers();
  }, []);

  // Process farm customers with filtering and sorting
  const processedFarmCustomers = React.useMemo(() => {
    let filtered = [...farmCustomers];

    // Apply date filter
    if (farmStartDate) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) >= new Date(farmStartDate)
      );
    }
    if (farmEndDate) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) <= new Date(farmEndDate)
      );
    }

    // Apply search filter
    if (farmSearchTerm) {
      filtered = filtered.filter(customer =>
        customer.farmName.toLowerCase().includes(farmSearchTerm.toLowerCase()) ||
        customer.farmAddress.toLowerCase().includes(farmSearchTerm.toLowerCase()) ||
        customer.contactPerson.toLowerCase().includes(farmSearchTerm.toLowerCase()) ||
        customer.contactNumber.toLowerCase().includes(farmSearchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (farmSortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[farmSortColumn as keyof FarmCustomer];
        let bValue: any = b[farmSortColumn as keyof FarmCustomer];
        
        if (aValue === bValue) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        const comparison = aValue < bValue ? -1 : 1;
        return farmSortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [farmCustomers, farmStartDate, farmEndDate, farmSearchTerm, farmSortColumn, farmSortDirection]);

  // Process individual customers with filtering and sorting
  const processedIndividualCustomers = React.useMemo(() => {
    let filtered = [...individualCustomers];

    // Apply date filter
    if (individualStartDate) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) >= new Date(individualStartDate)
      );
    }
    if (individualEndDate) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) <= new Date(individualEndDate)
      );
    }

    // Apply search filter
    if (individualSearchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(individualSearchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(individualSearchTerm.toLowerCase()) ||
        customer.phoneNumber.toLowerCase().includes(individualSearchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (individualSortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[individualSortColumn as keyof IndividualCustomer];
        let bValue: any = b[individualSortColumn as keyof IndividualCustomer];
        
        if (aValue === bValue) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        const comparison = aValue < bValue ? -1 : 1;
        return individualSortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [individualCustomers, individualStartDate, individualEndDate, individualSearchTerm, individualSortColumn, individualSortDirection]);

  const handleSort = (column: string, type: 'farm' | 'individual') => {
    if (type === 'farm') {
      if (farmSortColumn === column) {
        setFarmSortDirection(farmSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setFarmSortColumn(column);
        setFarmSortDirection('asc');
      }
    } else {
      if (individualSortColumn === column) {
        setIndividualSortDirection(individualSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setIndividualSortColumn(column);
        setIndividualSortDirection('asc');
      }
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Farm Customers Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Farms</h2>
          <button
            onClick={() => setIsFarmModalVisible(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            + Add Farm
          </button>
        </div>
        
        {/* Filtering Section */}
        <div className="flex items-end gap-2 mb-6 mt-2">
          <div className="w-1/4">
            <input
              type="date"
              value={farmStartDate}
              onChange={(e) => setFarmStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="Start"
            />
          </div>
          <div className="w-1/4">
            <input
              type="date"
              value={farmEndDate}
              onChange={(e) => setFarmEndDate(e.target.value)}
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
                value={farmSearchTerm}
                onChange={(e) => setFarmSearchTerm(e.target.value)}
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
            <div className="text-lg text-[#AAAAAA]">Loading farm customers...</div>
          </div>
        ) : (
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
                      'Farm Name', 'Farm Address', 'Contact Person', 'Contact Number', 'Created By', 'Created At'
                    ].map((header, index) => {
                      const fieldName = header.toLowerCase().replace(/\s+/g, '').replace('name', 'Name').replace('address', 'Address').replace('person', 'Person').replace('number', 'Number').replace('created', 'Created').replace('at', 'At');
                      const isCurrentSort = farmSortColumn === fieldName;
                      const isAscending = isCurrentSort && farmSortDirection === 'asc';
                      const isDescending = isCurrentSort && farmSortDirection === 'desc';

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
                          <div className="flex items-center">
                            <span className="text-white font-medium text-xs">{header}</span>
                            <div className="ml-4 flex space-x-1">
                              <button
                                onClick={() => handleSort(fieldName, 'farm')}
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
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {processedFarmCustomers.map(customer => (
                    <tr key={customer.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#5C3A6B]">{customer.farmName}</td>
                      <td className="px-4 py-3 text-sm">{customer.farmAddress}</td>
                      <td className="px-4 py-3 text-sm">{customer.contactPerson}</td>
                      <td className="px-4 py-3 text-sm">{customer.contactNumber}</td>
                      <td className="px-4 py-3 text-sm">{customer.createdBy}</td>
                      <td className="px-4 py-3 text-sm">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Individual Customers Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Individuals</h2>
          <button
            onClick={() => setIsIndividualModalVisible(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            + Add Individual
          </button>
        </div>
        
        {/* Filtering Section */}
        <div className="flex items-end gap-2 mb-6 mt-2">
          <div className="w-1/4">
            <input
              type="date"
              value={individualStartDate}
              onChange={(e) => setIndividualStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fffae5] rounded-2xl shadow-md text-sm"
              placeholder="Start"
            />
          </div>
          <div className="w-1/4">
            <input
              type="date"
              value={individualEndDate}
              onChange={(e) => setIndividualEndDate(e.target.value)}
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
                value={individualSearchTerm}
                onChange={(e) => setIndividualSearchTerm(e.target.value)}
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
            <div className="text-lg text-[#AAAAAA]">Loading individual customers...</div>
          </div>
        ) : (
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
                      'Name', 'Address', 'Phone Number', 'Created By', 'Created At'
                    ].map((header, index) => {
                      const fieldName = header.toLowerCase().replace(/\s+/g, '').replace('name', 'Name').replace('address', 'Address').replace('number', 'Number').replace('created', 'Created').replace('at', 'At');
                      const isCurrentSort = individualSortColumn === fieldName;
                      const isAscending = isCurrentSort && individualSortDirection === 'asc';
                      const isDescending = isCurrentSort && individualSortDirection === 'desc';

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
                          <div className="flex items-center">
                            <span className="text-white font-medium text-xs">{header}</span>
                            <div className="ml-4 flex space-x-1">
                              <button
                                onClick={() => handleSort(fieldName, 'individual')}
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
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {processedIndividualCustomers.map(customer => (
                    <tr key={customer.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#5C3A6B]">{customer.name}</td>
                      <td className="px-4 py-3 text-sm">{customer.address}</td>
                      <td className="px-4 py-3 text-sm">{customer.phoneNumber}</td>
                      <td className="px-4 py-3 text-sm">{customer.createdBy}</td>
                      <td className="px-4 py-3 text-sm">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Farm Modal */}
      {isFarmModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Add New Farm</h3>
              <button 
                onClick={() => setIsFarmModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddFarmCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                <input
                  type="text"
                  name="farmName"
                  value={newFarmData.farmName || ''}
                  onChange={handleFarmFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter farm name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Farm Address</label>
                <input
                  type="text"
                  name="farmAddress"
                  value={newFarmData.farmAddress || ''}
                  onChange={handleFarmFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter farm address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={newFarmData.contactPerson || ''}
                  onChange={handleFarmFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter contact person name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={newFarmData.contactNumber || ''}
                  onChange={handleFarmFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter contact number"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFarmModalVisible(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2"
                >
                  Add Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Individual Modal */}
      {isIndividualModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Add New Individual</h3>
              <button 
                onClick={() => setIsIndividualModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddIndividualCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newIndividualData.name || ''}
                  onChange={handleIndividualFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={newIndividualData.address || ''}
                  onChange={handleIndividualFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={newIndividualData.phoneNumber || ''}
                  onChange={handleIndividualFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsIndividualModalVisible(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2"
                >
                  Add Individual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
