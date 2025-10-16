import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HatchCycleList from './pages/HatchCycleList';
import Sales from './pages/Sales';
import Dispatch from './pages/Dispatch';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { Role } from './types';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';
import FlockManagement from './pages/FlockManagement';
import BreedManagement from './pages/BreedManagement';
import VaccineProfile from './pages/VaccineProfile';
import Customers from './pages/Customers';
import Delivery from './pages/Delivery';
import Farm from './pages/Farm';
import FarmDetail from './pages/FarmDetail';
import FlockDetail from './pages/FlockDetail';
import GrowOut from './pages/GrowOut';
import Catching from './pages/Catching';
import Plant from './pages/Plant';
import Mill from './pages/Mill';
import Inventory from './pages/Inventory';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import QHSE from './pages/QHSE';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading while checking for existing session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const getHomeRouteForRole = (role: Role) => {
    switch (role) {
      case Role.Admin:
        return '/dashboard';
      case Role.HatcheryClerk:
        return '/hatch-cycles';
      case Role.SalesClerk:
        return '/sales';
      case Role.User:
        return '/';
      default:
        return '/login';
    }
  };

  return (
    <Layout>
      <Routes>
        {/* Only redirect to home route if on root path, otherwise preserve current route */}
        <Route path="/" element={<Navigate to={getHomeRouteForRole(user.role)} />} />

        <Route element={<ProtectedRoute allowedRoles={[Role.Admin]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farm" element={<Farm />} />
          <Route path="/farm/:farmId" element={<FarmDetail />} />
          <Route path="/farm/:farmId/flock/:flockId" element={<FlockDetail />} />
          <Route path="/grow-out" element={<GrowOut />} />
          <Route path="/catching" element={<Catching />} />
          <Route path="/plant" element={<Plant />} />
          <Route path="/mill" element={<Mill />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/qhse" element={<QHSE />} />
          <Route path="/flock-management" element={<FlockManagement />} />
          <Route path="/breed-management" element={<BreedManagement />} />
          <Route path="/vaccine-profile" element={<VaccineProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HatcheryClerk]} />}>
          <Route path="/hatch-cycles" element={<HatchCycleList />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[Role.Admin, Role.SalesClerk]} />}>
          <Route path="/sales" element={<Sales />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/customers" element={<Customers />} />
        </Route>

        <Route path="/login" element={<Navigate to={getHomeRouteForRole(user.role)} />} />
        <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
      </Routes>
    </Layout>
  );
};

export default App;
