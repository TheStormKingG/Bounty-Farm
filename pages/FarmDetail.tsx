import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

interface GrowOutRecord {
  id: string;
  farmId: string;
  batchNumber: string;
  chickType: string;
  quantity: number;
  startDate: string;
  expectedEndDate: string;
  status: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

const FarmDetail: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [farmInfo, setFarmInfo] = useState({
    farmName: '',
    farmAddress: '',
    contactPerson: '',
    contactNumber: ''
  });
  
  const [growOutRecords, setGrowOutRecords] = useState<GrowOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newChickType, setNewChickType] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newExpectedEndDate, setNewExpectedEndDate] = useState('');
  const [newStatus, setNewStatus] = useState('Active');
  const [newNotes, setNewNotes] = useState('');

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
  }, [location.state]);

  // Fetch grow-out records for this farm
  useEffect(() => {
    const fetchGrowOutRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For now, we'll create mock data since the grow-out table doesn't exist yet
        // In the future, this would fetch from a grow_out_records table
        const mockRecords: GrowOutRecord[] = [
          {
            id: '1',
            farmId: farmId || '',
            batchNumber: 'BATCH-001',
            chickType: 'Broiler',
            quantity: 1000,
            startDate: '2024-01-15',
            expectedEndDate: '2024-03-15',
            status: 'Active',
            notes: 'First batch for this farm',
            createdBy: user?.email || 'Unknown',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            farmId: farmId || '',
            batchNumber: 'BATCH-002',
            chickType: 'Layer',
            quantity: 500,
            startDate: '2024-02-01',
            expectedEndDate: '2024-08-01',
            status: 'Active',
            notes: 'Layer chicks for egg production',
            createdBy: user?.email || 'Unknown',
            createdAt: new Date().toISOString(),
          }
        ];
        
        setGrowOutRecords(mockRecords);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred.');
        setGrowOutRecords([]);
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      fetchGrowOutRecords();
    }
  }, [farmId, user?.email]);

  // Handle add new grow-out record
  const handleAddGrowOut = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmId) return;

    try {
      // For now, we'll just add to local state
      // In the future, this would insert into the grow_out_records table
      const newRecord: GrowOutRecord = {
        id: Date.now().toString(),
        farmId,
        batchNumber: newBatchNumber,
        chickType: newChickType,
        quantity: parseInt(newQuantity),
        startDate: newStartDate,
        expectedEndDate: newExpectedEndDate,
        status: newStatus,
        notes: newNotes,
        createdBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString(),
      };

      setGrowOutRecords(prev => [newRecord, ...prev]);
      
      // Reset form
      setNewBatchNumber('');
      setNewChickType('');
      setNewQuantity('');
      setNewStartDate('');
      setNewExpectedEndDate('');
      setNewStatus('Active');
      setNewNotes('');
      setIsAddModalVisible(false);
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
              onClick={() => navigate('/farm')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              title="Back to Farms"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">{farmInfo.farmName}</h1>
          </div>
          
          {/* Farm Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Farm Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Grow-Out Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Grow-Out Management</h2>
              <button
                onClick={() => setIsAddModalVisible(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Batch
              </button>
            </div>
          </div>

          {/* Grow-Out Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chick Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {growOutRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <span className="text-gray-400 text-2xl">🌱</span>
                        </div>
                        <p className="text-lg font-medium mb-2">No Grow-Out Records Found</p>
                        <p className="text-sm">Add your first batch to start tracking grow-out activities.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  growOutRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.batchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.chickType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.expectedEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : record.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Grow-Out Modal */}
        {isAddModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Add New Grow-Out Batch</h2>
                <form onSubmit={handleAddGrowOut}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={newBatchNumber}
                        onChange={(e) => setNewBatchNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chick Type
                      </label>
                      <select
                        value={newChickType}
                        onChange={(e) => setNewChickType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Chick Type</option>
                        <option value="Broiler">Broiler</option>
                        <option value="Layer">Layer</option>
                        <option value="Breeder">Breeder</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected End Date
                      </label>
                      <input
                        type="date"
                        value={newExpectedEndDate}
                        onChange={(e) => setNewExpectedEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsAddModalVisible(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Batch
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

export default FarmDetail;
