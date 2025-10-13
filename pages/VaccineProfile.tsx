import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

interface VaccineProfile {
  id: string;
  vaccineProfileName: string;
  vaccine1Name: string | null;
  vaccine2Name: string | null;
  vaccine3Name: string | null;
  vaccine4Name: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

const VaccineProfile: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<VaccineProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<VaccineProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newVaccine1, setNewVaccine1] = useState('');
  const [newVaccine2, setNewVaccine2] = useState('');
  const [newVaccine3, setNewVaccine3] = useState('');
  const [newVaccine4, setNewVaccine4] = useState('');

  // Fetch vaccine profiles from database
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('vaccine_profiles')
          .select('*')
          .order('vaccine_profile_name');

        if (error) {
          console.error('Error fetching vaccine profiles:', error);
          setError('Failed to fetch vaccine profiles from database');
          setProfiles([]);
        } else {
          const mappedProfiles: VaccineProfile[] = (data || []).map((profile: any) => ({
            id: profile.id,
            vaccineProfileName: profile.vaccine_profile_name,
            vaccine1Name: profile.vaccine_1_name,
            vaccine2Name: profile.vaccine_2_name,
            vaccine3Name: profile.vaccine_3_name,
            vaccine4Name: profile.vaccine_4_name,
            createdBy: profile.created_by || 'admin',
            createdAt: profile.created_at || new Date().toISOString(),
            updatedBy: profile.updated_by || 'admin',
            updatedAt: profile.updated_at || new Date().toISOString(),
          }));
          setProfiles(mappedProfiles);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Database connection failed');
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    const vaccines = [newVaccine1, newVaccine2, newVaccine3, newVaccine4].filter(v => v.trim() !== '');
    if (vaccines.length === 0) {
      alert('Please add at least one vaccine');
      return;
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('vaccine_profiles')
        .insert([{
          vaccine_profile_name: newProfileName.trim(),
          vaccine_1_name: newVaccine1.trim() || null,
          vaccine_2_name: newVaccine2.trim() || null,
          vaccine_3_name: newVaccine3.trim() || null,
          vaccine_4_name: newVaccine4.trim() || null,
          created_by: user?.name || 'admin',
          updated_by: user?.name || 'admin',
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating vaccine profile:', error);
        setError('Failed to create vaccine profile: ' + error.message);
        return;
      }

      const newProfile: VaccineProfile = {
        id: data.id,
        vaccineProfileName: data.vaccine_profile_name,
        vaccine1Name: data.vaccine_1_name,
        vaccine2Name: data.vaccine_2_name,
        vaccine3Name: data.vaccine_3_name,
        vaccine4Name: data.vaccine_4_name,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
      };

      setProfiles(prev => [...prev, newProfile]);
      setIsAddModalVisible(false);
      setNewProfileName('');
      setNewVaccine1('');
      setNewVaccine2('');
      setNewVaccine3('');
      setNewVaccine4('');
      alert(`Vaccine profile "${newProfile.vaccineProfileName}" added successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while adding vaccine profile');
    }
  };

  const handleEditProfile = (profile: VaccineProfile) => {
    setCurrentProfile(profile);
    setNewProfileName(profile.vaccineProfileName);
    setNewVaccine1(profile.vaccine1Name || '');
    setNewVaccine2(profile.vaccine2Name || '');
    setNewVaccine3(profile.vaccine3Name || '');
    setNewVaccine4(profile.vaccine4Name || '');
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    const vaccines = [newVaccine1, newVaccine2, newVaccine3, newVaccine4].filter(v => v.trim() !== '');
    if (vaccines.length === 0) {
      alert('Please add at least one vaccine');
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('vaccine_profiles')
        .update({
          vaccine_profile_name: newProfileName.trim(),
          vaccine_1_name: newVaccine1.trim() || null,
          vaccine_2_name: newVaccine2.trim() || null,
          vaccine_3_name: newVaccine3.trim() || null,
          vaccine_4_name: newVaccine4.trim() || null,
          updated_by: user?.name || 'admin',
        })
        .eq('id', currentProfile.id);

      if (error) {
        console.error('Error updating vaccine profile:', error);
        setError('Failed to update vaccine profile');
        return;
      }

      setProfiles(prev => prev.map(p => 
        p.id === currentProfile.id 
          ? { 
              ...p, 
              vaccineProfileName: newProfileName.trim(), 
              vaccine1Name: newVaccine1.trim() || null,
              vaccine2Name: newVaccine2.trim() || null,
              vaccine3Name: newVaccine3.trim() || null,
              vaccine4Name: newVaccine4.trim() || null,
              updatedBy: user?.name || 'admin', 
              updatedAt: new Date().toISOString() 
            }
          : p
      ));
      setIsEditModalVisible(false);
      setCurrentProfile(null);
      setNewProfileName('');
      setNewVaccine1('');
      setNewVaccine2('');
      setNewVaccine3('');
      setNewVaccine4('');
      alert(`Vaccine profile "${newProfileName}" updated successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while updating vaccine profile');
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    if (!window.confirm(`Are you sure you want to delete the vaccine profile "${profileName}"?`)) {
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('vaccine_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('Error deleting vaccine profile:', error);
        setError('Failed to delete vaccine profile');
        return;
      }

      setProfiles(prev => prev.filter(p => p.id !== profileId));
      alert('Vaccine profile deleted successfully');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while deleting vaccine profile');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="heading-primary">Vaccine Profiles</h1>
        <button 
          onClick={() => setIsAddModalVisible(true)} 
          className="btn-primary px-6 py-3 text-sm"
        >
          <span>+</span> Add Vaccine Profile
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-[#AAAAAA]">Loading vaccine profiles...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <div key={profile.id} className="bg-[#fffae5] rounded-2xl p-6 shadow-md">
              {/* Header */}
              <div className="bg-[#ff8c42] rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
                <span className="font-bold text-black">{profile.vaccineProfileName}</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditProfile(profile)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteProfile(profile.id, profile.vaccineProfileName)}
                    className="text-white hover:text-gray-200 transition-colors"
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

              {/* Vaccine List */}
              <div className="space-y-2 mb-4">
                {[profile.vaccine1Name, profile.vaccine2Name, profile.vaccine3Name, profile.vaccine4Name]
                  .filter(vaccine => vaccine && vaccine.trim() !== '')
                  .map((vaccine, index) => (
                    <div key={index} className="bg-[#ff8c42] rounded-xl px-4 py-2 text-center">
                      <span className="text-black font-medium">{vaccine}</span>
                    </div>
                  ))}
              </div>

              {/* Footer */}
              <div className="text-sm text-black">
                <div>Created by {profile.createdBy} - {new Date(profile.createdAt).toLocaleDateString()}</div>
                <div>Updated by {profile.updatedBy} - {new Date(profile.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Profile Modal */}
      {isAddModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Add Vaccine Profile</h3>
              <button 
                onClick={() => setIsAddModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter profile name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vaccines</label>
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={newVaccine1}
                    onChange={(e) => setNewVaccine1(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 1 name"
                  />
                  <input
                    type="text"
                    value={newVaccine2}
                    onChange={(e) => setNewVaccine2(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 2 name"
                  />
                  <input
                    type="text"
                    value={newVaccine3}
                    onChange={(e) => setNewVaccine3(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 3 name"
                  />
                  <input
                    type="text"
                    value={newVaccine4}
                    onChange={(e) => setNewVaccine4(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 4 name"
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
                  className="btn-blue px-6 py-3"
                >
                  Add Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalVisible && currentProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-gray-800">Edit Vaccine Profile</h3>
              <button 
                onClick={() => setIsEditModalVisible(false)} 
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter profile name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vaccines</label>
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={newVaccine1}
                    onChange={(e) => setNewVaccine1(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 1 name"
                  />
                  <input
                    type="text"
                    value={newVaccine2}
                    onChange={(e) => setNewVaccine2(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 2 name"
                  />
                  <input
                    type="text"
                    value={newVaccine3}
                    onChange={(e) => setNewVaccine3(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 3 name"
                  />
                  <input
                    type="text"
                    value={newVaccine4}
                    onChange={(e) => setNewVaccine4(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Vaccine 4 name"
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
                  className="btn-blue px-6 py-3"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccineProfile;