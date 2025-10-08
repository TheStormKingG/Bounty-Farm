
import React, { useState } from 'react';
import Card from '../components/Card';
import { ChickProcessing as ChickProcessingType } from '../types';

const initialRecords: ChickProcessingType[] = [
    { id: 'CP001', hatchNo: '2025-011-BFL', sortDate: '2025-08-31', gradeA: 12600, cull: 50, cullReasons: { navel_unhealed: 20, weak: 15, deformity: 15 }, vaccinesGiven: ['ND-HH', 'IB'], boxesPrepared: 126, chicksPerBox: 100, finalCountConfirmed: 12600, createdAt: '2025-08-31', createdBy: 'clerk-01' },
    { id: 'CP002', hatchNo: '2025-012-BFL', sortDate: '2025-09-07', gradeA: 13130, cull: 70, cullReasons: { navel_unhealed: 30, weak: 25, deformity: 15 }, vaccinesGiven: ['ND-HH', 'IB', 'IBD'], boxesPrepared: 131, chicksPerBox: 100, finalCountConfirmed: 13100, createdAt: '2025-09-07', createdBy: 'clerk-01' },
];


const ChickProcessing: React.FC = () => {
    const [records, setRecords] = useState(initialRecords);
    const [isFormVisible, setIsFormVisible] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Chick Processing</h2>
                <button
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 transition-colors"
                >
                  {isFormVisible ? 'Close Form' : '+ New Processing Record'}
                </button>
            </div>

            {isFormVisible && (
                 <Card title="New Chick Processing Record">
                    <form className="space-y-6">
                        {/* Section 1: General Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hatch Number</label>
                                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    <option>2025-013-BFL</option>
                                    <option>2025-012-BFL</option>
                                    <option>2025-011-BFL</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sort Date</label>
                                <input type="date" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>

                        {/* Section 2: Grading */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-6">
                             <h3 className="md:col-span-3 text-lg font-medium text-gray-800">Grading & Culling</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Grade A Chicks</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Culls</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cull Disposal Method</label>
                                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    <option>Maceration</option>
                                    <option>Compost</option>
                                </select>
                            </div>
                             <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Cull Reasons (e.g. weak:15, deformity:10)</label>
                                <input type="text" placeholder="weak:15, deformity:10" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        
                        {/* Section 3: Vaccination */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
                            <h3 className="md:col-span-2 text-lg font-medium text-gray-800">Vaccination</h3>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Vaccines Given (comma-separated)</label>
                                <input type="text" placeholder="ND-HH, IB, IBD" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vaccine Batch Numbers (e.g. ND-HH:B123)</label>
                                <input type="text" placeholder="ND-HH:B123, IB:B456" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>

                        {/* Section 4: Boxing */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <h3 className="md:col-span-3 text-lg font-medium text-gray-800">Counting & Boxing</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Boxes Prepared</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Chicks per Box</label>
                                <input type="number" min="0" defaultValue="100" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Final Confirmed Count</label>
                                <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>

                         <div className="flex justify-end pt-4">
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Processing Record</button>
                        </div>
                    </form>
                </Card>
            )}

             <Card title="Recent Chick Processing Records">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hatch No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade A</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Culled</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccines</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boxes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {records.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.hatchNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.sortDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.gradeA.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{r.cull}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.vaccinesGiven?.join(', ')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.boxesPrepared}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href="#" className="text-bounty-blue-600 hover:text-bounty-blue-900">Details</a>
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

export default ChickProcessing;
