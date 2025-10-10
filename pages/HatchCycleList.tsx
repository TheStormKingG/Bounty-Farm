import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AddFlockForm from '../components/AddFlockForm';
import { HatchCycle, HatchColourCode, Flock } from '../types';
import { supabase } from '../src/supabase';

const initialCycles: HatchCycle[] = [
    { 
        id: 'HC001', 
        hatchNo: '2025-011-BFL', 
        colourCode: HatchColourCode.GREEN,
        flocksRecd: ['F25-34'],
        casesRecd: 200,
        eggsRecd: 14200,
        avgEggWgt: 62.1,
        eggsCracked: 200,
        eggsSet: 14000, 
        datePacked: '2025-08-09',
        setDate: '2025-08-10', 
        dateCandled: '2025-08-18',
        candling: { clears: 1000, earlyDead: 200 }, 
        expHatchQty: 12800,
        pctAdj: 0,
        expHatchQtyAdj: 12800,
        hatchDate: '2025-08-31', 
        avgChicksWgt: 41.5,
        outcome: { hatched: 12650, culled: 50 },
        vaccinationProfile: 'ND-HH, IB', 
        chicksSold: 12600,
        status: 'CLOSED', 
        createdBy: 'clerk-01', 
    createdAt: '2025-08-10',
    },
    { 
        id: 'HC002', 
        hatchNo: '2025-012-BFL', 
        colourCode: HatchColourCode.WHITE,
        flocksRecd: ['F25-35', 'F25-36'],
        casesRecd: 215,
        eggsRecd: 15250,
        avgEggWgt: 63.0,
        eggsCracked: 250,
        eggsSet: 15000, 
        datePacked: '2025-08-16',
        setDate: '2025-08-17', 
        dateCandled: '2025-08-25',
        candling: { clears: 1200, earlyDead: 250 }, 
        expHatchQty: 13550,
        pctAdj: -1.5,
        expHatchQtyAdj: 13347,
        hatchDate: '2025-09-07', 
        avgChicksWgt: 42.0,
        outcome: { hatched: 13200, culled: 70 },
        vaccinationProfile: 'ND-HH, IB, IBD',
        chicksSold: 13130, 
        status: 'CLOSED', 
        createdBy: 'clerk-01', 
    createdAt: '2025-08-17',
    },
    { 
        id: 'HC003', 
        hatchNo: '2025-013-BFL', 
        colourCode: HatchColourCode.YELLOW,
        flocksRecd: ['F25-37'],
        casesRecd: 208,
        eggsRecd: 14700,
        avgEggWgt: 61.8,
        eggsCracked: 200,
        eggsSet: 14500, 
        datePacked: '2025-08-23',
        setDate: '2025-08-24',
        candling: {},
        outcome: {},
        status: 'OPEN', 
        createdBy: 'clerk-01', 
    createdAt: '2025-08-24',
    },
];

const HighlightedCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-bounty-blue-600 text-white font-semibold rounded px-2 py-1 text-center">
        {children}
    </div>
);

// --- helpers to keep UI <> DB clean -----------------------------------------
const colourLabel = (v?: string) => (v ? String(v).split('-').pop() ?? v : '-');

// Map from table row (hatch_cycles) => UI type
const mapTableRowToCycle = (r: any): HatchCycle => ({
  id: r.id,
  hatchNo: r.hatch_no,
  colourCode: (r.hatch_colour as HatchColourCode) ?? (r.hatch_colour as any),
  flocksRecd: r.flocks_recvd ? String(r.flocks_recvd).split(',').map((s: string) => s.trim()) : [],
  supplierFlockNumber: r.supplier_flock_number ?? undefined,
  supplierName: r.supplier_name ?? undefined,
  casesRecd: r.cases_recvd ?? undefined,
  eggsRecd: r.eggs_recvd ?? undefined,
  avgEggWgt: r.avg_egg_wgt ?? undefined,
  eggsCracked: r.eggs_cracked ?? undefined,
  eggsSet: r.eggs_set ?? 0,
  datePacked: r.date_packed ?? undefined,
  setDate: r.date_set ?? undefined,
  dateCandled: r.date_candled ?? undefined,
  candling: {
    clears: r.candling_clears ?? undefined,
    earlyDead: r.candling_early_dead ?? undefined,
  },
  expHatchQty: r.exp_hatch_qty ?? undefined,
  pctAdj: r.pct_adj ?? undefined,
  expHatchQtyAdj: r.exp_hatch_qty_adj ?? undefined,
  hatchDate: r.hatch_date ?? undefined,
  avgChicksWgt: r.avg_chicks_wgt ?? undefined,
  outcome: {
    hatched: r.chicks_hatched ?? undefined,
    culled: r.chicks_culled ?? undefined,
  },
  vaccinationProfile: r.vaccination_profile ?? undefined,
  chicksSold: r.chicks_sold ?? undefined,
  status: (r.status as 'OPEN' | 'CLOSED') ?? 'OPEN',
  createdBy: r.created_by ?? 'admin',
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
  updatedBy: r.updated_by ?? undefined,
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
});

