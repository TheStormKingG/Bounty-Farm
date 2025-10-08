
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../components/Card';

const hatchData = [
  { name: 'Week 1', hatchability: 88.5, expected: 90, fertileHatch: 94.2 },
  { name: 'Week 2', hatchability: 91.0, expected: 90, fertileHatch: 95.1 },
  { name: 'Week 3', hatchability: 89.2, expected: 90, fertileHatch: 93.8 },
  { name: 'Week 4', hatchability: 92.3, expected: 90, fertileHatch: 96.0 },
];

const chickGradingData = [
  { name: 'Grade A', value: 12600 },
  { name: 'Culled', value: 50 },
];

const orderFulfillmentData = [
    { name: 'Fulfilled', value: 25000 },
    { name: 'Shortage', value: 1200 },
];

const COLORS_PIE = ['#1d4ed8', '#f59e0b'];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h4 className="text-gray-500 text-sm font-medium">Avg. Hatchability (30d)</h4>
            <p className="text-3xl font-bold text-bounty-blue-700">90.2%</p>
        </div>
         <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h4 className="text-gray-500 text-sm font-medium">Chick Cull Rate</h4>
            <p className="text-3xl font-bold text-orange-500">0.4%</p>
        </div>
         <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h4 className="text-gray-500 text-sm font-medium">Order Fulfillment</h4>
            <p className="text-3xl font-bold text-green-600">95.4%</p>
        </div>
         <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h4 className="text-gray-500 text-sm font-medium">Upcoming Hatch</h4>
            <p className="text-3xl font-bold text-gray-700">3 days</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly Hatchability Trend">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hatchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hatchability" fill="#1d4ed8" name="Hatchability" />
                    <Bar dataKey="fertileHatch" fill="#2563eb" name="Fertile Hatch" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Chick Grading (Last Hatch)">
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={chickGradingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {chickGradingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />)}
                        </Pie>
                         <Tooltip />
                         <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
             <Card title="Order Fulfillment (Month)">
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={orderFulfillmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label>
                            {orderFulfillmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />)}
                        </Pie>
                         <Tooltip />
                         <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
