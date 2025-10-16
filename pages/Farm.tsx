import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

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

const Farm: React.FC = () => {
  const { user } = useAuth();
  const [farmCustomers, setFarmCustomers] = useState<FarmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentFarm, setCurrentFarm] = useState<FarmCustomer | null>(null);
  const [editFarmName, setEditFarmName] = useState('');
  const [editFarmAddress, setEditFarmAddress] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');

  // Fetch farm customers from database
  useEffect(() => {
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

    fetchFarmCustomers();
  }, []);

  // Handle edit farm
  const handleEditFarm = (farm: FarmCustomer) => {
    setCurrentFarm(farm);
    setEditFarmName(farm.farmName);
    setEditFarmAddress(farm.farmAddress);
    setEditContactPerson(farm.contactPerson);
    setEditContactNumber(farm.contactNumber);
    setIsEditModalVisible(true);
  };

  // Handle update farm
  const handleUpdateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFarm) return;

    try {
      const { error } = await supabase
        .from('farm_customers')
        .update({
          farm_name: editFarmName,
          farm_address: editFarmAddress,
          contact_person: editContactPerson,
          contact_number: editContactNumber,
          updated_by: user?.email || 'Unknown',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentFarm.id);

      if (error) {
        console.error('Error updating farm:', error);
        setError('Failed to update farm: ' + error.message);
        return;
      }

      // Update local state
      setFarmCustomers(prev => 
        prev.map(farm => 
          farm.id === currentFarm.id 
            ? {
                ...farm,
                farmName: editFarmName,
                farmAddress: editFarmAddress,
                contactPerson: editContactPerson,
                contactNumber: editContactNumber,
                updatedBy: user?.email || 'Unknown',
                updatedAt: new Date().toISOString(),
              }
            : farm
        )
      );

      setIsEditModalVisible(false);
      setCurrentFarm(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Handle delete farm
  const handleDeleteFarm = async (farmId: string, farmName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${farmName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('farm_customers')
        .delete()
        .eq('id', farmId);

      if (error) {
        console.error('Error deleting farm:', error);
        setError('Failed to delete farm: ' + error.message);
        return;
      }

      // Update local state
      setFarmCustomers(prev => prev.filter(farm => farm.id !== farmId));
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm customers...</p>
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
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Farms</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
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
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Farm Management</h1>
          <p className="text-gray-600 text-lg">Manage your farm customers and their information</p>
        </div>

        {/* Farm Cards Grid */}
        {farmCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-4xl">🚜</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Farm Customers Found</h3>
            <p className="text-gray-500 mb-6">
              Farm customers will appear here when they are added through the Customers page.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg max-w-md mx-auto">
              <p className="text-blue-800 font-semibold mb-2">Coming Soon...</p>
              <p className="text-blue-700">
                If BFLOS Proposal is accepted this module will be operational by the end of <strong>November</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmCustomers.map(farm => (
              <div key={farm.id} className="bg-[#fffae5] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-[#ff8c42] rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
                  <span className="font-bold text-black">{farm.farmName}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditFarm(farm)}
                      className="text-white hover:text-gray-200 transition-colors"
                      title="Edit Farm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteFarm(farm.id, farm.farmName)}
                      className="text-white hover:text-gray-200 transition-colors"
                      title="Delete Farm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Farm Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start">
                    <span className="text-gray-600 font-medium w-20 text-sm">Address:</span>
                    <span className="text-gray-800 text-sm flex-1">{farm.farmAddress}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-600 font-medium w-20 text-sm">Contact:</span>
                    <span className="text-gray-800 text-sm flex-1">{farm.contactPerson}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-600 font-medium w-20 text-sm">Phone:</span>
                    <span className="text-gray-800 text-sm flex-1">{farm.contactNumber}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <div>Created: {new Date(farm.createdAt).toLocaleDateString()}</div>
                    {farm.updatedAt && (
                      <div>Updated: {new Date(farm.updatedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalVisible && currentFarm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Edit Farm</h2>
                <form onSubmit={handleUpdateFarm}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farm Name
                      </label>
                      <input
                        type="text"
                        value={editFarmName}
                        onChange={(e) => setEditFarmName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farm Address
                      </label>
                      <input
                        type="text"
                        value={editFarmAddress}
                        onChange={(e) => setEditFarmAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={editContactPerson}
                        onChange={(e) => setEditContactPerson(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={editContactNumber}
                        onChange={(e) => setEditContactNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
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
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Update Farm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Farm;
