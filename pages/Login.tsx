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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="modern-card w-full max-w-4xl animate-fade-in-up">
        <div className="flex h-[600px] rounded-2xl overflow-hidden">
          {/* Left Panel - Welcome Section */}
          <div className="w-2/5 bg-gradient-to-br from-[#F86F6F] to-[#FFB0B0] relative flex items-center justify-center p-8">
            {/* Decorative Spheres */}
            <div className="decorative-sphere sphere-large top-8 left-8"></div>
            <div className="decorative-sphere sphere-medium top-16 right-12"></div>
            <div className="decorative-sphere sphere-small bottom-12 left-16"></div>
            <div className="decorative-sphere sphere-small bottom-8 right-8"></div>
            
            {/* Bounty Farm Logo */}
            <div className="text-center text-white z-10 flex flex-col items-center justify-center h-full">
              <div className="w-96 h-96 mx-auto mb-8">
                <img 
                  src="images/BPF-Stefan-8.png" 
                  alt="Bounty Farm Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Logo failed to load:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-4xl font-bold mb-4">WELCOME TO BFLOS!</h1>
              <p className="text-xl opacity-90">To the zone of happiness.</p>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-3/5 bg-[#F5F0EE] p-8 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h2 className="heading-secondary mb-8">Welcome to BFLOS <span className="text-sm">(Bounty Farm Limited's Operational Software)</span></h2>
              
              {/* Role Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <button
                    onClick={() => handleRoleSelect(Role.Admin)}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                      selectedRole === Role.Admin 
                        ? 'btn-primary' 
                        : 'btn-secondary'
                    }`}
                  >
                    Admin
                  </button>
                  {/* Admin Login Form */}
                  {selectedRole === Role.Admin && (
                    <div className="mt-4 p-6 bg-white rounded-xl border border-[#F5F0EE] shadow-sm">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-[#333333] mb-2">Email</label>
                          <input
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modern-input w-full"
                            placeholder="stefan.gravesande@gmail.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#333333] mb-2">Password</label>
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                          </div>
                        )}
                        {notice && (
                          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                            {notice}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full btn-primary py-3 disabled:opacity-50"
                        >
                          {isLoading ? 'Signing in…' : 'Sign In'}
                        </button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="text-sm text-[#5C3A6B] hover:underline font-medium"
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
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                      selectedRole === Role.HatcheryClerk 
                        ? 'btn-coral' 
                        : 'btn-secondary'
                    }`}
                  >
                    Hatchery
                  </button>
                  {/* Hatchery Login Form */}
                  {selectedRole === Role.HatcheryClerk && (
                    <div className="mt-4 p-6 bg-white rounded-xl border border-[#F5F0EE] shadow-sm">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-[#333333] mb-2">Email</label>
                          <input
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#333333] mb-2">Password</label>
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                          </div>
                        )}
                        {notice && (
                          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                            {notice}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full btn-coral py-3 disabled:opacity-50"
                        >
                          {isLoading ? 'Signing in…' : 'Sign In'}
                        </button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="text-sm text-[#F86F6F] hover:underline font-medium"
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
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                      selectedRole === Role.SalesClerk 
                        ? 'btn-primary' 
                        : 'btn-secondary'
                    }`}
                  >
                    Sales
                  </button>
                  {/* Sales Login Form */}
                  {selectedRole === Role.SalesClerk && (
                    <div className="mt-4 p-6 bg-white rounded-xl border border-[#F5F0EE] shadow-sm">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-[#333333] mb-2">Email</label>
                          <input
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#333333] mb-2">Password</label>
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                          </div>
                        )}
                        {notice && (
                          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                            {notice}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full btn-primary py-3 disabled:opacity-50"
                        >
                          {isLoading ? 'Signing in…' : 'Sign In'}
                        </button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="text-sm text-[#5C3A6B] hover:underline font-medium"
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
        </div>
      </div>
    </div>
  );
};

export default Login;
