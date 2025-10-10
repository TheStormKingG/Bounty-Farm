
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Supplier, Breed, Vaccine, Customer, Role, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../src/supabase';

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

// Mock users data
const initialUsers: UserProfile[] = [
    { id: 'admin-01', email: 'stefan.gravesande@gmail.com', role: Role.Admin, name: 'Stefan Gravesande' },
    { id: 'clerk-01', email: 'hatchery.clerk@bounty.farm', role: Role.HatcheryClerk, name: 'Hatchery Clerk' },
    { id: 'sales-01', email: 'sales.clerk@bounty.farm', role: Role.SalesClerk, name: 'Sales Clerk' },
];

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [breeds, setBreeds] = useState<Breed[]>(initialBreeds);
    const [vaccines, setVaccines] = useState<Vaccine[]>(initialVaccines);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // User management state
    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [newUserData, setNewUserData] = useState<Partial<UserProfile>>({
        role: Role.HatcheryClerk,
        name: '',
        email: '',
    });
    const [userPassword, setUserPassword] = useState('');

    // Fetch users from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const { data, error } = await supabase
                    .from('staff_table')
                    .select('*')
                    .order('name');

                if (error) {
                    console.error('Error fetching users:', error);
                    setError('Failed to fetch users from database');
                    setUsers([]);
                } else {
                    const mappedUsers: UserProfile[] = (data || []).map((staff: any) => ({
                        id: staff.id,
                        email: staff.email,
                        name: staff.name,
                        role: staff.role as Role,
                        password: staff.password,
                    }));
                    setUsers(mappedUsers);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('Database connection failed');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // A simple generic handler for deletion
    const handleDelete = <T extends {id: string}>(id: string, items: T[], setItems: React.Dispatch<React.SetStateAction<T[]>>) => {
        if(window.confirm('Are you sure you want to delete this item?')) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    // User management handlers
    const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserData.name || !newUserData.email || !newUserData.role || !userPassword) {
            alert('Please fill in all required fields including password');
            return;
        }

        try {
            setError(null);
            
            // Create staff record in Supabase
            const { data: staffData, error: staffError } = await supabase
                .from('staff_table')
                .insert([{
                    name: newUserData.name!,
                    email: newUserData.email!,
                    password: userPassword,
                    role: newUserData.role!,
                }])
                .select()
                .single();

            if (staffError) {
                console.error('Error creating staff record:', staffError);
                setError('Failed to create staff record: ' + staffError.message);
                return;
            }

            // Update local state
            const newUser: UserProfile = {
                id: staffData.id,
                name: staffData.name,
                email: staffData.email,
                role: staffData.role as Role,
            };

            setUsers(prev => [...prev, newUser]);
            setIsUserModalVisible(false);
            setNewUserData({
                role: Role.HatcheryClerk,
                name: '',
                email: '',
            });
            setUserPassword('');
            alert(`User ${newUser.name} added successfully! Password: ${userPassword}`);
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred while adding user');
        }
    };

    const handleEditUser = (userToEdit: UserProfile) => {
        setCurrentUser(userToEdit);
        setIsEditUserModalVisible(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        if (!currentUser.name || !currentUser.email || !currentUser.role) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setError(null);
            
            // Update staff record in Supabase
            const updateData: any = {
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
            };

            // Only update password if provided
            if (userPassword) {
                updateData.password = userPassword;
            }

            const { error } = await supabase
                .from('staff_table')
                .update(updateData)
                .eq('id', currentUser.id);

            if (error) {
                console.error('Error updating user:', error);
                setError('Failed to update user');
                return;
            }

            // Update local state
            setUsers(prev => prev.map(u => u.id === currentUser.id ? currentUser : u));
            setIsEditUserModalVisible(false);
            setCurrentUser(null);
            setUserPassword('');
            
            if (userPassword) {
                alert(`User ${currentUser.name} updated successfully. Password updated.`);
            } else {
                alert(`User ${currentUser.name} updated successfully.`);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred while updating user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === user?.id) {
            alert('You cannot delete your own account');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            setError(null);
            
            // Delete from staff_table
            const { error } = await supabase
                .from('staff_table')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Error deleting user:', error);
                setError('Failed to delete user');
                return;
            }

            // Update local state
            setUsers(prev => prev.filter(u => u.id !== userId));
            alert('User deleted successfully');
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred while deleting user');
        }
    };
    
    // NOTE: In a real app, Add/Edit would use a modal and a form. 
    // For this demo, we are just showing the management table.
    // The alert is a placeholder for the add/edit functionality.

    return (
        <div className="space-y-8 animate-fade-in-up">
            <h1 className="heading-primary">Settings</h1>
            
            {/* User Management Section - Only visible to Admin */}
            {user?.role === Role.Admin && (
                <Card title="Manage Users">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <button 
                            onClick={() => setIsUserModalVisible(true)} 
                            className="btn-primary px-6 py-3 text-sm"
                        >
                            <span>+</span> Add User
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-lg text-[#AAAAAA]">Loading users...</div>
                        </div>
                    ) : (
                    <table className="modern-table min-w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] uppercase">Password</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="text-sm text-[#333333] hover:bg-[#FFF8F0] transition-colors">
                                    <td className="px-4 py-3 text-sm">{u.name}</td>
                                    <td className="px-4 py-3 text-sm">{u.email}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="font-mono text-xs bg-[#F5F0EE] px-2 py-1 rounded">
                                            {u.password || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            u.role === Role.Admin ? 'bg-[#FFE4D6] text-[#5C3A6B]' :
                                            u.role === Role.HatcheryClerk ? 'bg-[#FFE4D6] text-[#F86F6F]' :
                                            'bg-[#FFE4D6] text-[#FFB366]'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm space-x-2">
                                        <button 
                                            onClick={() => handleEditUser(u)} 
                                            className="text-[#5C3A6B] hover:underline font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)} 
                                            className="text-[#F86F6F] hover:underline font-medium"
                                            disabled={u.id === user?.id}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </Card>
            )}

            {/* Edit User Modal */}
            {isEditUserModalVisible && currentUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Edit User</h3>
                            <button 
                                onClick={() => setIsEditUserModalVisible(false)} 
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentUser.name}
                                    onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={currentUser.email}
                                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={userPassword}
                                    onChange={(e) => setUserPassword(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    placeholder="Enter new password (leave blank to keep current)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select
                                    name="role"
                                    value={currentUser.role}
                                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as Role})}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    required
                                >
                                    <option value={Role.HatcheryClerk}>Hatchery Clerk</option>
                                    <option value={Role.SalesClerk}>Sales Clerk</option>
                                    <option value={Role.Admin}>Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEditUserModalVisible(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-blue px-6 py-3"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Manage Suppliers */}
                <Card title="Manage Suppliers">
                    <div className="mb-4">
                        <button onClick={() => alert('Supplier form would open here.')} className="btn-blue px-6 py-3 text-sm">
                            <span>+</span> Add Supplier
                        </button>
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
                        <button onClick={() => alert('Breed form would open here.')} className="btn-blue px-6 py-3 text-sm">
                            <span>+</span> Add Breed
                        </button>
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
                        <button onClick={() => alert('Vaccine form would open here.')} className="btn-blue px-6 py-3 text-sm">
                            <span>+</span> Add Vaccine
                        </button>
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
                        <button onClick={() => alert('Customer form would open here.')} className="btn-blue px-6 py-3 text-sm">
                            <span>+</span> Add Customer
                        </button>
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

            {/* Add User Modal */}
            {isUserModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Add New User</h3>
                            <button 
                                onClick={() => setIsUserModalVisible(false)} 
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newUserData.name || ''}
                                    onChange={handleUserFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={newUserData.email || ''}
                                    onChange={handleUserFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={userPassword}
                                    onChange={(e) => setUserPassword(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select
                                    name="role"
                                    value={newUserData.role || Role.HatcheryClerk}
                                    onChange={handleUserFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    required
                                >
                                    <option value={Role.HatcheryClerk}>Hatchery Clerk</option>
                                    <option value={Role.SalesClerk}>Sales Clerk</option>
                                    <option value={Role.Admin}>Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalVisible(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-blue px-6 py-3"
                                >
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
