import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HatchCycleList from './pages/HatchCycleList';
import Sales from './pages/Sales';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { Role } from './types';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';

// ✅ Supabase client
import { supabase } from './src/supabase';

const App: React.FC = () => {
  const { user, setUser } = useAuth();

  // 🔐 Always read role from DB profile, never from user_metadata
  const setUserFromSession = async () => {
    const { data } = await supabase.auth.getSession();
    const su = data.session?.user;
    if (!su) {
      setUser(null);
      return;
    }

    const { data: p } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', su.id)
      .single();

    setUser({
      id: su.id,
      email: su.email ?? '',
      name: p?.name ?? su.email ?? 'User',
      role: (p?.role as Role) ?? Role.User
    });
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;

    // Initial load
    setUserFromSession();

    // Live updates
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const su = session?.user;
      if (!su) {
        setUser(null);
        return;
      }
      // re-fetch profile on every auth change
      const { data: p } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', su.id)
        .single();

      setUser({
        id: su.id,
        email: su.email ?? '',
        name: p?.name ?? su.email ?? 'User',
        role: (p?.role as Role) ?? Role.User
      });
    });

    unsub = () => sub.subscription.unsubscribe();
    return () => { if (unsub) unsub(); };
  }, [setUser]);

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
      default:
        return '/login';
    }
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={getHomeRouteForRole(user.role)} />} />

        <Route element={<ProtectedRoute allowedRoles={[Role.Admin]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HatcheryClerk]} />}>
          <Route path="/hatch-cycles" element={<HatchCycleList />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[Role.Admin, Role.SalesClerk]} />}>
          <Route path="/sales" element={<Sales />} />
        </Route>

        <Route path="/login" element={<Navigate to={getHomeRouteForRole(user.role)} />} />
        <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
      </Routes>
    </Layout>
  );
};

export default App;
