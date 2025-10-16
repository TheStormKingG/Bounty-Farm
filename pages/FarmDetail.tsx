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
