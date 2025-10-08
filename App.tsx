import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EggProcurement from './pages/EggProcurement';
import HatchCycleList from './pages/HatchCycleList';
import ChickProcessing from './pages/ChickProcessing';
import Sales from './pages/Sales';
import NonViableEggs from './pages/NonViableEggs';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { Role } from './types';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';

// ✅ NEW: supabase client (installed via `npm i @supabase/supabase-js`)
import { supabase } from './src/supabase';

// ✅ NEW: map Supabase user → your app's user shape
const mapSupabaseUserToAppUser = (u: any) => ({
  id: u.id as string,
  email: (u.email ?? '') as string,
  name: (u.user_metadata?.name ?? u.email ?? 'User') as string,
  // Expecting your Role enum; default to User if none set in metadata
  role: ((u.user_metadata?.role as Role) ?? Role.User) as Role,
});

const App: React.FC = () => {
  // ⬇️ assumes AuthContext provides setUser
  const { user, setUser } = useAuth();

  // ✅ NEW: bootstrap session + subscribe to auth changes once
  useEffect(() => {
    let unsub: (() => void) | undefined;

    // Initial load
    supabase.auth.getSession().then(({ data }) => {
      const su = data.session?.user;
      if (su) setUser(mapSupabaseUserToAppUser(su));
    });

    // Live updates: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const su = session?.user;
      if (su) setUser(mapSupabaseUserToAppUser(su));
      else setUser(null);
    });

    unsub = () => sub.subscription.unsubscribe();
    return () => {
      if (unsub) unsub();
    };
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
          <Route path="/egg-procurement" element={<EggProcurement />} />
          <Route path="/hatch-cycles" element={<HatchCycleList />} />
          <Route path="/chick-processing" element={<ChickProcessing />} />
          <Route path="/non-viable-eggs" element={<NonViableEggs />} />
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
