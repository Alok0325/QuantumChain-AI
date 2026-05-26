import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

const NAV = [
  { to: '/market', label: 'Market' },
  { to: '/p2p', label: 'P2P' },
  { to: '/trade', label: 'Trade' },
  { to: '/predictions', label: 'Predictions' },
  { to: '/about', label: 'About' },
];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const toggleMenu = () => { setIsMenuOpen((v) => !v); setIsProfileOpen(false); };
  const toggleProfile = () => { setIsProfileOpen((v) => !v); setIsMenuOpen(false); };

  const navLinkCls = 'text-slate-100 font-medium relative transition hover:text-cyan-300 after:content-[""] after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-cyan-300 after:transition-[width] hover:after:w-full';

  return (
    <header className="fixed top-0 inset-x-0 z-[1000] bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        <div>
          <Link to="/">
            <h1 className="m-0 text-2xl font-bold tracking-wider uppercase qc-title-gradient">
              QuantumChain AI
            </h1>
          </Link>
        </div>

        <nav
          ref={menuRef}
          className={`md:static md:translate-y-0 md:opacity-100 md:visible md:bg-transparent md:p-0
            fixed top-[70px] inset-x-0 bg-black/95 backdrop-blur-lg p-4 transition
            ${isMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'}`}
        >
          <ul className="flex md:flex-row flex-col gap-4 md:gap-8 list-none m-0 p-0">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className={navLinkCls} onClick={() => setIsMenuOpen(false)}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex gap-4 items-center">
          {user ? (
            <div className="relative ml-4 z-[1001]" ref={profileRef}>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/40 border border-cyan-300/15 text-slate-100 cursor-pointer transition hover:bg-cyan-300/10 hover:border-cyan-300/40"
                onClick={toggleProfile}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-cyan-300 shadow-[0_0_10px_rgba(110,231,255,0.3)] shrink-0">
                  <img
                    src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0D8ABC&color=fff&size=32`}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium hidden md:inline">{user.name || 'User'}</span>
                <span className={`inline-block w-2 h-2 border-r-2 border-b-2 border-white transition-transform ${
                  isProfileOpen ? 'rotate-[-135deg]' : 'rotate-45'
                }`} />
              </button>

              <div className={`absolute right-0 top-[calc(100%+0.75rem)] w-60 bg-black/95 backdrop-blur-lg border border-cyan-300/15 rounded-lg p-2 transition shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${
                isProfileOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
              }`}>
                <div className="px-3 py-3 border-b border-white/10 flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white">{user.name || 'User'}</span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </span>
                </div>
                {[
                  ['/portfolio',           '📊', 'Portfolio'],
                  ['/profile',             '👤', 'Profile Settings'],
                  ['/settings/positions',  '📈', 'Positions'],
                  ['/settings/accuracy',   '🎯', 'Model Accuracy'],
                  ['/settings/reconcile',  '🔍', 'Reconcile Trades'],
                  ['/settings/api-keys',   '🔑', 'API Keys'],
                  ['/settings/2fa',        '🛡️', 'Two-Factor'],
                ].map(([to, icon, label]) => (
                  <Link
                    key={to} to={to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-100 hover:bg-cyan-300/10 my-1 transition"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="text-cyan-300">{icon}</span> {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-rose-400 hover:bg-rose-500/10 w-full text-left my-1 transition"
                >
                  <span>⏻</span> Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg font-medium text-white border border-white/20 bg-transparent transition hover:bg-white/10 hover:border-white/30 text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-lg font-semibold text-slate-900 border-0 transition hover:-translate-y-0.5 hover:shadow-lg text-sm"
                style={{ background: 'linear-gradient(135deg, #6ee7ff 0%, #b884ff 100%)' }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-0 cursor-pointer p-1.5"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;
