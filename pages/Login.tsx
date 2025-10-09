import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role, UserProfile } from '../types';
import { supabase } from '../src/supabase';

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
      return '/';
  }
};

// NEW: build correct redirect URLs whether the app runs at "/" or "/Bounty-Farm/"
const BASE = (import.meta as any).env?.BASE_URL ?? '/';
const basePath = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
const withBase = (p: string) =>
  `${window.location.origin}${basePath}${p.startsWith('/') ? p : `/${p}`}`;

const Login: React.FC = () => {
  const { login } = useAuth(); // mock login (dev only)
  const navigate = useNavigate();

  // Supabase auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSendingMagic, setIsSendingMagic] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const routeByProfile = async (userId: string) => {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profErr) {
      // If profile not yet created by trigger, land on home
      navigate('/');
      return;
    }
    const role = (profile?.role as Role) ?? Role.User;
    navigate(getHomeRouteForRole(role));
  };

  // Email/password sign-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Get user role to determine redirect and validate role
        const { data: staffData } = await supabase
          .from('staff_table')
          .select('role')
          .eq('email', email)
          .single();
        
        const userRole = (staffData?.role as Role) || Role.User;
        
        // Validate that the user's role matches the selected login type
        if (selectedRole && userRole !== selectedRole) {
          setError(`This account is for ${userRole} role, but you selected ${selectedRole} login.`);
          setIsLoading(false);
          return;
        }
        
        navigate(getHomeRouteForRole(userRole));
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error during login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password → sends recovery email
  const handleReset = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setIsSendingReset(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        // CHANGED: include base path so hash token isn't lost by a redirect
        redirectTo: withBase('/auth/callback?type=recovery'),
      });
      if (resetErr) setError(resetErr.message);
      else setNotice('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Magic link (passwordless) sign-in
  const handleMagicLink = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setIsSendingMagic(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // CHANGED: include base path
          emailRedirectTo: withBase('/auth/callback'),
        },
      });
      if (otpErr) setError(otpErr.message);
      else setNotice('Magic link sent. Check your email.');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send magic link.');
    } finally {
      setIsSendingMagic(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError(null);
    setNotice(null);
    
    // Clear email and password fields
    setEmail('');
    setPassword('');
  };

  // Dev-only mock role buttons (keep for local testing)
  const handleMockLogin = async (role: Role) => {
    // For Hatchery and Sales roles, we need to find a user with that role from Supabase
    if (role === Role.HatcheryClerk || role === Role.SalesClerk) {
      try {
        const { data: staffData, error } = await supabase
          .from('staff_table')
          .select('*')
          .eq('role', role)
          .limit(1)
          .single();

        if (error || !staffData) {
          setError(`No ${role} users found in database. Please add a user with ${role} role.`);
          return;
        }

        // Use the first user found with this role
        const success = await login(staffData.email, staffData.password);
        
        if (success) {
          navigate(getHomeRouteForRole(role));
        } else {
          setError('Login failed');
        }
      } catch (err) {
        console.error('Error finding user:', err);
        setError('Error finding user for this role');
      }
    } else {
      // For Admin role, use Stefan's credentials
      const email = 'stefan.gravesande@gmail.com';
      const success = await login(email, '1234');
      
      if (success) {
        navigate(getHomeRouteForRole(role));
      } else {
        setError('Admin login failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="https://picsum.photos/150/60"
            alt="Bounty Farm Logo"
            className="mx-auto rounded mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">Hatchery MIS</h1>
          <p className="text-gray-500">Select your role to sign in</p>
        </div>

        {/* Role Selection Buttons */}
        <div className="space-y-3 mb-6">
          <div>
            <button
              onClick={() => handleRoleSelect(Role.Admin)}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                selectedRole === Role.Admin 
                  ? 'bg-bounty-blue-700 text-white' 
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              }`}
            >
              Admin
            </button>
            {/* Admin Login Form */}
            {selectedRole === Role.Admin && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}
                  {notice && (
                    <div className="bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded text-sm">
                      {notice}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-bounty-blue-600 text-white py-2 px-4 rounded-lg hover:bg-bounty-blue-700 transition-transform transform hover:scale-[1.01] disabled:opacity-60"
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-bounty-blue-600 hover:underline"
                      disabled={isSendingReset}
                    >
                      {isSendingReset ? 'Sending…' : 'Forgot password?'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => handleRoleSelect(Role.HatcheryClerk)}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                selectedRole === Role.HatcheryClerk 
                  ? 'bg-green-700 text-white' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Hatchery
            </button>
            {/* Hatchery Login Form */}
            {selectedRole === Role.HatcheryClerk && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}
                  {notice && (
                    <div className="bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded text-sm">
                      {notice}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-[1.01] disabled:opacity-60"
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-green-600 hover:underline"
                      disabled={isSendingReset}
                    >
                      {isSendingReset ? 'Sending…' : 'Forgot password?'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => handleRoleSelect(Role.SalesClerk)}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                selectedRole === Role.SalesClerk 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              Sales
            </button>
            {/* Sales Login Form */}
            {selectedRole === Role.SalesClerk && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}
                  {notice && (
                    <div className="bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded text-sm">
                      {notice}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-transform transform hover:scale-[1.01] disabled:opacity-60"
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-yellow-600 hover:underline"
                      disabled={isSendingReset}
                    >
                      {isSendingReset ? 'Sending…' : 'Forgot password?'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
