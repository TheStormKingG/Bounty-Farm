
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

const COLORS_PIE = ['#5C3A6B', '#F86F6F'];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <h1 className="heading-primary">Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="modern-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <h4 className="text-[#AAAAAA] text-sm font-medium mb-2">Avg. Hatchability (30d)</h4>
            <p className="text-4xl font-bold text-[#5C3A6B]">90.2%</p>
        </div>
         <div className="modern-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <h4 className="text-[#AAAAAA] text-sm font-medium mb-2">Chick Cull Rate</h4>
            <p className="text-4xl font-bold text-[#F86F6F]">0.4%</p>
        </div>
         <div className="modern-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <h4 className="text-[#AAAAAA] text-sm font-medium mb-2">Order Fulfillment</h4>
            <p className="text-4xl font-bold text-[#FFB366]">95.4%</p>
        </div>
         <div className="modern-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <h4 className="text-[#AAAAAA] text-sm font-medium mb-2">Upcoming Hatch</h4>
            <p className="text-4xl font-bold text-[#333333]">3 days</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Weekly Hatchability Trend">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hatchData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F0EE" />
                    <XAxis dataKey="name" stroke="#333333" />
                    <YAxis unit="%" stroke="#333333" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #F5F0EE',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="hatchability" fill="#5C3A6B" name="Hatchability" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fertileHatch" fill="#F86F6F" name="Fertile Hatch" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Chick Grading (Last Hatch)">
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie 
                          data={chickGradingData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80} 
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chickGradingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />)}
                        </Pie>
                         <Tooltip 
                           contentStyle={{
                             backgroundColor: '#FFFFFF',
                             border: '1px solid #F5F0EE',
                             borderRadius: '12px',
                             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                           }}
                         />
                         <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
             <Card title="Order Fulfillment (Month)">
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie 
                          data={orderFulfillmentData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={50} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {orderFulfillmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />)}
                        </Pie>
                         <Tooltip 
                           contentStyle={{
                             backgroundColor: '#FFFFFF',
                             border: '1px solid #F5F0EE',
                             borderRadius: '12px',
                             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                           }}
                         />
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
