import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '', code: '' });
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(formData);
    if (result.success) navigate('/portfolio');
    else if (result.requires2FA) { setRequires2FA(true); setError(result.message); }
    else { setRequires2FA(false); setError(result.message); }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-8 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(circle at 20% 20%, rgba(110,231,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184,132,255,0.1) 0%, transparent 50%)' }} />
      <div className="relative z-10 w-full max-w-md bg-black/70 backdrop-blur-lg rounded-2xl p-10 border border-cyan-300/15 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6 qc-title-gradient">Login to Your Account</h2>
        {error && (
          <div className="bg-rose-500/12 border border-rose-400/30 text-rose-300 px-4 py-3 rounded-lg text-center mb-5 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="emailOrPhone" className="text-cyan-300 text-sm font-medium">Email or Phone</label>
            <input
              type="text" id="emailOrPhone" name="emailOrPhone" autoComplete="username" required
              disabled={requires2FA}
              className="qc-input disabled:opacity-60"
              value={formData.emailOrPhone} onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-cyan-300 text-sm font-medium">Password</label>
            <input
              type="password" id="password" name="password" autoComplete="current-password" required
              disabled={requires2FA}
              className="qc-input disabled:opacity-60"
              value={formData.password} onChange={handleChange}
            />
          </div>
          {requires2FA && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-cyan-300 text-sm font-medium">TOTP or backup code</label>
              <input
                type="text" id="code" name="code" autoComplete="one-time-code"
                maxLength={12} placeholder="123456 or ABCD-EF12" autoFocus required
                className="qc-input"
                value={formData.code} onChange={handleChange}
              />
            </div>
          )}
          <button
            type="submit"
            className="mt-3 py-3 px-4 rounded-lg font-semibold uppercase tracking-wider text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6ee7ff 0%, #4fa3ff 100%)' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : requires2FA ? 'Verify code' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-6 text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-cyan-300 font-semibold hover:text-white transition">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
