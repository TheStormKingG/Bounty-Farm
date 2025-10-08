import React, { useState } from 'react';
import Card from '../components/Card';
import { Order, Trip } from '../types';

const initialOrders: Order[] = [
    { id: 'ORD001', customer: 'John Farms', type: 'Standing', quantityOrdered: 500, hatchDate: '2025-09-07', location: 'Hatchery', status: 'Completed', paymentStatus: 'Paid', allocatedQty: 500, trips: [{ tripId: 'TRIP-001A', quantity: 300, dispatchedAt: '2025-09-07' }, { tripId: 'TRIP-001B', quantity: 200, dispatchedAt: '2025-09-07' }], flockIds: ['Flock 2025-35'], createdAt: '2025-08-20', createdBy: 'sales-01' },
    { id: 'ORD002', customer: 'Alex Trader', type: 'AdHoc', quantityOrdered: 300, hatchDate: '2025-09-07', location: 'Hatchery', status: 'Allocated', paymentStatus: 'Partial', allocatedQty: 270, trips: [{ tripId: 'TRIP-002A', quantity: 270, dispatchedAt: '2025-09-07' }], flockIds: ['Flock 2025-35'], createdAt: '2025-08-22', createdBy: 'sales-01' },
    { id: 'ORD003', customer: 'Livestock Co', type: 'Standing', quantityOrdered: 1000, hatchDate: '2025-09-07', location: 'Outlet', status: 'Pending', paymentStatus: 'Pending', trips: [], flockIds: ['Flock 2025-36', 'Flock 2025-37'], createdAt: '2025-08-21', createdBy: 'sales-01' },
    { id: 'ORD004', customer: 'Mary Poultry', type: 'AdHoc', quantityOrdered: 150, hatchDate: '2025-09-14', location: 'Hatchery', status: 'Confirmed', paymentStatus: 'Pending', trips: [], flockIds: ['Flock 2025-38'], createdAt: '2025-09-01', createdBy: 'sales-01' },
];

const statusOptions: Order['status'][] = ['Pending', 'Confirmed', 'Allocated', 'Completed', 'NoShow', 'Cancelled'];
const locationOptions: Order['location'][] = ['Hatchery', 'Outlet', 'Delivery'];
const typeOptions: Order['type'][] = ['AdHoc', 'Standing'];
const paymentStatusOptions: NonNullable<Order['paymentStatus']>[] = ['Pending', 'Paid', 'Partial'];


const statusColors: Record<Order['status'], string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Allocated: 'bg-indigo-100 text-indigo-800',
    Completed: 'bg-green-100 text-green-800',
    NoShow: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-800',
};

const TRUCK_CAPACITY = 56000;

