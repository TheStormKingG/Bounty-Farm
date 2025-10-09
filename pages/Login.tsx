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
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        return;
      }
      if (!data.user) {
        setError('Login failed: no user returned.');
        return;
      }
      await routeByProfile(data.user.id);
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

  // Dev-only mock role buttons (keep for local testing)
  const handleMockLogin = (role: Role) => {
    login(role);
    navigate(getHomeRouteForRole(role));
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
          <p className="text-gray-500">Sign in with your account</p>
        </div>

        {/* Email/Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm px-3 py-2"
              placeholder="you@bounty.farm"
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
              placeholder="••••••••"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-bounty-blue-600 hover:underline"
                disabled={isSendingReset}
              >
                {isSendingReset ? 'Sending…' : 'Forgot password?'}
              </button>
              <button
                type="button"
                onClick={handleMagicLink}
                className="text-sm text-gray-600 hover:underline"
                disabled={isSendingMagic}
              >
                {isSendingMagic ? 'Sending…' : 'Email me a magic link'}
              </button>
            </div>
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
            className="w-full bg-bounty-blue-600 text-white py-3 px-4 rounded-lg hover:bg-bounty-blue-700 transition-transform transform hover:scale-[1.01] disabled:opacity-60"
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-xs uppercase text-gray-400">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>

        {/* Dev Mock Login (local testing) */}
        <p className="text-xs text-gray-500 mb-2">Development quick login</p>
        <div className="space-y-3">
          <button
            onClick={() => handleMockLogin(Role.Admin)}
            className="w-full bg-gray-800 text-white py-2.5 px-4 rounded-lg hover:bg-gray-900 transition"
          >
            Login as Admin (Dev)
          </button>
          <button
            onClick={() => handleMockLogin(Role.HatcheryClerk)}
            className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Login as Hatchery Clerk (Dev)
          </button>
          <button
            onClick={() => handleMockLogin(Role.SalesClerk)}
            className="w-full bg-yellow-500 text-white py-2.5 px-4 rounded-lg hover:bg-yellow-600 transition"
          >
            Login as Sales Clerk (Dev)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
