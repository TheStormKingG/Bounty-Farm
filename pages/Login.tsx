import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { supabase } from '../src/supabase';

const getHomeRouteForRole = (role: Role) => {
  switch (role) {
    case Role.Admin:
      return '/dashboard';
    case Role.HatcheryClerk:
      return '/hatch-cycles';
    case Role.SalesClerk:
      return '/sales';
    case Role.Farmer:
      return '/farm'; // Farmers go to farm page
    case Role.User:
      return '/';
    default:
      return '/';
  }
};

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email/password sign-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Get user role to determine redirect
        const { data: staffData } = await supabase
          .from('staff_table')
          .select('role, name')
          .eq('email', email)
          .single();
        
        const userRole = (staffData?.role as Role) || Role.User;
        
        console.log('Login debug:', {
          email,
          userRole,
          staffData,
          farmName: staffData?.name
        });
        
        // For farmers, redirect to their specific farm page
        if (userRole === Role.Farmer) {
          // Extract farm name from user name and navigate to farm detail
          const farmName = staffData?.name || '';
          console.log('Farmer login - navigating to:', `/farmer/${encodeURIComponent(farmName)}`);
          navigate(`/farmer/${encodeURIComponent(farmName)}`);
        } else {
          console.log('Non-farmer login - navigating to:', getHomeRouteForRole(userRole));
          navigate(getHomeRouteForRole(userRole));
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 overflow-y-auto">
      <div className="modern-card w-full max-w-4xl animate-fade-in-up my-8">
        <div className="flex flex-col lg:flex-row h-auto lg:h-[600px] rounded-2xl overflow-hidden">
          {/* Left Panel - Welcome Section */}
          <div className="w-full lg:w-2/5 bg-gradient-to-br from-[#F86F6F] to-[#FFB0B0] relative flex items-center justify-center p-4 lg:p-8 min-h-[300px] lg:min-h-[600px]">
            {/* Decorative Spheres */}
            <div className="decorative-sphere sphere-large top-4 lg:top-8 left-4 lg:left-8"></div>
            <div className="decorative-sphere sphere-medium top-8 lg:top-16 right-6 lg:right-12"></div>
            <div className="decorative-sphere sphere-small bottom-6 lg:bottom-12 left-8 lg:left-16"></div>
            <div className="decorative-sphere sphere-small bottom-4 lg:bottom-8 right-4 lg:right-8"></div>
            
            {/* Bounty Farm Logo */}
            <div className="text-center text-white z-10 flex flex-col items-center justify-center h-full">
              <div className="w-48 h-48 lg:w-96 lg:h-96 mx-auto">
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
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full lg:w-3/5 bg-[#F5F0EE] p-4 lg:p-8 flex flex-col justify-start overflow-y-auto">
            <div className="max-w-md mx-auto w-full">
              <h2 className="heading-secondary mb-6 lg:mb-8 text-center lg:text-left">
                WELCOME TO BFLOS!
                <br />
                <span className="text-sm font-normal whitespace-nowrap">(Bounty Farm Limited's Operational Software)</span>
              </h2>
              
              {/* Login Form */}
              <div className="space-y-4">
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
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3 font-semibold"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;