const Sales: React.FC = () => {
    const [orders, setOrders] = useState(initialOrders);
    const [isNewOrderModalVisible, setIsNewOrderModalVisible] = useState(false);
    const [newOrderData, setNewOrderData] = useState<Partial<Order>>({
        status: 'Pending',
        type: 'AdHoc',
        location: 'Hatchery',
        paymentStatus: 'Pending',
    });
    const [tripModalOrder, setTripModalOrder] = useState<Order | null>(null);
    const [viewModalOrder, setViewModalOrder] = useState<Order | null>(null);
    const [editModalOrder, setEditModalOrder] = useState<Order | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Order>>({});

    const generateTrips = (orderId: string, quantity: number | undefined, hatchDate: string | undefined): Trip[] => {
        if (!quantity || quantity <= 0) {
            return [];
        }
    
        const numberOfTrucks = Math.ceil(quantity / TRUCK_CAPACITY);
        if (numberOfTrucks === 0) {
            return [];
        }
    
        const baseQuantityPerTruck = Math.floor(quantity / numberOfTrucks);
        let remainder = quantity % numberOfTrucks;
    
        const trips: Trip[] = [];
        const dispatchDate = hatchDate || new Date().toISOString().split('T')[0];

        for (let i = 1; i <= numberOfTrucks; i++) {
            let tripQuantity = baseQuantityPerTruck;
            if (remainder > 0) {
                tripQuantity += 1;
                remainder--;
            }
            trips.push({
                tripId: `TRIP-${orderId.replace('ORD', '')}-${i}`,
                quantity: tripQuantity,
                dispatchedAt: dispatchDate,
            });
        }
    
        return trips;
    };

    const handleEditClick = (order: Order) => {
        setEditModalOrder(order);
        setEditFormData(order);
    };
    
    const handleNewOrderClick = () => {
        setNewOrderData({
            status: 'Pending',
            type: 'AdHoc',
            location: 'Hatchery',
            paymentStatus: 'Pending',
            hatchDate: new Date().toISOString().split('T')[0], // Default to today
        });
        setIsNewOrderModalVisible(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, setData: React.Dispatch<React.SetStateAction<Partial<Order>>>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setData(prev => ({
            ...prev,
            [name]: isNumber ? (value === '' ? undefined : Number(value)) : value,
        }));
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalOrder) return;

        const allocatedQty = editFormData.allocatedQty;
        const updatedTrips = generateTrips(editModalOrder.id, allocatedQty, editFormData.hatchDate);

        setOrders(orders.map(o => o.id === editModalOrder.id ? { ...o, ...editFormData, trips: updatedTrips } as Order : o));
        setEditModalOrder(null);
    };

    const handleAddNewOrder = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `ORD${String(orders.length + 1).padStart(3, '0')}`;
        const allocatedQty = newOrderData.allocatedQty;
        const trips = generateTrips(newId, allocatedQty, newOrderData.hatchDate);

        const newOrder: Order = {
            id: newId,
            customer: newOrderData.customer || 'N/A',
            type: newOrderData.type || 'AdHoc',
            quantityOrdered: newOrderData.quantityOrdered || 0,
            hatchDate: newOrderData.hatchDate || new Date().toISOString().split('T')[0],
            location: newOrderData.location || 'Hatchery',
            status: newOrderData.status || 'Pending',
            paymentStatus: newOrderData.paymentStatus || 'Pending',
            allocatedQty: allocatedQty,
            flockIds: newOrderData.flockIds,
            createdAt: new Date().toISOString(),
            createdBy: 'sales-01', // Mock user
            trips: trips,
        };
        setOrders([newOrder, ...orders]);
        setIsNewOrderModalVisible(false);
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Sales & Dispatch</h2>
                <button
                  onClick={handleNewOrderClick}
                  className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700 transition-colors"
                >
                  + New Order
                </button>
            </div>

            <Card title="Booking File">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hatch Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flock(s)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch ID</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Trips</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.customer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.hatchDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.flockIds?.join(', ') || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantityOrdered.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{order.allocatedQty?.toLocaleString() || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <button 
                                            onClick={() => setTripModalOrder(order)}
                                            className="text-bounty-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                                            disabled={!order.trips || order.trips.length === 0}
                                        >
                                            {order.trips?.length || 0}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => setViewModalOrder(order)} className="text-gray-600 hover:text-bounty-blue-900 mr-3">View</button>
                                        <button onClick={() => handleEditClick(order)} className="text-bounty-blue-600 hover:text-bounty-blue-900">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Trip Details Modal */}
            {tripModalOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Trip Details: {tripModalOrder.id}</h3>
                            <button onClick={() => setTripModalOrder(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>
                        <p className="mb-4 text-gray-600">Customer: <span className="font-semibold text-gray-900">{tripModalOrder.customer}</span></p>

                        <div className="overflow-y-auto max-h-60">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Trip ID</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Dispatch Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tripModalOrder.trips?.map(trip => (
                                        <tr key={trip.tripId}>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trip.tripId}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trip.quantity.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{trip.dispatchedAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-6 text-right">
                             <button onClick={() => setTripModalOrder(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Close</button>
                        </div>
                    </div>
                </div>
            )}

             {/* View Order (Dispatch Card) Modal */}
            {viewModalOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Dispatch Card: {viewModalOrder.id}</h3>
                            <button onClick={() => setViewModalOrder(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Customer Details</h4>
                                <p><span className="text-gray-500">Customer:</span> <span className="font-medium text-gray-900">{viewModalOrder.customer}</span></p>
                                <p><span className="text-gray-500">Order Type:</span> <span className="font-medium text-gray-900">{viewModalOrder.type}</span></p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Order Summary</h4>
                                <p><span className="text-gray-500">Status:</span> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[viewModalOrder.status]}`}>{viewModalOrder.status}</span></p>
                                <p><span className="text-gray-500">Hatch Date:</span> <span className="font-medium text-gray-900">{viewModalOrder.hatchDate}</span></p>
                                <p><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-900">{viewModalOrder.location}</span></p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Quantities</h4>
                                <p><span className="text-gray-500">Ordered:</span> <span className="font-medium text-gray-900">{viewModalOrder.quantityOrdered.toLocaleString()}</span></p>
                                <p><span className="text-gray-500">Allocated:</span> <span className="font-medium text-gray-900">{viewModalOrder.allocatedQty?.toLocaleString() || 'N/A'}</span></p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Source & Payment</h4>
                                <p><span className="text-gray-500">Flock(s):</span> <span className="font-medium text-gray-900">{viewModalOrder.flockIds?.join(', ') || 'N/A'}</span></p>
                                <p><span className="text-gray-500">Payment:</span> <span className="font-medium text-gray-900">{viewModalOrder.paymentStatus || 'N/A'}</span></p>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-semibold text-gray-600 mb-2">Dispatch Trips</h4>
                            {viewModalOrder.trips && viewModalOrder.trips.length > 0 ? (
                                <div className="overflow-y-auto max-h-40">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dispatch Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {viewModalOrder.trips?.map(trip => (
                                                <tr key={trip.tripId}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{trip.tripId}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{trip.quantity.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{trip.dispatchedAt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No dispatch trips recorded for this order.</p>
                            )}
                        </div>
                        
                        <div className="mt-6 text-right">
                            <button onClick={() => setViewModalOrder(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Close</button>
                        </div>
                    </div>
                </div>
            )}

             {/* New Order Modal */}
            {isNewOrderModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Book New Order</h3>
                            <button onClick={() => setIsNewOrderModalVisible(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleAddNewOrder}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div>
                                    <label className="block font-medium text-gray-700">Customer</label>
                                    <input type="text" name="customer" value={newOrderData.customer || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Order Type</label>
                                    <select name="type" value={newOrderData.type || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Status</label>
                                    <select name="status" value={newOrderData.status || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                       {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Hatch Date</label>
                                    <input type="date" name="hatchDate" value={newOrderData.hatchDate || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Location</label>
                                    <select name="location" value={newOrderData.location || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Payment Status</label>
                                    <select name="paymentStatus" value={newOrderData.paymentStatus || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        {paymentStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Quantity Ordered</label>
                                    <input type="number" name="quantityOrdered" value={newOrderData.quantityOrdered || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                                </div>
                                 <div>
                                    <label className="block font-medium text-gray-700">Quantity Allocated</label>
                                    <input type="number" name="allocatedQty" value={newOrderData.allocatedQty || ''} onChange={(e) => handleFormChange(e, setNewOrderData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                                 <div className="md:col-span-2">
                                    <label className="block font-medium text-gray-700">Flock(s) (comma-separated)</label>
                                    <input type="text" name="flockIds" value={Array.isArray(newOrderData.flockIds) ? newOrderData.flockIds.join(', ') : ''} onChange={(e) => setNewOrderData(prev => ({ ...prev, flockIds: e.target.value.split(',').map(f => f.trim()) }))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsNewOrderModalVisible(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {editModalOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-800">Edit Order: {editModalOrder.id}</h3>
                            <button onClick={() => setEditModalOrder(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSaveChanges}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div>
                                    <label className="block font-medium text-gray-700">Customer</label>
                                    <input type="text" name="customer" value={editFormData.customer || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Order Type</label>
                                    <select name="type" value={editFormData.type || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Status</label>
                                    <select name="status" value={editFormData.status || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                       {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Hatch Date</label>
                                    <input type="date" name="hatchDate" value={editFormData.hatchDate || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Location</label>
                                    <select name="location" value={editFormData.location || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Payment Status</label>
                                    <select name="paymentStatus" value={editFormData.paymentStatus || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        {paymentStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700">Quantity Ordered</label>
                                    <input type="number" name="quantityOrdered" value={editFormData.quantityOrdered || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                                 <div>
                                    <label className="block font-medium text-gray-700">Quantity Allocated</label>
                                    <input type="number" name="allocatedQty" value={editFormData.allocatedQty || ''} onChange={(e) => handleFormChange(e, setEditFormData)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                                 <div className="md:col-span-2">
                                    <label className="block font-medium text-gray-700">Flock(s) (comma-separated)</label>
                                    <input type="text" name="flockIds" value={Array.isArray(editFormData.flockIds) ? editFormData.flockIds.join(', ') : ''} onChange={(e) => setEditFormData(prev => ({ ...prev, flockIds: e.target.value.split(',').map(f => f.trim()) }))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                                <button type="button" onClick={() => setEditModalOrder(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-bounty-blue-600 text-white rounded-md hover:bg-bounty-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;