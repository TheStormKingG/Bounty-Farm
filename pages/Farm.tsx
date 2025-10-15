import React from 'react';

const Farm: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-4xl">🚜</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Farm Module</h1>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-8">
            <p className="text-lg text-blue-800 font-semibold mb-2">Coming Soon...</p>
            <p className="text-blue-700">
              If BFLOS Proposal is accepted this module will be operational by the end of <strong>November</strong>.
            </p>
          </div>
          <p className="text-gray-600 text-lg">
            The Farm module will provide comprehensive management tools for agricultural operations, 
            including crop planning, livestock management, and resource tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Farm;