// Map from UI newCycle => base table payload with quoted keys
const toBaseTablePayload = (c: HatchCycle) => ({
  hatch_no: c.hatchNo,
  hatch_colour: c.colourCode ? String(c.colourCode).split('-').pop() : null,
  flocks_recvd: (c.flocksRecd ?? []).join(', '),
  supplier_flock_number: c.supplierFlockNumber ?? null,
  supplier_name: c.supplierName ?? null,
  cases_recvd: c.casesRecd ?? null,
  eggs_recvd: c.eggsRecd ?? null,
  avg_egg_wgt: c.avgEggWgt ?? null,
  eggs_cracked: c.eggsCracked ?? null,
  eggs_set: c.eggsSet ?? 0,
  date_packed: c.datePacked ?? null,
  date_set: c.setDate ?? null,
  date_candled: c.dateCandled ?? null,
  candling_clears: c.candling?.clears ?? null,
  candling_early_dead: c.candling?.earlyDead ?? null,
  exp_hatch_qty: c.expHatchQty ?? null,
  pct_adj: c.pctAdj ?? null,
  exp_hatch_qty_adj: c.expHatchQtyAdj ?? null,
  hatch_date: c.hatchDate ?? null,
  avg_chicks_wgt: c.avgChicksWgt ?? null,
  chicks_hatched: c.outcome?.hatched ?? null,
  chicks_culled: c.outcome?.culled ?? null,
  vaccination_profile: c.vaccinationProfile ?? null,
  chicks_sold: c.chicksSold ?? null,
  status: c.status ?? 'OPEN',
  created_by: c.createdBy ?? 'admin',
});
// -----------------------------------------------------------------------------

