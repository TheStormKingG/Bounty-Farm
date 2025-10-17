import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';

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
  const navigate = useNavigate();
  const [farmCustomers, setFarmCustomers] = useState<FarmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect farmers to their specific farm detail page
  useEffect(() => {
    if (user?.role === Role.Farmer) {
      // For farmers, redirect to their specific farm detail page
      const farmName = user.name || '';
      navigate(`/farmer/${encodeURIComponent(farmName)}`);
      return;
    }
  }, [user, navigate]);

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

  // Handle farm click - navigate to individual farm page
  const handleFarmClick = (farm: FarmCustomer) => {
    navigate(`/farm/${farm.id}`, { 
      state: { 
        farmName: farm.farmName,
        farmAddress: farm.farmAddress,
        contactPerson: farm.contactPerson,
        contactNumber: farm.contactNumber
      }
    });
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
                {/* Clickable Header */}
                <button 
                  onClick={() => handleFarmClick(farm)}
                  className="w-full bg-[#ff8c42] rounded-xl px-4 py-3 mb-4 flex justify-between items-center shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#e67e22] cursor-pointer"
                >
                  <span className="font-bold text-black">{farm.farmName}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>

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
      </div>
    </div>
  );
};

export default Farm;
