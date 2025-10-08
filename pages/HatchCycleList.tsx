import React, { useState } from 'react';
import Card from '../components/Card';
import { HatchCycle, HatchColourCode } from '../types';

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
        createdAt: '2025-08-10' 
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
        createdAt: '2025-08-17' 
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
        createdAt: '2025-08-24' 
    },
];

const HighlightedCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-bounty-blue-600 text-white font-semibold rounded px-2 py-1 text-center">
        {children}
    </div>
);


const HatchCycleList: React.FC = () => {
    const [cycles, setCycles] = useState(initialCycles);
    const [isNewCycleModalVisible, setIsNewCycleModalVisible] = useState(false);
    const [newCycleData, setNewCycleData] = useState<Partial<HatchCycle>>({ status: 'OPEN', candling: {}, outcome: {} });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setNewCycleData(prev => ({
            ...prev,
            [name]: isNumber ? (value === '' ? undefined : Number(value)) : value
        }));
    };
    
    const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, parentKey: 'candling' | 'outcome') => {
        const { name, value } = e.target;
        setNewCycleData(prev => ({
            ...prev,
            [parentKey]: {
                ...(prev[parentKey] as object),
                [name]: value === '' ? undefined : Number(value),
            }
        }));
    };

    const handleAddNewCycle = (e: React.FormEvent) => {
        e.preventDefault();
        const nextId = cycles.length + 1;
        const newCycle: HatchCycle = {
            id: `HC${String(nextId).padStart(3, '0')}`,
            hatchNo: newCycleData.hatchNo || `2025-${String(13 + nextId).padStart(3, '0')}-BFL`,
            ...newCycleData,
            eggsSet: newCycleData.eggsSet || 0,
            setDate: newCycleData.setDate || new Date().toISOString().split('T')[0],
            status: newCycleData.status || 'OPEN',
            candling: newCycleData.candling || {},
            outcome: newCycleData.outcome || {},
            createdBy: 'clerk-01', // mock user
            createdAt: new Date().toISOString(),
        };
        setCycles(prev => [newCycle, ...prev]);
        setIsNewCycleModalVisible(false);
        setNewCycleData({ status: 'OPEN', candling: {}, outcome: {} });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Listing of Hatchery Cycles</h2>
                 <button 
                    onClick={() => setIsNewCycleModalVisible(true)}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    Add Hatch Cycle
                 </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="p-4 bg-white rounded-lg">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end mb-4">
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="hatch-start" className="block text-sm font-medium text-gray-700">Hatch Start</label>
                                <input id="hatch-start" type="date" className="mt-1 block w-full dark-input" defaultValue="2025-09-08"/>
                            </div>
                            <div>
                                <label htmlFor="hatch-end" className="block text-sm font-medium text-gray-700">End</label>
                                <input id="hatch-end" type="date" className="mt-1 block w-full dark-input" defaultValue="2025-11-07"/>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                            </span>
                            <input type="text" placeholder="Search..." className="w-full p-0 pl-2 bg-transparent border-none focus:ring-0 text-white" />
                         </div>
                        <button className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">Go</button>
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

                <div className="overflow-x-auto mt-4 horizontal-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="text-gray-600">
                                {['Hatch No', 'Hatch Colour', 'Flocks Rec\'d', 'Cases Rec\'d', 'Eggs Rec\'d', 'Avg Egg Wgt', 'Eggs Cracked', 'Eggs Set', 'Date Packed', 'Date Set', 'Date Candled', 'Exp Hatch Qty', 'Pct Adj', 'Exp Hatch Qty Adj', 'Date Hatched', 'Avg Chicks Wgt', 'Chicks Hatched', 'Chicks Culled', 'Vaccination Profile', 'Chicks Sold', 'Status'].map(header => (
                                    <th key={header} className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cycles.map((cycle) => (
                                <tr key={cycle.id} className="text-sm text-gray-900">
                                    <td className="px-2 py-2 whitespace-nowrap font-medium text-bounty-blue-700">{cycle.hatchNo}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.colourCode?.split('-')[1]}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.flocksRecd?.join(', ') || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.casesRecd?.toLocaleString() || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.eggsRecd?.toLocaleString() || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.avgEggWgt || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.eggsCracked?.toLocaleString() || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap"><HighlightedCell>{cycle.eggsSet.toLocaleString()}</HighlightedCell></td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.datePacked || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.setDate}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.dateCandled || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.expHatchQty?.toLocaleString() || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.pctAdj ? `${cycle.pctAdj}%` : '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap"><HighlightedCell>{cycle.expHatchQtyAdj?.toLocaleString() || '-'}</HighlightedCell></td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.hatchDate || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.avgChicksWgt || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap"><HighlightedCell>{cycle.outcome.hatched?.toLocaleString() || '-'}</HighlightedCell></td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.outcome.culled?.toLocaleString() || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{cycle.vaccinationProfile || '-'}</td>
                                    <td className="px-2 py-2 whitespace-nowrap"><HighlightedCell>{cycle.chicksSold?.toLocaleString() || '-'}</HighlightedCell></td>
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        {cycle.status === 'OPEN' ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Open</span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Closed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* New Hatch Cycle Modal */}
            {isNewCycleModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Add New Hatchery Cycle</h3>
                            <button onClick={() => setIsNewCycleModalVisible(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddNewCycle} className="flex-grow overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                                {/* Auto-generated fields shown for info */}
                                <div className="lg:col-span-2">
                                    <label className="block font-medium text-gray-700">Hatch No (Auto-generated)</label>
                                    <input type="text" value={`2025-${String(13 + cycles.length + 1).padStart(3, '0')}-BFL`} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Hatch Colour</label>
                                    <select name="colourCode" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">Select Colour</option>
                                        {Object.values(HatchColourCode).map(c => <option key={c} value={c}>{c.split('-')[1]}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block font-medium text-gray-700">Status</label>
                                    <select name="status" value={newCycleData.status} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="OPEN">Open</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Reception */}
                                <div><label className="block font-bold text-gray-700">Flocks Rec'd (comma-sep)</label><input type="text" name="flocksRecd" onChange={e => setNewCycleData(p => ({...p, flocksRecd: e.target.value.split(',').map(f => f.trim())}))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Cases Rec'd</label><input type="number" name="casesRecd" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Eggs Rec'd</label><input type="number" name="eggsRecd" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Avg Egg Wgt</label><input type="number" step="0.1" name="avgEggWgt" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Eggs Cracked</label><input type="number" name="eggsCracked" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Setting */}
                                <div><label className="block font-bold text-gray-700">Eggs Set</label><input type="number" name="eggsSet" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /></div>
                                <div><label className="block font-medium text-gray-700">Date Packed</label><input type="date" name="datePacked" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Date Set</label><input type="date" name="setDate" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required /></div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Candling */}
                                <div><label className="block font-medium text-gray-700">Date Candled</label><input type="date" name="dateCandled" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Expectation */}
                                <div><label className="block font-medium text-gray-700">Exp Hatch Qty</label><input type="number" name="expHatchQty" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Pct Adj</label><input type="number" step="0.1" name="pctAdj" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Exp Hatch Qty Adj</label><input type="number" name="expHatchQtyAdj" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div className="lg:col-span-4 border-t my-2"></div>
                                {/* Outcome */}
                                <div><label className="block font-medium text-gray-700">Date Hatched</label><input type="date" name="hatchDate" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Avg Chicks Wgt</label><input type="number" step="0.1" name="avgChicksWgt" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-bold text-gray-700">Chicks Hatched</label><input type="number" name="hatched" onChange={e => handleNestedChange(e, 'outcome')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Chicks Culled</label><input type="number" name="culled" onChange={e => handleNestedChange(e, 'outcome')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Vaccination Profile</label><input type="text" name="vaccinationProfile" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                                <div><label className="block font-medium text-gray-700">Chicks Sold</label><input type="number" name="chicksSold" onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" /></div>
                            </div>

                            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsNewCycleModalVisible(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Cycle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HatchCycleList;