const HatchCycleList: React.FC = () => {
  const [cycles, setCycles] = useState<HatchCycle[]>([]);
    const [isNewCycleModalVisible, setIsNewCycleModalVisible] = useState(false);
  const [newCycleData, setNewCycleData] = useState<Partial<HatchCycle>>({
    status: 'OPEN',
    candling: {},
    outcome: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Flock suggestions state
  const [flocks, setFlocks] = useState<any[]>([]);
  const [flockSuggestions, setFlockSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddFlockModalVisible, setIsAddFlockModalVisible] = useState(false);
  
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
  const getCellValue = (cycle: HatchCycle, column: string): string | number | null => {
    switch (column) {
      case 'HATCH NO': return cycle.hatchNo;
      case 'HATCH COLOUR': return cycle.colourCode || null;
      case 'FLOCKS RECVD': return cycle.flocksRecd?.join(', ') || null;
      case 'SUPPLIER FLOCK NUMBER': return cycle.supplierFlockNumber || null;
      case 'SUPPLIER NAME': return cycle.supplierName || null;
      case 'CASES RECVD': return cycle.casesRecd || null;
      case 'EGGS RECVD': return cycle.eggsRecd || null;
      case 'AVG EGG WGT': return cycle.avgEggWgt || null;
      case 'EGGS CRACKED': return cycle.eggsCracked || null;
      case 'EGGS SET': return cycle.eggsSet || null;
      case 'DATE PACKED': return cycle.datePacked || null;
      case 'DATE SET': return cycle.setDate || null;
      case 'DATE CANDLED': return cycle.dateCandled || null;
      case 'EXP HATCH QTY': return cycle.expHatchQty || null;
      case 'PCT ADJ': return cycle.pctAdj || null;
      case 'EXP HATCH QTY ADJ': return cycle.expHatchQtyAdj || null;
      case 'HATCH DATE': return cycle.hatchDate || null;
      case 'AVG CHICKS WGT': return cycle.avgChicksWgt || null;
      case 'CHICKS HATCHED': return cycle.outcome.hatched || null;
      case 'CHICKS CULLED': return cycle.outcome.culled || null;
      case 'VACCINATION PROFILE': return cycle.vaccinationProfile || null;
      case 'CHICKS SOLD': return cycle.chicksSold || null;
      case 'STATUS': return cycle.status;
      case 'CREATED BY': return cycle.createdBy || null;
      case 'CREATED AT': return cycle.createdAt || null;
      case 'UPDATED BY': return cycle.updatedBy || null;
      case 'UPDATED AT': return cycle.updatedAt || null;
      default: return null;
    }
  };

  // Helper function to safely convert cell value to string for filtering
  const cellValueToString = (value: string | number | null): string => {
    if (value == null) return '';
    return String(value);
  };

  // Process data with sorting and filtering
  const processedCycles = React.useMemo(() => {
    let filtered = cycles;

    // Apply filters
    Object.keys(filters).forEach((column) => {
      const value = filters[column];
      if (value) {
        filtered = filtered.filter(cycle => {
          const cellValue = getCellValue(cycle, column);
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
  }, [cycles, filters, sortColumn, sortDirection]);

  // Fetch hatch cycles from Supabase (from the new hatch_cycles table)
  useEffect(() => {
    const fetchHatchCycles = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('hatch_cycles') // <<< new table with proper structure
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching hatch cycles:', error);
          setError('Failed to fetch hatch cycles. Please check your connection.');
          setCycles([]); // Don't fall back to mock data
        } else {
          const mapped = (data ?? []).map(mapTableRowToCycle);
          setCycles(mapped);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred.');
        setCycles([]); // Don't fall back to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchHatchCycles();
  }, []);

  // Fetch flocks data for suggestions
  useEffect(() => {
    const fetchFlocks = async () => {
      try {
        const { data, error } = await supabase
          .from('flocks')
          .select('flock_number, supplier')
          .order('flock_number');

        if (error) {
          console.error('Error fetching flocks:', error);
        } else {
          setFlocks(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching flocks:', err);
      }
    };

    fetchFlocks();
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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
    setNewCycleData((prev) => ({
            ...prev,
      [name]: isNumber ? (value === '' ? undefined : Number(value)) : value,
        }));
    };
    
  const handleNestedChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    parentKey: 'candling' | 'outcome'
  ) => {
        const { name, value } = e.target;
    setNewCycleData((prev) => ({
            ...prev,
            [parentKey]: {
                ...(prev[parentKey] as object),
                [name]: value === '' ? undefined : Number(value),
      },
    }));
  };

  // Handle supplier flock number change and auto-fill supplier name
  const handleSupplierFlockNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const flockNumber = e.target.value.trim();
    
    // Update the form data
    setNewCycleData((prev) => ({
      ...prev,
      supplierFlockNumber: flockNumber,
    }));

    // Show suggestions based on input
    if (flockNumber.length > 0) {
      const filtered = flocks.filter(flock => 
        flock.flock_number.toLowerCase().includes(flockNumber.toLowerCase())
      );
      setFlockSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFlockSuggestions([]);
      setShowSuggestions(false);
    }

    // If flock number is provided, fetch supplier name
    if (flockNumber) {
      try {
        const { data, error } = await supabase
          .from('flocks')
          .select('supplier')
          .eq('flock_number', flockNumber)
          .single();

        if (error) {
          console.log('No flock found for number:', flockNumber);
          setNewCycleData((prev) => ({
            ...prev,
            supplierName: '',
          }));
        } else {
          setNewCycleData((prev) => ({
            ...prev,
            supplierName: data.supplier,
          }));
        }
      } catch (err) {
        console.error('Error fetching supplier:', err);
        setNewCycleData((prev) => ({
          ...prev,
          supplierName: '',
        }));
      }
    } else {
      setNewCycleData((prev) => ({
        ...prev,
        supplierName: '',
      }));
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (flock: any) => {
    setNewCycleData((prev) => ({
      ...prev,
      supplierFlockNumber: flock.flock_number,
      supplierName: flock.supplier,
    }));
    setShowSuggestions(false);
  };

  // Handle add new flock
  const handleAddNewFlock = async (flockData: Partial<Flock>) => {
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error creating flock:', error);
        alert('Failed to add flock: ' + error.message);
        return;
      }

      if (data) {
        // Update flocks list
        setFlocks(prev => [...prev, data]);
        
        // Update form data
        setNewCycleData((prev) => ({
          ...prev,
          supplierFlockNumber: data.flock_number,
          supplierName: data.supplier,
        }));
        
        alert('Flock added successfully!');
      }
    } catch (err) {
      console.error('Unexpected error adding flock:', err);
      alert('An unexpected error occurred.');
    }
  };

  const handleAddNewCycle = async (e: React.FormEvent) => {
        e.preventDefault();
    try {
      const nextIndex = cycles.length + 1;
      const hatchNo =
        newCycleData.hatchNo ||
        `2025-${String(13 + nextIndex).padStart(3, '0')}-BFL`;

        const newCycle: HatchCycle = {
        id: hatchNo, // use hatchNo as stable id (base table has no id)
        hatchNo,
            ...newCycleData,
        eggsSet: newCycleData.eggsSet ?? 0,
        setDate:
          newCycleData.setDate || new Date().toISOString().split('T')[0],
            status: newCycleData.status || 'OPEN',
            candling: newCycleData.candling || {},
            outcome: newCycleData.outcome || {},
        createdBy: 'clerk-01', // mock user (not stored in DB)
            createdAt: new Date().toISOString(),
        };

      // Insert into base table with QUOTED column names
      const payload = toBaseTablePayload(newCycle);
      const { error } = await supabase.from('hatch_cycles').insert([payload]);

      if (error) {
        console.error('Error saving hatch cycle:', error);
        setError('Failed to save hatch cycle. Please try again.');
        return;
      }

      // Read back from the table to get normalized fields
      const { data: trow, error: tErr } = await supabase
        .from('hatch_cycles')
        .select('*')
        .eq('hatch_no', hatchNo)
        .single();

      if (tErr || !trow) {
        // Fall back to local object if table fetch fails
        setCycles((prev) => [newCycle, ...prev]);
      } else {
        setCycles((prev) => [mapTableRowToCycle(trow), ...prev]);
      }

        setIsNewCycleModalVisible(false);
        setNewCycleData({ status: 'OPEN', candling: {}, outcome: {} });
      setError(null);
    } catch (err) {
      console.error('Unexpected error saving:', err);
      setError('An unexpected error occurred while saving.');
    }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="heading-primary">Listing of Hatchery Cycles</h1>
                 <button 
                    onClick={() => setIsNewCycleModalVisible(true)}
                    className="btn-primary px-6 py-3"
                >
                    <span>+</span> Add Hatch Cycle
                 </button>
            </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg text-[#AAAAAA]">Loading hatch cycles...</div>
        </div>
      ) : (
            <div className="modern-card p-6">
                <div className="p-4 bg-white rounded-lg">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end mb-4">
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                  <label htmlFor="hatch-start" className="block text-sm font-medium text-gray-700">
                    Hatch Start
                  </label>
                  <input
                    id="hatch-start"
                    type="date"
                    className="mt-1 block w-full dark-input"
                    defaultValue="2025-09-08"
                  />
                            </div>
                            <div>
                  <label htmlFor="hatch-end" className="block text-sm font-medium text-gray-700">
                    End
                  </label>
                  <input
                    id="hatch-end"
                    type="date"
                    className="mt-1 block w-full dark-input"
                    defaultValue="2025-11-07"
                  />
                            </div>
                        </div>
                         <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                            <select id="status-filter" className="mt-1 block w-full dark-select">
                                <option>OPEN</option>
                                <option>CLOSED</option>
                                <option>ALL</option>
                            </select>
                        </div>
                    </div>
                    {/* Search and Actions */}
                    <div className="flex items-center space-x-2">
                         <div className="flex-grow flex items-center dark-input">
                            <span className="pl-1 text-gray-400">
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
                            </span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full p-0 pl-2 bg-transparent border-none focus:ring-0 text-white"
                />
                         </div>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">
                Go
              </button>
                        <select className="dark-select">
                            <option>1000</option>
                            <option>500</option>
                            <option>100</option>
                        </select>
                        <select className="dark-select">
                            <option>Actions</option>
                            <option>Export CSV</option>
                            <option>Print</option>
                        </select>
                    </div>
                </div>

          <div className="overflow-x-auto mt-6" style={{ maxHeight: '70vh' }}>
                    <table className="modern-table min-w-full">
                        <thead>
                            <tr>
                  {[
                    'HATCH NO',
                    'HATCH COLOUR',
                    'FLOCKS RECVD',
                    'SUPPLIER FLOCK NUMBER',
                    'SUPPLIER NAME',
                    'CASES RECVD',
                    'EGGS RECVD',
                    'AVG EGG WGT',
                    'EGGS CRACKED',
                    'EGGS SET',
                    'DATE PACKED',
                    'DATE SET',
                    'DATE CANDLED',
                    'EXP HATCH QTY',
                    'PCT ADJ',
                    'EXP HATCH QTY ADJ',
                    'HATCH DATE',
                    'AVG CHICKS WGT',
                    'CHICKS HATCHED',
                    'CHICKS CULLED',
                    'VACCINATION PROFILE',
                    'CHICKS SOLD',
                    'STATUS',
                    'CREATED BY',
                    'CREATED AT',
                    'UPDATED BY',
                    'UPDATED AT',
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    >
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
                {processedCycles.map((cycle) => (
                                <tr key={cycle.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#5C3A6B]">
                      {cycle.hatchNo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {colourLabel(cycle.colourCode as any)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.flocksRecd?.join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.supplierFlockNumber || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.supplierName || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.casesRecd?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.eggsRecd?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.avgEggWgt ?? '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.eggsCracked?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <HighlightedCell>{(cycle.eggsSet ?? 0).toLocaleString()}</HighlightedCell>
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">{cycle.datePacked || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{cycle.setDate}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{cycle.dateCandled || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.expHatchQty?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {typeof cycle.pctAdj === 'number' ? `${cycle.pctAdj}%` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <HighlightedCell>
                        {cycle.expHatchQtyAdj?.toLocaleString() || '-'}
                      </HighlightedCell>
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">{cycle.hatchDate || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{cycle.avgChicksWgt ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <HighlightedCell>
                        {cycle.outcome.hatched?.toLocaleString() || '-'}
                      </HighlightedCell>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.outcome.culled?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.vaccinationProfile || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <HighlightedCell>
                        {cycle.chicksSold?.toLocaleString() || '-'}
                      </HighlightedCell>
                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {cycle.status === 'OPEN' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Open
                        </span>
                                        ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Closed
                        </span>
                                        )}
                                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.createdBy || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.updatedBy || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cycle.updatedAt ? new Date(cycle.updatedAt).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
      )}

             {/* New Hatch Cycle Modal */}
            {isNewCycleModalVisible && (
                <div className="modern-modal fixed inset-0 flex items-center justify-center z-50">
                    <div className="modern-modal-content p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6 border-b border-[#F5F0EE] pb-4">
                            <h3 className="heading-tertiary text-[#333333]">Add New Hatchery Cycle</h3>
              <button
                onClick={() => setIsNewCycleModalVisible(false)}
                className="text-[#AAAAAA] hover:text-[#333333] text-2xl transition-colors"
              >
                &times;
              </button>
                        </div>
                        <form onSubmit={handleAddNewCycle} className="flex-grow overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                                {/* Auto-generated fields shown for info */}
                                <div className="lg:col-span-2">
                                    <label className="block font-semibold text-[#333333] mb-2">Hatch No (Auto-generated)</label>
                  <input
                    type="text"
                    value={`2025-${String(13 + cycles.length + 1).padStart(3, '0')}-BFL`}
                    className="modern-input w-full bg-[#F5F0EE]"
                    readOnly
                  />
                                </div>
                                <div>
                                    <label className="block font-semibold text-[#333333] mb-2">Hatch Colour</label>
                  <select
                    name="colourCode"
                    onChange={handleFormChange}
                    className="modern-select w-full"
                  >
                                        <option value="">Select Colour</option>
                    {Object.values(HatchColourCode).map((c) => (
                      <option key={c} value={c}>
                        {colourLabel(c)}
                      </option>
                    ))}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={newCycleData.status}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  >
                                        <option value="OPEN">Open</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Reception */}
                <div>
                  <label className="block font-bold text-gray-700">Flocks Rec'd (comma-sep)</label>
                  <input
                    type="text"
                    name="flocksRecd"
                    onChange={(e) =>
                      setNewCycleData((p) => ({
                        ...p,
                        flocksRecd: e.target.value.split(',').map((f) => f.trim()),
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700">Supplier Flock Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="supplierFlockNumber"
                      value={newCycleData.supplierFlockNumber || ''}
                      onChange={handleSupplierFlockNumberChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      placeholder="Enter flock number"
                    />
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && flockSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {flockSuggestions.map((flock, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                            onClick={() => handleSuggestionSelect(flock)}
                          >
                            <div className="font-medium text-gray-900">{flock.flock_number}</div>
                            <div className="text-sm text-gray-500">{flock.supplier}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add New Flock Button */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddFlockModalVisible(true)}
                        className="btn-green px-4 py-2 text-sm"
                      >
                        + Add New Flock
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700">Supplier Name</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={newCycleData.supplierName || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    placeholder="Auto-filled from flock number"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Cases Rec'd</label>
                  <input
                    type="number"
                    name="casesRecd"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Eggs Rec'd</label>
                  <input
                    type="number"
                    name="eggsRecd"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Avg Egg Wgt</label>
                  <input
                    type="number"
                    step="0.1"
                    name="avgEggWgt"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Eggs Cracked</label>
                  <input
                    type="number"
                    name="eggsCracked"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Setting */}
                <div>
                  <label className="block font-bold text-gray-700">Eggs Set</label>
                  <input
                    type="number"
                    name="eggsSet"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Date Packed</label>
                  <input
                    type="date"
                    name="datePacked"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Date Set</label>
                  <input
                    type="date"
                    name="setDate"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Candling */}
                <div>
                  <label className="block font-medium text-gray-700">Date Candled</label>
                  <input
                    type="date"
                    name="dateCandled"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Expectation */}
                <div>
                  <label className="block font-medium text-gray-700">Exp Hatch Qty</label>
                  <input
                    type="number"
                    name="expHatchQty"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Pct Adj</label>
                  <input
                    type="number"
                    step="0.1"
                    name="pctAdj"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Exp Hatch Qty Adj</label>
                  <input
                    type="number"
                    name="expHatchQtyAdj"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Outcome */}
                <div>
                  <label className="block font-medium text-gray-700">Date Hatched</label>
                  <input
                    type="date"
                    name="hatchDate"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Avg Chicks Wgt</label>
                  <input
                    type="number"
                    step="0.1"
                    name="avgChicksWgt"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700">Chicks Hatched</label>
                  <input
                    type="number"
                    name="hatched"
                    onChange={(e) => handleNestedChange(e, 'outcome')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Chicks Culled</label>
                  <input
                    type="number"
                    name="culled"
                    onChange={(e) => handleNestedChange(e, 'outcome')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Vaccination Profile</label>
                  <input
                    type="text"
                    name="vaccinationProfile"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Chicks Sold</label>
                  <input
                    type="number"
                    name="chicksSold"
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewCycleModalVisible(false)}
                  className="btn-secondary px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-3"
                >
                  Save Cycle
                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

      {/* Add New Flock Modal */}
      <AddFlockForm
        isVisible={isAddFlockModalVisible}
        onClose={() => {
          setIsAddFlockModalVisible(false);
          setShowSuggestions(false);
        }}
        onSave={handleAddNewFlock}
        breeds={breeds}
      />
        </div>
    );
};

export default HatchCycleList;
