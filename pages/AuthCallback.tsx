import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../src/supabase';
import { Role } from '../types';

const getHome = (r: Role) =>
  r === Role.Admin ? '/dashboard' :
  r === Role.HatcheryClerk ? '/hatch-cycles' :
  r === Role.SalesClerk ? '/sales' : '/';

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'checking'|'set_password'|'error'|'done'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const routeByProfile = async (userId: string) => {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', userId).single();
    const role = (p?.role as Role) ?? Role.User;
    navigate(getHome(role), { replace: true });
  };

  useEffect(() => {
    (async () => {
      try {
        const qs = new URLSearchParams(location.search);
        const hs = new URLSearchParams((location.hash || '').replace(/^#/, ''));

        const access_token  = hs.get('access_token');
        const refresh_token = hs.get('refresh_token');
        const hashType      = hs.get('type');     // invite/recovery/magiclink…
        const queryType     = qs.get('type');     // invite/recovery…
        const token_hash    = qs.get('token');    // when Supabase sends ?token=…&type=…

        // 1) If hash has tokens → set session
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else if (token_hash && queryType) {
          // 2) If query has token/type → verify the OTP (invite/recovery)
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: queryType as any,  // 'invite' | 'recovery' | 'signup' | 'magiclink' | 'email_change'
          });
          if (error) throw error;
        } else {
          // 3) Nothing usable in URL → fail fast
          setError('Invalid or expired link. Please request a new invite or password reset.');
          setMode('error');
          return;
        }

        // 4) We should now have a session
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!user) {
          setError('Session could not be established. The link may have expired.');
          setMode('error');
          return;
        }

        // 5) If invite/recovery → ask the user to set a password
        const finalType = (hashType || queryType || '').toLowerCase();
        if (finalType === 'invite' || finalType === 'recovery') {
          setMode('set_password');
          return;
        }

        // 6) Otherwise route by role
        await routeByProfile(user.id);
        setMode('done');
      } catch (e: any) {
        setError(e?.message ?? 'Unexpected error while validating the link.');
        setMode('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters.');
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) throw new Error('Lost session. Please sign in.');
      await routeByProfile(user.id);
      setMode('done');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to set password.');
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 bg-white rounded shadow">Validating link…</div>
      </div>
    );
  }

  if (mode === 'set_password') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Set your password</h2>
          {error && <div className="mb-3 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          <form onSubmit={onSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                className="mt-1 block w-full border-gray-300 rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-bounty-blue-600 text-white py-2.5 rounded hover:bg-bounty-blue-700 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Invite / recovery link problem</h2>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
