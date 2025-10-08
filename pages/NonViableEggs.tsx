
import React, { useState } from 'react';
import Card from '../components/Card';
import { NonViableEgg } from '../types';

const initialRecords: NonViableEgg[] = [
    { id: 'NV001', hatchNo: '2025-011-BFL', detectionPoint: 'Candling', date: '2025-08-18', flockId: 'Flock 2025-34', infertile: 1000, earlyDead: 200, total: 1200, disposedBy: 'Hold', dispatched: false, createdAt: '2025-08-18', createdBy: 'qhse-01' },
    { id: 'NV002', hatchNo: '2025-011-BFL', detectionPoint: 'Hatch', date: '2025-08-31', flockId: 'Flock 2025-34', infertile: 10, lateDead: 270, midDead: 20, total: 300, disposedBy: 'Maceration', dispatched: true, createdAt: '2025-08-31', createdBy: 'clerk-01' },
];

const NonViableEggs: React.FC = () => {
    const [records, setRecords] = useState(initialRecords);
    const [isFormVisible, setIsFormVisible] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Non-Viable Egg Tracking</h2>
                <button
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 transition-colors"
                >
                  {isFormVisible ? 'Close Form' : '+ New Log Entry'}
                </button>
            </div>

            {isFormVisible && (
                <Card title="Log Non-Viable Eggs">
                    <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hatch No. (if applicable)</label>
                            <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Detection Point</label>
                            <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option>Receiving</option>
                                <option>Candling</option>
                                <option>Transfer</option>
                                <option>Hatch</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Infertile</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Early Dead</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Late Dead</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contaminated/Other</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Disposal Method</label>
                            <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                               <option>Hold</option>
                               <option>Maceration</option>
                               <option>Compost</option>
                               <option>Rendering</option>
                               <option>Incineration</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <input type="checkbox" className="h-4 w-4 text-bounty-blue-600 border-gray-300 rounded"/>
                            <label className="ml-2 block text-sm text-gray-900">Dispatched</label>
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                             <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Log</button>
                        </div>
                    </form>
                </Card>
            )}

            <Card title="Disposal Log">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hatch No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detection Point</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Eggs</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disposal Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatched</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {records.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.hatchNo || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.detectionPoint}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{r.total.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.disposedBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {r.dispatched ? <span className="text-green-600">Yes</span> : <span className="text-yellow-600">No</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default NonViableEggs;
