import React, { useState, useEffect, useRef } from 'react';
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

// Custom CSS for sticky columns
const stickyColumnStyles = `
  .sticky-column-1 {
    position: sticky !important;
    left: 0px !important;
    background-color: white !important;
    z-index: 10 !important;
  }
  
  .sticky-column-2 {
    position: sticky !important;
    left: 120px !important;
    background-color: white !important;
    z-index: 10 !important;
  }
  
  .sticky-header-1 {
    position: sticky !important;
    left: 0px !important;
    background-color: white !important;
    z-index: 20 !important;
  }
  
  .sticky-header-2 {
    position: sticky !important;
    left: 120px !important;
    background-color: white !important;
    z-index: 20 !important;
  }
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = stickyColumnStyles;
  document.head.appendChild(styleSheet);
}

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
    // Note: These columns don't exist in current table, so we'll use undefined
    clears: undefined, // r.candling_clears ?? undefined,
    earlyDead: undefined, // r.candling_early_dead ?? undefined,
  },
  expHatchQty: r.exp_hatch_qty ?? undefined,
  pctAdj: undefined, // r.pct_adj ?? undefined,
  expHatchQtyAdj: undefined, // r.exp_hatch_qty_adj ?? undefined,
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
  hatch_colour: c.colourCode ?? null, // Store full format (1-BLUE, 2-ORANGE, etc.)
  flocks_recvd: (c.flocksRecd ?? []).join(', '),
  supplier_flock_number: c.supplierFlockNumber ?? null,
  supplier_name: c.supplierName ?? null,
  cases_recvd: c.casesRecd ?? null,
  eggs_recvd: c.eggsRecd ?? null, // Auto-calculated (cases recd × 360)
  avg_egg_wgt: c.avgEggWgt ?? null,
  eggs_cracked: c.eggsCracked ?? null, // Auto-calculated (eggs recd - eggs set)
  eggs_set: c.eggsSet ?? 0,
  date_packed: c.datePacked ?? null,
  date_set: c.setDate ?? null,
  date_candled: c.dateCandled ?? null,
  // Note: candling_clears and candling_early_dead columns don't exist in current table
  exp_hatch_qty: c.expHatchQty ?? null, // Auto-calculated (eggs set × 0.8)
  pct_adj: c.pctAdj ?? null, // Submitted as blank
  exp_hatch_qty_adj: c.expHatchQtyAdj ?? null, // Submitted as blank
  hatch_date: c.hatchDate ?? null,
  avg_chicks_wgt: c.avgChicksWgt ?? null,
  chicks_hatched: c.outcome?.hatched ?? null,
  chicks_culled: c.outcome?.culled ?? null, // Auto-calculated (chicks hatched - chicks sold)
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
  
  // Editable cell state
  const [editableCell, setEditableCell] = useState<{cycleId: string, column: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Scroll synchronization refs
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  
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

  // Helper function to determine cell background color based on column
  const getCellBackgroundColor = (column: string, isHovered: boolean = false) => {
    const yellowBackgroundFields = [
      'HATCH NO', 'HATCH COLOUR', 'FLOCKS RECVD', 'SUPPLIER FLOCK NUMBER', 
      'SUPPLIER NAME', 'CASES RECVD', 'EGGS RECVD', 'AVG EGG WGT', 
      'EGGS CRACKED', 'EGGS SET', 'DATE PACKED', 'DATE SET', 'DATE CANDLED', 
      'EXP HATCH QTY', 'PCT ADJ', 'EXP HATCH QTY ADJ'
    ];
    
    if (yellowBackgroundFields.includes(column)) {
      return isHovered ? '#fff3c2' : '#ffeb99';
    } else {
      return isHovered ? '#e3f3e7' : 'white';
    }
  };

  // Cell editing functions
  const handleCellClick = (cycleId: string, column: string, currentValue: any) => {
    // Save any existing edit before starting a new one (only if it's a different cell)
    if (editableCell && (editableCell.cycleId !== cycleId || editableCell.column !== column)) {
      saveCellEdit(editableCell.cycleId, editableCell.column);
    }
    setEditableCell({ cycleId, column });
    setEditingValue(currentValue?.toString() || '');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, cycleId: string, column: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCellEditAndNavigate(cycleId, column);
    } else if (e.key === 'Escape') {
      cancelCellEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCellEditAndNavigate(cycleId, column);
    }
  };

  const saveCellEditAndNavigate = async (currentCycleId: string, currentColumn: string) => {
    try {
      console.log('Saving and navigating from:', { currentCycleId, currentColumn, editingValue });
      
      // Save current edit first
      await saveCellEdit(currentCycleId, currentColumn, false);
      
      const columns = [
        'HATCH NO', 'HATCH COLOUR', 'FLOCKS RECVD', 'SUPPLIER FLOCK NUMBER', 
        'SUPPLIER NAME', 'CASES RECVD', 'EGGS RECVD', 'AVG EGG WGT', 
        'EGGS CRACKED', 'EGGS SET', 'DATE PACKED', 'DATE SET', 'DATE CANDLED', 
        'EXP HATCH QTY', 'PCT ADJ', 'EXP HATCH QTY ADJ', 'HATCH DATE', 
        'AVG CHICKS WGT', 'CHICKS HATCHED', 'CHICKS CULLED', 'VACCINATION PROFILE', 
        'CHICKS SOLD', 'STATUS', 'CREATED BY', 'CREATED AT', 'UPDATED BY', 'UPDATED AT'
      ];
      
      // Non-editable fields that should be skipped
      const nonEditableFields = [
        'HATCH NO', 'EGGS RECVD', 'EGGS CRACKED', 'EXP HATCH QTY', 'CHICKS CULLED',
        'CREATED BY', 'CREATED AT', 'UPDATED BY', 'UPDATED AT'
      ];
      
      const currentIndex = columns.indexOf(currentColumn);
      let nextIndex = currentIndex + 1;
      
      // Find next editable column
      while (nextIndex < columns.length && nonEditableFields.includes(columns[nextIndex])) {
        nextIndex++;
      }
      
      if (nextIndex < columns.length) {
        const nextColumn = columns[nextIndex];
        console.log('Navigating to next column:', nextColumn);
        
        // Use setTimeout to ensure state has been updated
        setTimeout(() => {
          const currentCycle = cycles.find(c => c.id === currentCycleId);
          const nextValue = getCellValue(currentCycle!, nextColumn);
          console.log('Setting next cell value:', nextValue);
          setEditableCell({ cycleId: currentCycleId, column: nextColumn });
          setEditingValue(nextValue?.toString() || '');
        }, 50);
      }
    } catch (error) {
      console.error('Error in saveCellEditAndNavigate:', error);
    }
  };

  const navigateToNextCell = (currentCycleId: string, currentColumn: string) => {
    // Save current edit first
    saveCellEdit(currentCycleId, currentColumn);
    
    const columns = [
      'HATCH NO', 'HATCH COLOUR', 'FLOCKS RECVD', 'SUPPLIER FLOCK NUMBER', 
      'SUPPLIER NAME', 'CASES RECVD', 'EGGS RECVD', 'AVG EGG WGT', 
      'EGGS CRACKED', 'EGGS SET', 'DATE PACKED', 'DATE SET', 'DATE CANDLED', 
      'EXP HATCH QTY', 'PCT ADJ', 'EXP HATCH QTY ADJ', 'HATCH DATE', 
      'AVG CHICKS WGT', 'CHICKS HATCHED', 'CHICKS CULLED', 'VACCINATION PROFILE', 
      'CHICKS SOLD', 'STATUS', 'CREATED BY', 'CREATED AT', 'UPDATED BY', 'UPDATED AT'
    ];
    
    // Non-editable fields that should be skipped
    const nonEditableFields = [
      'HATCH NO', 'EGGS RECVD', 'EGGS CRACKED', 'EXP HATCH QTY', 'CHICKS CULLED',
      'CREATED BY', 'CREATED AT', 'UPDATED BY', 'UPDATED AT'
    ];
    
    const currentIndex = columns.indexOf(currentColumn);
    let nextIndex = currentIndex + 1;
    
    // Find next editable column
    while (nextIndex < columns.length && nonEditableFields.includes(columns[nextIndex])) {
      nextIndex++;
    }
    
    if (nextIndex < columns.length) {
      const nextColumn = columns[nextIndex];
      const currentCycle = cycles.find(c => c.id === currentCycleId);
      const nextValue = getCellValue(currentCycle!, nextColumn);
      setEditableCell({ cycleId: currentCycleId, column: nextColumn });
      setEditingValue(nextValue?.toString() || '');
    }
  };

  const saveCellEdit = async (cycleId: string, column: string, clearEditingState: boolean = true) => {
    try {
      console.log('Saving cell edit:', { cycleId, column, editingValue });
      const cycle = cycles.find(c => c.id === cycleId);
      if (!cycle) {
        console.log('Cycle not found:', cycleId);
        return;
      }

      // Map column names to database field names
      const columnToFieldMap: { [key: string]: string } = {
        'HATCH NO': 'hatch_no',
        'HATCH COLOUR': 'hatch_colour',
        'FLOCKS RECVD': 'flocks_recvd',
        'SUPPLIER FLOCK NUMBER': 'supplier_flock_number',
        'SUPPLIER NAME': 'supplier_name',
        'CASES RECVD': 'cases_recvd',
        'EGGS RECVD': 'eggs_recvd',
        'AVG EGG WGT': 'avg_egg_wgt',
        'EGGS CRACKED': 'eggs_cracked',
        'EGGS SET': 'eggs_set',
        'DATE PACKED': 'date_packed',
        'DATE SET': 'date_set',
        'DATE CANDLED': 'date_candled',
        'EXP HATCH QTY': 'exp_hatch_qty',
        'PCT ADJ': 'pct_adj',
        'EXP HATCH QTY ADJ': 'exp_hatch_qty_adj',
        'HATCH DATE': 'hatch_date',
        'AVG CHICKS WGT': 'avg_chicks_wgt',
        'CHICKS HATCHED': 'chicks_hatched',
        'CHICKS CULLED': 'chicks_culled',
        'VACCINATION PROFILE': 'vaccination_profile',
        'CHICKS SOLD': 'chicks_sold',
        'STATUS': 'status'
      };

      const fieldName = columnToFieldMap[column];
      if (!fieldName) {
        console.log('Field name not found for column:', column);
        return;
      }

      // Convert value based on column type
      let convertedValue: any = editingValue;
      if (column.includes('DATE')) {
        convertedValue = editingValue || null;
      } else if (column.includes('WGT') || column.includes('ADJ') || column.includes('QTY') || column.includes('SET') || column.includes('CRACKED') || column.includes('RECVD') || column.includes('HATCHED') || column.includes('CULLED') || column.includes('SOLD')) {
        convertedValue = editingValue ? parseFloat(editingValue) : null;
      } else if (column === 'FLOCKS RECVD') {
        convertedValue = editingValue ? editingValue.split(',').map((f: string) => f.trim()).join(',') : null;
      }
      
      console.log('Field mapping:', { column, fieldName, convertedValue });

      // Special handling for CASES RECVD - also update EGGS RECVD
      let updateData: any = { [fieldName]: convertedValue };
      
      if (column === 'CASES RECVD' && convertedValue) {
        const eggsRecd = convertedValue * 360;
        updateData.eggs_recvd = eggsRecd;
      }

      // Special handling for EGGS SET - also update EGGS CRACKED
      if (column === 'EGGS SET' && convertedValue !== null) {
        // Get the current eggs received value for this cycle
        const currentCycle = cycles.find(c => c.id === cycleId);
        if (currentCycle?.eggsRecd) {
          const eggsCracked = currentCycle.eggsRecd - convertedValue;
          updateData.eggs_cracked = eggsCracked;
          console.log('Auto-calculated eggs cracked:', eggsCracked);
        }
      }

      // Special handling for PCT ADJ - validate range (0-100) and calculate EXP HATCH QTY ADJ
      if (column === 'PCT ADJ' && convertedValue !== null) {
        // Validate PCT ADJ is between 0 and 100
        if (convertedValue < 0 || convertedValue > 100) {
          setError('PCT ADJ must be between 0 and 100');
          return;
        }
        
        // Get the current eggs set value for this cycle
        const currentCycle = cycles.find(c => c.id === cycleId);
        if (currentCycle?.eggsSet) {
          const expHatchQtyAdj = (convertedValue / 100) * currentCycle.eggsSet;
          updateData.exp_hatch_qty_adj = Math.round(expHatchQtyAdj);
          console.log('Auto-calculated EXP HATCH QTY ADJ:', Math.round(expHatchQtyAdj));
        }
      }

      // Special handling for SUPPLIER FLOCK NUMBER - also update SUPPLIER NAME
      let supplierName: string | null = null;
      if (column === 'SUPPLIER FLOCK NUMBER' && convertedValue) {
        try {
          const { data: flockData, error: flockError } = await supabase
            .from('flocks')
            .select('supplier')
            .eq('flock_number', convertedValue)
            .single();

          if (!flockError && flockData) {
            supplierName = flockData.supplier;
            updateData.supplier_name = supplierName;
            console.log('Auto-updated supplier name:', supplierName);
          } else {
            console.log('No flock found for number:', convertedValue);
            updateData.supplier_name = null;
          }
        } catch (err) {
          console.error('Error fetching supplier for flock number:', err);
          updateData.supplier_name = null;
        }
      }

      // Update in Supabase
      console.log('Updating Supabase with:', updateData);
      const { error } = await supabase
        .from('hatch_cycles')
        .update(updateData)
        .eq('id', cycleId);

      if (error) {
        console.error('Error updating cell:', error);
        setError('Failed to update cell. Please try again.');
        return;
      }
      
      console.log('Supabase update successful');

      // Map database field names to TypeScript interface field names
      const dbToInterfaceMap: { [key: string]: string } = {
        'hatch_no': 'hatchNo',
        'hatch_colour': 'colourCode',
        'flocks_recvd': 'flocksRecd',
        'supplier_flock_number': 'supplierFlockNumber',
        'supplier_name': 'supplierName',
        'cases_recvd': 'casesRecd',
        'eggs_recvd': 'eggsRecd',
        'avg_egg_wgt': 'avgEggWgt',
        'eggs_cracked': 'eggsCracked',
        'eggs_set': 'eggsSet',
        'date_packed': 'datePacked',
        'date_set': 'setDate',
        'date_candled': 'dateCandled',
        'exp_hatch_qty': 'expHatchQty',
        'pct_adj': 'pctAdj',
        'exp_hatch_qty_adj': 'expHatchQtyAdj',
        'hatch_date': 'hatchDate',
        'avg_chicks_wgt': 'avgChicksWgt',
        'chicks_hatched': 'outcome.hatched',
        'chicks_culled': 'outcome.culled',
        'vaccination_profile': 'vaccinationProfile',
        'chicks_sold': 'chicksSold',
        'status': 'status'
      };

      const interfaceFieldName = dbToInterfaceMap[fieldName];
      if (!interfaceFieldName) return;

      // Update local state with proper field mapping
      console.log('Updating local state with interface field:', interfaceFieldName);
      setCycles(prev => prev.map(c => {
        if (c.id === cycleId) {
          let updatedCycle = { ...c };
          
          // Handle nested fields like outcome.hatched
          if (interfaceFieldName.includes('.')) {
            const [parentField, childField] = interfaceFieldName.split('.');
            updatedCycle = {
              ...updatedCycle,
              [parentField]: {
                ...updatedCycle[parentField as keyof HatchCycle],
                [childField]: convertedValue
              }
            };
          } else {
            updatedCycle = { ...updatedCycle, [interfaceFieldName]: convertedValue };
          }
          
          // Special handling for CASES RECVD - also update EGGS RECVD in local state
          if (column === 'CASES RECVD' && convertedValue) {
            const eggsRecd = convertedValue * 360;
            updatedCycle.eggsRecd = eggsRecd;
            console.log('Updated EGGS RECVD in local state:', eggsRecd);
          }
          
          // Special handling for EGGS SET - also update EGGS CRACKED in local state
          if (column === 'EGGS SET' && convertedValue !== null) {
            if (updatedCycle.eggsRecd) {
              const eggsCracked = updatedCycle.eggsRecd - convertedValue;
              updatedCycle.eggsCracked = eggsCracked;
              console.log('Updated EGGS CRACKED in local state:', eggsCracked);
            }
          }
          
          // Special handling for PCT ADJ - also update EXP HATCH QTY ADJ in local state
          if (column === 'PCT ADJ' && convertedValue !== null) {
            if (updatedCycle.eggsSet) {
              const expHatchQtyAdj = (convertedValue / 100) * updatedCycle.eggsSet;
              updatedCycle.expHatchQtyAdj = Math.round(expHatchQtyAdj);
              console.log('Updated EXP HATCH QTY ADJ in local state:', Math.round(expHatchQtyAdj));
            }
          }
          
          // Special handling for SUPPLIER FLOCK NUMBER - also update SUPPLIER NAME in local state
          if (column === 'SUPPLIER FLOCK NUMBER' && convertedValue) {
            updatedCycle.supplierName = supplierName || undefined;
            console.log('Updated SUPPLIER NAME in local state:', supplierName);
          }
          
          console.log('Updated cycle in local state:', updatedCycle);
          return updatedCycle;
        }
        return c;
      }));

      if (clearEditingState) {
        setEditableCell(null);
        setEditingValue('');
      }
      console.log('Cell edit completed successfully');
    } catch (err) {
      console.error('Unexpected error updating cell:', err);
      setError('An unexpected error occurred while updating the cell.');
    }
  };

  const cancelCellEdit = () => {
    setEditableCell(null);
    setEditingValue('');
  };

  // Scroll synchronization functions
  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Helper function to render editable cell content
  const renderEditableCell = (cycle: HatchCycle, column: string, value: any, cellClass: string) => {
    const isEditing = editableCell?.cycleId === cycle.id && editableCell?.column === column;
    
    // Non-editable fields (auto-calculated or system fields)
    const nonEditableFields = [
      'HATCH NO',           // System field
      'SUPPLIER NAME',      // Auto-calculated: Derived from SUPPLIER FLOCK NUMBER
      'EGGS RECVD',         // Auto-calculated: Cases Recvd × 360
      'EGGS CRACKED',       // Auto-calculated: Eggs Rec'd - Eggs Set
      'EXP HATCH QTY',      // Auto-calculated: Eggs Set × 0.8
      'EXP HATCH QTY ADJ',  // Auto-calculated: (PCT ADJ/100) × Eggs Set
      'CHICKS CULLED',      // Auto-calculated: Chicks Hatched - Chicks Sold
      'CREATED BY',         // System field
      'CREATED AT',         // System field
      'UPDATED BY',         // System field
      'UPDATED AT'          // System field
    ];
    
    if (nonEditableFields.includes(column)) {
      return <span className="font-medium text-[#5C3A6B]">{value || '-'}</span>;
    }
    
    if (isEditing) {
      // Hatch Color dropdown
      if (column === 'HATCH COLOUR') {
        return (
          <select
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, cycle.id, column)}
            onBlur={() => saveCellEdit(cycle.id, column)}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            <option value="">Select Color</option>
            <option value="1-BLUE">1-BLUE</option>
            <option value="2-ORANGE">2-ORANGE</option>
            <option value="3-GREEN">3-GREEN</option>
            <option value="4-WHITE">4-WHITE</option>
            <option value="5-YELLOW">5-YELLOW</option>
            <option value="6-RED">6-RED</option>
          </select>
        );
      }
      
      // Flock Number dropdown (if we have flock suggestions)
      if (column === 'SUPPLIER FLOCK NUMBER') {
        return (
          <select
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, cycle.id, column)}
            onBlur={() => saveCellEdit(cycle.id, column)}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            <option value="">Select Flock</option>
            {flocks.map((flock) => (
              <option key={flock.id} value={flock.flock_number}>
                {flock.flock_number}
              </option>
            ))}
          </select>
        );
      }
      
      // Date fields
      if (column.includes('DATE')) {
        return (
          <input
            type="date"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, cycle.id, column)}
            onBlur={() => saveCellEdit(cycle.id, column)}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }
      
      // Number fields
      if (column.includes('WGT') || column.includes('ADJ') || column.includes('QTY') || column.includes('SET') || column.includes('CRACKED') || column.includes('RECVD') || column.includes('HATCHED') || column.includes('CULLED') || column.includes('SOLD')) {
        return (
          <input
            type="number"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, cycle.id, column)}
            onBlur={() => saveCellEdit(cycle.id, column)}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }
      
      // Text fields
      return (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={(e) => handleCellKeyDown(e, cycle.id, column)}
          onBlur={() => saveCellEdit(cycle.id, column)}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }
    
    return (
      <span 
        className="cursor-pointer hover:bg-blue-100 px-1 py-1 rounded"
        onClick={() => handleCellClick(cycle.id, column, value)}
      >
        {value || '-'}
      </span>
    );
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

  const handleCloseCycle = async (cycleId: string) => {
    try {
      console.log('Attempting to close cycle with ID:', cycleId);
      
      // Update the cycle status to CLOSED in Supabase
      const { error } = await supabase
        .from('hatch_cycles')
        .update({ status: 'CLOSED' })
        .eq('id', cycleId);

      if (error) {
        console.error('Error closing cycle:', error);
        setError('Failed to close cycle. Please try again.');
        return;
      }

      console.log('Successfully closed cycle in Supabase');

      // Update local state
      setCycles(prev => prev.map(cycle => 
        cycle.id === cycleId 
          ? { ...cycle, status: 'CLOSED' as const }
          : cycle
      ));
    } catch (err) {
      console.error('Unexpected error closing cycle:', err);
      setError('An unexpected error occurred while closing the cycle.');
    }
  };

  const handleReopenCycle = async (cycleId: string) => {
    try {
      console.log('Attempting to reopen cycle with ID:', cycleId);
      
      // Update the cycle status to OPEN in Supabase
      const { error } = await supabase
        .from('hatch_cycles')
        .update({ status: 'OPEN' })
        .eq('id', cycleId);

      if (error) {
        console.error('Error reopening cycle:', error);
        setError('Failed to reopen cycle. Please try again.');
        return;
      }

      console.log('Successfully reopened cycle in Supabase');

      // Update local state
      setCycles(prev => prev.map(cycle => 
        cycle.id === cycleId 
          ? { ...cycle, status: 'OPEN' as const }
          : cycle
      ));
    } catch (err) {
      console.error('Unexpected error reopening cycle:', err);
      setError('An unexpected error occurred while reopening the cycle.');
    }
  };

  const handleAddNewCycle = async (e: React.FormEvent) => {
        e.preventDefault();
    try {
      const nextIndex = cycles.length + 1;
      const hatchNo =
        newCycleData.hatchNo ||
        `2025-${String(13 + nextIndex).padStart(3, '0')}-BFL`;

        // Calculate auto-filled values
        const casesRecd = newCycleData.casesRecd ?? 0;
        const eggsRecd = casesRecd * 360; // Auto-calculate eggs recd
        const eggsSet = newCycleData.eggsSet ?? 0;
        const eggsCracked = eggsRecd - eggsSet; // Auto-calculate eggs cracked
        const expHatchQty = Math.round(eggsSet * 0.8); // Auto-calculate exp hatch qty (80% of eggs set)
        const chicksHatched = 0; // Submitted as blank
        const chicksSold = newCycleData.chicksSold ?? 0;
        const chicksCulled = chicksHatched - chicksSold; // Auto-calculate chicks culled

        console.log('Auto-calculated values:', {
          casesRecd,
          eggsRecd,
          eggsSet,
          eggsCracked,
          expHatchQty,
          chicksHatched,
          chicksSold,
          chicksCulled
        });

        const newCycle: HatchCycle = {
        id: hatchNo, // use hatchNo as stable id (base table has no id)
        hatchNo,
            ...newCycleData,
        eggsRecd, // Auto-calculated
        eggsCracked, // Auto-calculated
        eggsSet: eggsSet,
        expHatchQty, // Auto-calculated
        hatchDate: undefined, // Submitted as blank
        avgChicksWgt: undefined, // Submitted as blank
        vaccinationProfile: undefined, // Submitted as blank
        pctAdj: undefined, // Submitted as blank
        expHatchQtyAdj: undefined, // Submitted as blank
        setDate:
          newCycleData.setDate || new Date().toISOString().split('T')[0],
            status: 'OPEN', // Always OPEN for new entries
            candling: newCycleData.candling || {},
            outcome: {
              hatched: chicksHatched, // Submitted as blank
              culled: chicksCulled, // Auto-calculated
            },
        createdBy: 'clerk-01', // mock user (not stored in DB)
            createdAt: new Date().toISOString(),
        };

      // Insert into base table with QUOTED column names
      const payload = toBaseTablePayload(newCycle);
      console.log('Payload being sent to Supabase:', payload);
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

          <div className="mt-6" style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {/* Fixed Header */}
            <div 
              ref={headerScrollRef}
              className="overflow-x-auto" 
              style={{ flexShrink: 0 }}
              onScroll={handleHeaderScroll}
            >
              <table className="modern-table min-w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                  {[
                    'STATUS',
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
                    'CREATED BY',
                    'CREATED AT',
                    'UPDATED BY',
                    'UPDATED AT',
                  ].map((header) => (
                    <th
                      key={header}
                      className={`px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        header === 'STATUS' ? 'sticky-header-1' : 
                        header === 'HATCH NO' ? 'sticky-header-2' : ''
                      }`}
                      style={{ width: '120px', minWidth: '120px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1">{header}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSort(header)}
                            className="p-1 hover:bg-gray-200 rounded text-xs"
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
                            className="p-1 hover:bg-gray-200 rounded text-xs"
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
                </table>
              </div>
            </div>
            
            {/* Scrollable Body */}
            <div 
              ref={bodyScrollRef}
              className="overflow-auto flex-1" 
              style={{ maxHeight: 'calc(70vh - 60px)', overflowX: 'auto', overflowY: 'auto' }}
              onScroll={handleBodyScroll}
            >
              <table className="modern-table min-w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
                <tbody>
                  {processedCycles.map((cycle) => (
                    <tr key={cycle.id} className="text-sm text-[#333333] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap white-cell sticky-column-1" style={{ width: '120px', minWidth: '120px' }}>
                        {cycle.status === 'OPEN' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Open
                            </span>
                            <button
                              onClick={() => handleCloseCycle(cycle.id)}
                              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                              title="Close Cycle"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Closed
                            </span>
                            <button
                              onClick={() => handleReopenCycle(cycle.id)}
                              className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                              title="Reopen Cycle"
                            >
                              ↻
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-[#5C3A6B] white-cell sticky-column-2" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'HATCH NO', cycle.hatchNo, 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'HATCH COLOUR', cycle.colourCode, 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'FLOCKS RECVD', cycle.flocksRecd?.join(', '), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'SUPPLIER FLOCK NUMBER', cycle.supplierFlockNumber, 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'SUPPLIER NAME', cycle.supplierName, 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'CASES RECVD', cycle.casesRecd?.toLocaleString(), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'EGGS RECVD', cycle.eggsRecd?.toLocaleString(), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'AVG EGG WGT', cycle.avgEggWgt, 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'EGGS CRACKED', cycle.eggsCracked?.toLocaleString(), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'EGGS SET', (cycle.eggsSet ?? 0).toLocaleString(), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>{renderEditableCell(cycle, 'DATE PACKED', cycle.datePacked, 'yellow-cell')}</td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>{renderEditableCell(cycle, 'DATE SET', cycle.setDate, 'yellow-cell')}</td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>{renderEditableCell(cycle, 'DATE CANDLED', cycle.dateCandled, 'yellow-cell')}</td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'EXP HATCH QTY', cycle.expHatchQty?.toLocaleString(), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'PCT ADJ', typeof cycle.pctAdj === 'number' ? `${cycle.pctAdj}%` : cycle.pctAdj, 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap yellow-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'EXP HATCH QTY ADJ', cycle.expHatchQtyAdj?.toLocaleString(), 'yellow-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>{renderEditableCell(cycle, 'HATCH DATE', cycle.hatchDate, 'white-cell')}</td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>{renderEditableCell(cycle, 'AVG CHICKS WGT', cycle.avgChicksWgt, 'white-cell')}</td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'CHICKS HATCHED', cycle.outcome.hatched?.toLocaleString(), 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'CHICKS CULLED', cycle.outcome.culled?.toLocaleString(), 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'VACCINATION PROFILE', cycle.vaccinationProfile, 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'CHICKS SOLD', cycle.chicksSold?.toLocaleString(), 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {cycle.status === 'OPEN' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Open
                            </span>
                            <button
                              onClick={() => handleCloseCycle(cycle.id)}
                              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                              title="Close Cycle"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Closed
                            </span>
                            <button
                              onClick={() => handleReopenCycle(cycle.id)}
                              className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                              title="Reopen Cycle"
                            >
                              &lt;
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'CREATED BY', cycle.createdBy, 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'CREATED AT', cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString() : null, 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'UPDATED BY', cycle.updatedBy, 'white-cell')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap white-cell" style={{ width: '120px', minWidth: '120px' }}>
                        {renderEditableCell(cycle, 'UPDATED AT', cycle.updatedAt ? new Date(cycle.updatedAt).toLocaleDateString() : null, 'white-cell')}
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
                    <div className="modern-modal-content p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col bg-gradient-to-r from-yellow-50 to-white rounded-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-[#F5F0EE] pb-4">
                            <h3 className="heading-tertiary text-[#333333]">New Hatch Cycle</h3>
              <button
                onClick={() => setIsNewCycleModalVisible(false)}
                className="text-[#AAAAAA] hover:text-[#333333] text-2xl transition-colors"
              >
                &times;
              </button>
                        </div>
                        <form onSubmit={handleAddNewCycle} className="flex-grow overflow-y-auto pr-2">
                            <div className="grid grid-cols-3 gap-6 text-sm">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                <div>
                                        <label className="block font-bold text-gray-700 mb-2">Hatch Colour</label>
                                        <select
                                            name="colourCode"
                                            onChange={handleFormChange}
                                            className="modern-select w-full"
                                        >
                                        <option value="">Select Colour</option>
                                            {Object.values(HatchColourCode).map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                 <div>
                                        <label className="block font-bold text-gray-700 mb-2">Cases</label>
                                        <input
                                            type="number"
                                            name="casesRecd"
                                            onChange={handleFormChange}
                                            className="modern-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Packed</label>
                                        <input
                                            type="date"
                                            name="datePacked"
                                            onChange={handleFormChange}
                                            className="modern-input w-full"
                                        />
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Flocks Received</label>
                                        <input
                                            type="text"
                                            name="flocksRecd"
                                            onChange={(e) =>
                                                setNewCycleData((p) => ({
                                                    ...p,
                                                    flocksRecd: e.target.value.split(',').map((f) => f.trim()),
                                                }))
                                            }
                                            className="modern-input w-full"
                                            placeholder="Comma separated"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Egg Weight</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="avgEggWgt"
                                            onChange={handleFormChange}
                                            className="modern-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Candled</label>
                                        <input
                                            type="date"
                                            name="dateCandled"
                                            onChange={handleFormChange}
                                            className="modern-input w-full"
                                        />
                                    </div>
                                </div>

                                {/* Column 3 */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <label className="font-bold text-gray-700">Flock Number</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddFlockModalVisible(true)}
                                                className="w-6 h-6 bg-[#5c3a6b] hover:bg-[#4a2f56] text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm"
                                                title="Add New Flock"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="supplierFlockNumber"
                                                value={newCycleData.supplierFlockNumber || ''}
                                                onChange={handleSupplierFlockNumberChange}
                                                className="modern-input w-full"
                                                placeholder="Enter flock number"
                                            />
                                            
                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && flockSuggestions.length > 0 && (
                                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto modern-card">
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
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Eggs Set</label>
                                        <input
                                            type="number"
                                            name="eggsSet"
                                            onChange={handleFormChange}
                                            className="modern-input w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Set</label>
                                        <input
                                            type="date"
                                            name="setDate"
                                            onChange={handleFormChange}
                                            className="modern-input w-full"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsNewCycleModalVisible(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#5c3a6b] hover:bg-[#4a2f56] text-white rounded-md transition-colors shadow-sm font-semibold"
                                >
                                    Save
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
