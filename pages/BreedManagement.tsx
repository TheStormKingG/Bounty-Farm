import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../src/supabase';
import Card from '../components/Card';

interface Breed {
  id: string;
  breedType: string;
  breedCode: string;
  breedName: string;
  startDate: string;
  endDate?: string;
  remarks?: string;
  updated: string;
}

const BreedManagement: React.FC = () => {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newBreed, setNewBreed] = useState<Partial<Breed>>({
    breedType: '',
    breedCode: '',
    breedName: '',
    startDate: '',
    endDate: '',
    remarks: '',
  });

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});

  // Sorting function
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtering function
  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Clear filter function
  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  // Toggle filter visibility
  const toggleFilter = (column: string) => {
    setShowFilters(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Helper function to get cell value for sorting/filtering
  const getCellValue = (breed: Breed, column: string): string | number | null => {
    switch (column) {
      case 'BREED TYPE': return breed.breedType;
      case 'BREED CODE': return breed.breedCode;
      case 'BREED NAME': return breed.breedName;
      case 'START DATE': return breed.startDate;
      case 'END DATE': return breed.endDate || null;
      case 'REMARKS': return breed.remarks || null;
      case 'UPDATED': return breed.updated;
      default: return null;
    }
  };

  // Process data with sorting and filtering
  const processedBreeds = useMemo(() => {
    let filtered = breeds;

    // Apply filters
    Object.keys(filters).forEach((column) => {
      const value = filters[column];
      if (value) {
        filtered = filtered.filter(breed => {
          const cellValue = getCellValue(breed, column);
          if (cellValue === null || cellValue === undefined) return false;
          const searchText = String(cellValue).toLowerCase();
          return searchText.includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = getCellValue(a, sortColumn);
        const bValue = getCellValue(b, sortColumn);
        
        if (aValue === bValue) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [breeds, filters, sortColumn, sortDirection]);

  // Fetch breeds from Supabase
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('breeds')
        .select('*')
        .order('breed_code');

      if (error) {
        console.error('Error fetching breeds:', error);
        setError('Failed to fetch breeds from database: ' + error.message);
        setBreeds([]);
      } else {
        const mappedBreeds: Breed[] = (data || []).map((breed: any) => ({
          id: breed.id,
          breedType: breed.breed_type,
          breedCode: breed.breed_code,
          breedName: breed.breed_name,
          startDate: breed.start_date,
          endDate: breed.end_date,
          remarks: breed.remarks,
          updated: breed.updated,
        }));
        setBreeds(mappedBreeds);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Database connection failed: ' + (err as Error).message);
      setBreeds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data: breedData, error: breedError } = await supabase
        .from('breeds')
        .insert([{
          breed_type: newBreed.breedType,
          breed_code: newBreed.breedCode,
          breed_name: newBreed.breedName,
          start_date: newBreed.startDate,
          end_date: newBreed.endDate || null,
          remarks: newBreed.remarks || null,
        }])
        .select()
        .single();

      if (breedError) {
        console.error('Error creating breed:', breedError);
        setError('Failed to add breed: ' + breedError.message);
        return;
      }

      if (breedData) {
        setBreeds(prev => [...prev, {
          id: breedData.id,
          breedType: breedData.breed_type,
          breedCode: breedData.breed_code,
          breedName: breedData.breed_name,
          startDate: breedData.start_date,
          endDate: breedData.end_date,
          remarks: breedData.remarks,
          updated: breedData.updated,
        }]);
        setIsModalVisible(false);
        setNewBreed({ breedType: '', breedCode: '', breedName: '', startDate: '', endDate: '', remarks: '' });
      }
    } catch (err) {
      console.error('Unexpected error adding breed:', err);
      setError('An unexpected error occurred.');
    }
  };

  const handleDeleteBreed = async (breedId: string) => {
    if (!window.confirm('Are you sure you want to delete this breed?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('breeds')
        .delete()
        .eq('id', breedId);

      if (error) {
        console.error('Error deleting breed:', error);
        setError('Failed to delete breed: ' + error.message);
      } else {
        setBreeds(prev => prev.filter(breed => breed.id !== breedId));
      }
    } catch (err) {
      console.error('Unexpected error deleting breed:', err);
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="heading-primary">Breed Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={refreshData} 
            className="btn-secondary px-4 py-2"
          >
            Refresh Data
          </button>
          <button 
            onClick={() => setIsModalVisible(true)} 
            className="btn-primary px-4 py-2"
          >
            <span>+</span> Add Breed
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      <Card title="Current Breeds">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-[#AAAAAA]">Loading breeds...</div>
          </div>
        ) : (
          <div className="overflow-x-auto mt-6" style={{ maxHeight: '70vh' }}>
            <table className="modern-table min-w-full">
              <thead>
                <tr>
                  {[
                    'BREED TYPE',
                    'BREED CODE',
                    'BREED NAME',
                    'START DATE',
                    'END DATE',
                    'REMARKS',
                    'UPDATED',
                  ].map((header) => (
                    <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center justify-between">
                        <span>{header}</span>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleSort(header)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title={`Sort by ${header}`}
                          >
                            {sortColumn === header ? (
                              sortDirection === 'asc' ? '↑' : '↓'
                            ) : (
                              '↕'
                            )}
                          </button>
                          <button
                            onClick={() => toggleFilter(header)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title={`Filter ${header}`}
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                      {showFilters[header] && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder={`Filter ${header}...`}
                            value={filters[header] || ''}
                            onChange={(e) => handleFilter(header, e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                          {filters[header] && (
                            <button
                              onClick={() => clearFilter(header)}
                              className="mt-1 text-xs text-red-600 hover:text-red-800"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedBreeds.map((breed) => (
                  <tr key={breed.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                    <td className="px-4 py-3 text-sm">{breed.breedType}</td>
                    <td className="px-4 py-3 text-sm font-mono">{breed.breedCode}</td>
                    <td className="px-4 py-3 text-sm">{breed.breedName}</td>
                    <td className="px-4 py-3 text-sm">{breed.startDate ? new Date(breed.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm">{breed.endDate ? new Date(breed.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm">{breed.remarks || '-'}</td>
                    <td className="px-4 py-3 text-sm">{breed.updated ? new Date(breed.updated).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Breed</h3>
            <form onSubmit={handleAddBreed} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Breed Type *</label>
                <input
                  type="text"
                  value={newBreed.breedType || ''}
                  onChange={(e) => setNewBreed({...newBreed, breedType: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Breed Code *</label>
                <input
                  type="text"
                  value={newBreed.breedCode || ''}
                  onChange={(e) => setNewBreed({...newBreed, breedCode: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Breed Name *</label>
                <input
                  type="text"
                  value={newBreed.breedName || ''}
                  onChange={(e) => setNewBreed({...newBreed, breedName: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  type="date"
                  value={newBreed.startDate || ''}
                  onChange={(e) => setNewBreed({...newBreed, startDate: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={newBreed.endDate || ''}
                  onChange={(e) => setNewBreed({...newBreed, endDate: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  value={newBreed.remarks || ''}
                  onChange={(e) => setNewBreed({...newBreed, remarks: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalVisible(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-blue px-6 py-3"
                >
                  Add Breed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreedManagement;
