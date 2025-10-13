import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

interface VaccineProfile {
  id: string;
  name: string;
  vaccines: string[];
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
  const [newVaccines, setNewVaccines] = useState<string[]>(['']);

  // Fetch vaccine profiles from database
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('vaccine_profiles')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching vaccine profiles:', error);
          setError('Failed to fetch vaccine profiles from database');
          setProfiles([]);
        } else {
          const mappedProfiles: VaccineProfile[] = (data || []).map((profile: any) => ({
            id: profile.id,
            name: profile.name,
            vaccines: profile.vaccines || [],
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

    const vaccines = newVaccines.filter(v => v.trim() !== '');
    if (vaccines.length === 0) {
      alert('Please add at least one vaccine');
      return;
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('vaccine_profiles')
        .insert([{
          name: newProfileName.trim(),
          vaccines: vaccines,
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
        name: data.name,
        vaccines: data.vaccines,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
      };

      setProfiles(prev => [...prev, newProfile]);
      setIsAddModalVisible(false);
      setNewProfileName('');
      setNewVaccines(['']);
      alert(`Vaccine profile "${newProfile.name}" added successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while adding vaccine profile');
    }
  };

  const handleEditProfile = (profile: VaccineProfile) => {
    setCurrentProfile(profile);
    setNewProfileName(profile.name);
    setNewVaccines(profile.vaccines.length > 0 ? profile.vaccines : ['']);
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    const vaccines = newVaccines.filter(v => v.trim() !== '');
    if (vaccines.length === 0) {
      alert('Please add at least one vaccine');
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('vaccine_profiles')
        .update({
          name: newProfileName.trim(),
          vaccines: vaccines,
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
          ? { ...p, name: newProfileName.trim(), vaccines: vaccines, updatedBy: user?.name || 'admin', updatedAt: new Date().toISOString() }
          : p
      ));
      setIsEditModalVisible(false);
      setCurrentProfile(null);
      setNewProfileName('');
      setNewVaccines(['']);
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

  const addVaccineField = () => {
    setNewVaccines(prev => [...prev, '']);
  };

  const removeVaccineField = (index: number) => {
    if (newVaccines.length > 1) {
      setNewVaccines(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateVaccineField = (index: number, value: string) => {
    setNewVaccines(prev => prev.map((v, i) => i === index ? value : v));
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
                <span className="font-bold text-black">{profile.name}</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditProfile(profile)}
                    className="text-black hover:text-gray-700"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteProfile(profile.id, profile.name)}
                    className="text-black hover:text-gray-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Vaccine List */}
              <div className="space-y-2 mb-4">
                {profile.vaccines.map((vaccine, index) => (
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
                {newVaccines.map((vaccine, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      value={vaccine}
                      onChange={(e) => updateVaccineField(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm px-3 py-2"
                      placeholder={`Vaccine ${index + 1} name`}
                    />
                    {newVaccines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVaccineField(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVaccineField}
                  className="mt-2 text-[#5C3A6B] hover:underline text-sm"
                >
                  + Add another vaccine
                </button>
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
                {newVaccines.map((vaccine, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      value={vaccine}
                      onChange={(e) => updateVaccineField(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm px-3 py-2"
                      placeholder={`Vaccine ${index + 1} name`}
                    />
                    {newVaccines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVaccineField(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVaccineField}
                  className="mt-2 text-[#5C3A6B] hover:underline text-sm"
                >
                  + Add another vaccine
                </button>
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
