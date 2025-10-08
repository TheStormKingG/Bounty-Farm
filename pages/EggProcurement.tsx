
import React, { useState } from 'react';
import Card from '../components/Card';
import { EggProcurement as EggProcurementType } from '../types';

const initialProcurements: EggProcurementType[] = [
    { id: 'PROC001', supplierId: 'Pluriton Farms', flockId: 'Flock 2025-34', breed: 'Cobb500', cases: 50, eggsPerCase: 30, totalEggs: 1500, deliveryAt: '2025-08-10T10:00', condition: '1 case wet, others OK', nonConformance: true, remarks: 'Wet case quarantined', createdBy: 'clerk-01', createdAt: '2025-08-10T10:05' },
    { id: 'PROC002', supplierId: 'CWT', flockId: 'Flock 2025-35', breed: 'Ross308', cases: 45, eggsPerCase: 30, totalEggs: 1350, deliveryAt: '2025-08-11T09:30', condition: 'Good', nonConformance: false, remarks: '', createdBy: 'clerk-01', createdAt: '2025-08-11T09:35' },
];

const EggProcurement: React.FC = () => {
  const [procurements, setProcurements] = useState(initialProcurements);
  const [isFormVisible, setIsFormVisible] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Egg Procurement</h2>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 transition-colors"
        >
          {isFormVisible ? 'Close Form' : '+ New Procurement'}
        </button>
      </div>

      {isFormVisible && (
        <Card title="New Egg Procurement Record">
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-bounty-blue-500 focus:border-bounty-blue-500">
                <option>Pluriton Farms</option>
                <option>CWT</option>
                <option>Other Supplier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Flock/Lot ID</label>
              <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Breed/Strain</label>
               <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                <option>Cobb500</option>
                <option>Ross308</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Cases</label>
              <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Eggs per Case</label>
              <input type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Date & Time</label>
              <input type="datetime-local" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Condition on Arrival</label>
              <textarea rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
            <div className="flex items-center space-x-2 pt-6">
                <input type="checkbox" className="h-4 w-4 text-bounty-blue-600 border-gray-300 rounded" />
                <label className="block text-sm font-medium text-gray-700">Non-Conformance</label>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Delivery Receipt Upload</label>
              <input type="file" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-bounty-blue-50 file:text-bounty-blue-700 hover:file:bg-bounty-blue-100"/>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Record</button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Recent Procurements">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Eggs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Conformance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {procurements.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(p.deliveryAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.supplierId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.totalEggs}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.condition}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.nonConformance ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Yes</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">No</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-bounty-blue-600 hover:text-bounty-blue-900">Edit</a>
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

export default EggProcurement;
