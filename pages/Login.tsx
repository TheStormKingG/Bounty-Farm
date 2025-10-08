
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: Role) => {
    login(role);
    switch (role) {
      case Role.Admin:
        navigate('/dashboard');
        break;
      case Role.HatcheryClerk:
        navigate('/hatch-cycles');
        break;
      case Role.SalesClerk:
        navigate('/sales');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
            <img src="https://picsum.photos/150/60" alt="Bounty Farm Logo" className="mx-auto rounded mb-4"/>
            <h1 className="text-3xl font-bold text-gray-800">Hatchery MIS</h1>
            <p className="text-gray-500">Please select a role to log in</p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => handleLogin(Role.Admin)}
            className="w-full bg-bounty-blue-600 text-white py-3 px-4 rounded-lg hover:bg-bounty-blue-700 transition-transform transform hover:scale-105"
          >
            Login as Admin
          </button>
          <button
            onClick={() => handleLogin(Role.HatcheryClerk)}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            Login as Hatchery Clerk
          </button>
          <button
            onClick={() => handleLogin(Role.SalesClerk)}
            className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-transform transform hover:scale-105"
          >
            Login as Sales Clerk
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;