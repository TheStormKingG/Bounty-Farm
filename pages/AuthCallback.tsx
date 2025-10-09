// pages/AuthCallback.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../src/supabase';
import { Role } from '../types';

const homeFor = (role: Role) =>
  role === Role.Admin ? '/dashboard'
  : role === Role.HatcheryClerk ? '/hatch-cycles'
  : role === Role.SalesClerk ? '/sales' : '/';

async function routeByProfile(navigate: (p: string)=>void) {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return navigate('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
  const role = (profile?.role as Role) ?? Role.User;
  navigate(homeFor(role));
}

const SetPassword: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [p1, setP1] = useState(''); const [p2, setP2] = useState('');
  const [err, setErr] = useState<string|null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (p1.length < 8) return setErr('Password must be at least 8 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) setErr(error.message); else onDone();
  };
  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Set your password</h2>
      <input className="input mb-2 w-full border rounded px-3 py-2" type="password"
             placeholder="New password" value={p1} onChange={e=>setP1(e.target.value)} required/>
      <input className="input mb-3 w-full border rounded px-3 py-2" type="password"
             placeholder="Confirm password" value={p2} onChange={e=>setP2(e.target.value)} required/>
      {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
      <button className="w-full bg-bounty-blue-600 text-white py-2 rounded disabled:opacity-60" disabled={busy}>
        {busy ? 'Saving…' : 'Save password'}
      </button>
    </form>
  );
};

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const type = params.get('type'); // 'invite' | 'recovery' | null
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Ensure Supabase has processed URL tokens and created a session
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  const onDone = async () => { await routeByProfile(navigate); };

  if (!ready) return <div className="p-6">Signing you in…</div>;
  if (type === 'invite' || type === 'recovery') return <SetPassword onDone={onDone} />;
  onDone(); // magic link / email confirm
  return <div className="p-6">Redirecting…</div>;
};

export default AuthCallback;
