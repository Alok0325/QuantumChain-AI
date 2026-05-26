import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters');
    if (formData.phone.length !== 10) return setError('Phone number must be 10 digits');

    const result = await register({
      name: formData.name, phone: formData.phone,
      email: formData.email, password: formData.password,
    });
    if (result.success) navigate('/portfolio');
    else setError(result.message);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-8 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(circle at 20% 20%, rgba(110,231,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184,132,255,0.1) 0%, transparent 50%)' }} />
      <div className="relative z-10 w-full max-w-md bg-black/70 backdrop-blur-lg rounded-2xl p-10 border border-cyan-300/15 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-2 qc-title-gradient">Create Account</h2>
        <p className="text-center text-slate-400 mb-6">Join QuantumChain AI and start trading</p>

        {error && (
          <div className="bg-rose-500/12 border border-rose-400/30 text-rose-300 px-4 py-3 rounded-lg text-center mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { id: 'name', label: 'Name', type: 'text', autoComplete: 'name', placeholder: 'Enter your full name' },
            { id: 'phone', label: 'Phone Number (10 digits)', type: 'tel', autoComplete: 'tel', placeholder: '1234567890', maxLength: 10 },
            { id: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
            { id: 'password', label: 'Password (min 8 chars)', type: 'password', autoComplete: 'new-password', placeholder: 'Create a password' },
            { id: 'confirmPassword', label: 'Confirm Password', type: 'password', autoComplete: 'new-password', placeholder: 'Confirm your password' },
          ].map((f) => (
            <div className="flex flex-col gap-1.5" key={f.id}>
              <label htmlFor={f.id} className="text-cyan-300 text-sm font-medium">{f.label}</label>
              <input
                id={f.id} name={f.id}
                type={f.type}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                maxLength={f.maxLength}
                required
                className="qc-input"
                value={formData[f.id]} onChange={handleChange}
              />
            </div>
          ))}

          <button
            type="submit"
            className="mt-3 py-3 px-4 rounded-lg font-semibold uppercase tracking-wider text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6ee7ff 0%, #4fa3ff 100%)' }}
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-300 font-semibold hover:text-white transition">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
