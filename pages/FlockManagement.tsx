import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabase';
import Card from '../components/Card';
import AddFlockForm from '../components/AddFlockForm';
import { Flock } from '../types';

const FlockManagement: React.FC = () => {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Breeds state for dropdown
  const [breeds, setBreeds] = useState<any[]>([]);
  
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
  const getCellValue = (flock: Flock, column: string): string | number | null => {
    switch (column) {
      case 'FLOCK NUMBER': return flock.flockNumber;
      case 'FLOCK NAME': return flock.flockName || null;
      case 'SUPPLIER': return flock.supplier;
      case 'BREED': return flock.breed || null;
      case 'REMARKS': return flock.remarks || null;
      case 'CREATED BY': return flock.createdBy;
      case 'CREATED AT': return flock.createdAt;
      case 'UPDATED BY': return flock.updatedBy || null;
      default: return null;
    }
  };

  // Helper function to safely convert cell value to string for filtering
  const cellValueToString = (value: string | number | null): string => {
    if (value == null) return '';
    return String(value);
  };

  // Process data with sorting and filtering
  const processedFlocks = React.useMemo(() => {
    let filtered = flocks;

    // Apply filters
    Object.keys(filters).forEach((column) => {
      const value = filters[column];
      if (value) {
        filtered = filtered.filter(flock => {
          const cellValue = getCellValue(flock, column);
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
  }, [flocks, filters, sortColumn, sortDirection]);

  // Fetch flocks from Supabase
  useEffect(() => {
    refreshData();
  }, []);

  // Fetch breeds data for dropdown
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const { data, error } = await supabase
          .from('breeds')
          .select('breed_name, breed_code')
          .order('breed_name');

        if (error) {
          console.error('Error fetching breeds:', error);
        } else {
          setBreeds(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching breeds:', err);
      }
    };

    fetchBreeds();
  }, []);

  const handleAddFlock = async (flockData: Partial<Flock>) => {
    try {
      setError(null);
      
      const { data: flockDataResult, error: flockError } = await supabase
        .from('flocks')
        .insert([{
          flock_number: flockData.flockNumber,
          flock_name: flockData.flockName || null,
          supplier: flockData.supplier,
          breed: flockData.breed || null,
          remarks: flockData.remarks || null,
          created_by: 'admin', // TODO: Get from auth context
        }])
        .select()
        .single();

      if (flockError) {
        console.error('Error creating flock:', flockError);
        setError('Failed to create flock: ' + flockError.message);
        return;
      }

      // Update local state
      const addedFlock: Flock = {
        id: flockDataResult.id,
        flockNumber: flockDataResult.flock_number,
        flockName: flockDataResult.flock_name,
        supplier: flockDataResult.supplier,
        breed: flockDataResult.breed,
        remarks: flockDataResult.remarks,
        createdBy: flockDataResult.created_by,
        createdAt: flockDataResult.created_at,
        updatedBy: flockDataResult.updated_by,
        updatedAt: flockDataResult.updated_at,
      };

      setFlocks(prev => [...prev, addedFlock]);
      alert(`Flock ${addedFlock.flockNumber} added successfully!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while adding flock');
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Expected headers: flock_number, supplier, breed, remarks
      const flockNumberIndex = headers.indexOf('flock_number');
      const flockNameIndex = headers.indexOf('flock_name');
      const supplierIndex = headers.indexOf('supplier');
      const breedIndex = headers.indexOf('breed');
      const remarksIndex = headers.indexOf('remarks');

      if (flockNumberIndex === -1 || supplierIndex === -1) {
        throw new Error('CSV must contain "flock_number" and "supplier" columns');
      }

      const flocksToInsert = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values[flockNumberIndex] && values[supplierIndex]) {
          flocksToInsert.push({
            flock_number: values[flockNumberIndex],
            flock_name: flockNameIndex !== -1 ? values[flockNameIndex] : null,
            supplier: values[supplierIndex],
            breed: breedIndex !== -1 ? values[breedIndex] : null,
            remarks: remarksIndex !== -1 ? values[remarksIndex] : null,
            created_by: 'admin', // TODO: Get from auth context
          });
        }
      }

      if (flocksToInsert.length === 0) {
        throw new Error('No valid flock data found in CSV');
      }

      const { data, error } = await supabase
        .from('flocks')
        .insert(flocksToInsert)
        .select();

      if (error) {
        throw new Error('Failed to upload flocks: ' + error.message);
      }

      // Refresh the flocks list
      const mappedFlocks: Flock[] = (data || []).map((flock: any) => ({
        id: flock.id,
        flockNumber: flock.flock_number,
        flockName: flock.flock_name,
        supplier: flock.supplier,
        breed: flock.breed,
        remarks: flock.remarks,
        createdBy: flock.created_by,
        createdAt: flock.created_at,
      }));

      setFlocks(prev => [...prev, ...mappedFlocks]);
      alert(`Successfully uploaded ${flocksToInsert.length} flocks!`);
    } catch (err: any) {
      console.error('CSV upload error:', err);
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteFlock = async (flockId: string) => {
    if (!window.confirm('Are you sure you want to delete this flock?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('flocks')
        .delete()
        .eq('id', flockId);

      if (error) {
        console.error('Error deleting flock:', error);
        setError('Failed to delete flock');
        return;
      }

      setFlocks(prev => prev.filter(f => f.id !== flockId));
      alert('Flock deleted successfully');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while deleting flock');
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('flocks')
        .select('*')
        .order('flock_number');

      if (error) {
        console.error('Error fetching flocks:', error);
        setError('Failed to fetch flocks from database: ' + error.message);
        setFlocks([]);
      } else {
        const mappedFlocks: Flock[] = (data || []).map((flock: any) => ({
          id: flock.id,
          flockNumber: flock.flock_number,
          flockName: flock.flock_name,
          supplier: flock.supplier,
          breed: flock.breed,
          remarks: flock.remarks,
          createdBy: flock.created_by,
          createdAt: flock.created_at,
          updatedBy: flock.updated_by,
          updatedAt: flock.updated_at,
        }));
        setFlocks(mappedFlocks);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Database connection failed: ' + (err as Error).message);
      setFlocks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="heading-primary">Flock Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={refreshData} 
            className="btn-secondary px-4 py-2"
          >
            Refresh Data
          </button>
          <label className="btn-coral px-4 py-2 cursor-pointer">
            {isUploading ? 'Uploading...' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          <button 
            onClick={() => setIsModalVisible(true)} 
            className="btn-primary px-4 py-2"
          >
            <span>+</span> Add Flock
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      <Card title="Flock List">
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-[#AAAAAA]">Loading flocks...</div>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
            <table className="modern-table min-w-full">
              <thead>
                <tr>
                  {[
                    'FLOCK NUMBER',
                    'FLOCK NAME',
                    'SUPPLIER',
                    'BREED',
                    'REMARKS',
                    'CREATED BY',
                    'CREATED AT',
                    'UPDATED BY',
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
                {processedFlocks.map((flock) => (
                  <tr key={flock.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">{flock.flockNumber}</td>
                    <td className="px-4 py-3 text-sm">{flock.flockName || '-'}</td>
                    <td className="px-4 py-3 text-sm">{flock.supplier}</td>
                    <td className="px-4 py-3 text-sm">{flock.breed || '-'}</td>
                    <td className="px-4 py-3 text-sm">{flock.remarks || '-'}</td>
                    <td className="px-4 py-3 text-sm">{flock.createdBy}</td>
                    <td className="px-4 py-3 text-sm">{flock.createdAt ? new Date(flock.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm">{flock.updatedBy || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Flock Modal */}
      <AddFlockForm
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleAddFlock}
        breeds={breeds}
      />
    </div>
  );
};

export default FlockManagement;
