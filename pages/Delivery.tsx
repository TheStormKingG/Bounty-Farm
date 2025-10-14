import React from 'react';

const Delivery: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Delivery Management</h1>
      </div>
      
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-md">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Delivery Management</h2>
          <p className="text-gray-500 mb-6">
            This page will contain delivery tracking and management features.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>Coming Soon:</strong> Delivery tracking, route optimization, and driver management features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Delivery;
