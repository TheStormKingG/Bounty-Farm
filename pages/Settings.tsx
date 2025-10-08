
import React, { useState } from 'react';
import Card from '../components/Card';
import { Supplier, Breed, Vaccine, Customer } from '../types';

// Mock Data
const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Pluriton Farms', status: 'Approved' },
    { id: 'sup2', name: 'CWT', status: 'Approved' },
    { id: 'sup3', name: 'Local Farms Co.', status: 'Provisional' },
];

const initialBreeds: Breed[] = [
    { id: 'brd1', name: 'Cobb500' },
    { id: 'brd2', name: 'Ross308' },
];

const initialVaccines: Vaccine[] = [
    { id: 'vac1', name: 'ND-HH', type: 'Injection' },
    { id: 'vac2', name: 'IB', type: 'Spray' },
    { id: 'vac3', name: 'IBD', type: 'Injection' },
];

const initialCustomers: Customer[] = [
    { id: 'cus1', name: 'John Farms', contact: '555-1234', type: 'Regular' },
    { id: 'cus2', name: 'Alex Trader', contact: '555-5678', type: 'New' },
    { id: 'cus3', name: 'Livestock Co', contact: '555-8765', type: 'Regular' },
];


const Settings: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [breeds, setBreeds] = useState<Breed[]>(initialBreeds);
    const [vaccines, setVaccines] = useState<Vaccine[]>(initialVaccines);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

    // A simple generic handler for deletion
    const handleDelete = <T extends {id: string}>(id: string, items: T[], setItems: React.Dispatch<React.SetStateAction<T[]>>) => {
        if(window.confirm('Are you sure you want to delete this item?')) {
            setItems(items.filter(item => item.id !== id));
        }
    };
    
    // NOTE: In a real app, Add/Edit would use a modal and a form. 
    // For this demo, we are just showing the management table.
    // The alert is a placeholder for the add/edit functionality.

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Manage Suppliers */}
                <Card title="Manage Suppliers">
                    <div className="mb-4">
                        <button onClick={() => alert('Supplier form would open here.')} className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 text-sm">+ Add Supplier</button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.map(s => (
                                <tr key={s.id}>
                                    <td className="px-4 py-2 text-sm">{s.name}</td>
                                    <td className="px-4 py-2 text-sm">{s.status}</td>
                                    <td className="px-4 py-2 text-sm space-x-2">
                                        <button onClick={() => alert(`Editing ${s.name}`)} className="text-bounty-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(s.id, suppliers, setSuppliers)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                {/* Manage Breeds */}
                <Card title="Manage Breeds">
                    <div className="mb-4">
                        <button onClick={() => alert('Breed form would open here.')} className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 text-sm">+ Add Breed</button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {breeds.map(b => (
                                <tr key={b.id}>
                                    <td className="px-4 py-2 text-sm">{b.name}</td>
                                    <td className="px-4 py-2 text-sm space-x-2">
                                        <button onClick={() => alert(`Editing ${b.name}`)} className="text-bounty-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(b.id, breeds, setBreeds)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                
                {/* Manage Vaccines */}
                <Card title="Manage Vaccines">
                     <div className="mb-4">
                        <button onClick={() => alert('Vaccine form would open here.')} className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 text-sm">+ Add Vaccine</button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vaccines.map(v => (
                                <tr key={v.id}>
                                    <td className="px-4 py-2 text-sm">{v.name}</td>
                                    <td className="px-4 py-2 text-sm">{v.type}</td>
                                    <td className="px-4 py-2 text-sm space-x-2">
                                        <button onClick={() => alert(`Editing ${v.name}`)} className="text-bounty-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(v.id, vaccines, setVaccines)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                {/* Manage Customers */}
                <Card title="Manage Customers">
                    <div className="mb-4">
                        <button onClick={() => alert('Customer form would open here.')} className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 text-sm">+ Add Customer</button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.map(c => (
                                <tr key={c.id}>
                                    <td className="px-4 py-2 text-sm">{c.name}</td>
                                    <td className="px-4 py-2 text-sm">{c.contact}</td>
                                    <td className="px-4 py-2 text-sm">{c.type}</td>
                                    <td className="px-4 py-2 text-sm space-x-2">
                                        <button onClick={() => alert(`Editing ${c.name}`)} className="text-bounty-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(c.id, customers, setCustomers)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
