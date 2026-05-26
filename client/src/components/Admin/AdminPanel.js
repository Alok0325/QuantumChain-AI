import React, { useState } from 'react';
import UserManagement from './UserManagement';
import KYCVerification from './KYCVerification';
import TransactionHistory from './TransactionHistory';
import PlatformSettings from './PlatformSettings';
import DashboardOverview from './DashboardOverview';

const ADMIN_STATS = {
  totalUsers: 15427,
  activeUsers: 8934,
  pendingKYC: 234,
  totalTransactions: 45789,
  dailyVolume: 2345678,
  monthlyVolume: 45678901,
};

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',         icon: '📊' },
  { id: 'users',        label: 'User Management',   icon: '👥' },
  { id: 'kyc',          label: 'KYC Verification',  icon: '🪪' },
  { id: 'transactions', label: 'Transactions',      icon: '💱' },
  { id: 'settings',     label: 'Platform Settings', icon: '⚙️' },
];

const TITLES = {
  dashboard:    'Dashboard Overview',
  users:        'User Management',
  kyc:          'KYC Verification',
  transactions: 'Transaction History',
  settings:     'Platform Settings',
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardOverview stats={ADMIN_STATS} />;
      case 'users':        return <UserManagement />;
      case 'kyc':          return <KYCVerification />;
      case 'transactions': return <TransactionHistory />;
      case 'settings':     return <PlatformSettings />;
      default:             return <DashboardOverview stats={ADMIN_STATS} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0b1018] text-slate-100">
      <aside className="w-64 shrink-0 flex flex-col bg-black/40 border-r border-white/[0.06] sticky top-0 h-screen">
        <div className="p-6 border-b border-white/[0.06]">
          <h2 className="m-0 text-xl font-bold qc-title-gradient">QuantumChain</h2>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Admin Panel</span>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActiveTab(n.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition ${
                activeTab === n.id
                  ? 'bg-cyan-300/15 text-cyan-300 border-l-2 border-cyan-300 -ml-0.5'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-base">{n.icon}</span>
              <span className="font-medium">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-2">
            <img
              src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff&size=40"
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h4 className="m-0 text-sm font-semibold truncate">Quantum</h4>
              <span className="text-xs text-slate-400">Super Admin</span>
            </div>
            <button type="button" className="p-2 rounded-md hover:bg-white/[0.06] text-rose-400" title="Logout">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="flex justify-between items-center gap-4 px-8 py-5 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h1 className="m-0 text-2xl font-bold">{TITLES[activeTab]}</h1>
            <p className="m-0 mt-1 text-sm text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="relative p-2.5 rounded-lg bg-white/5 border border-white/[0.06] hover:bg-white/10 transition" title="Notifications">
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[0.65rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </button>
            <button type="button" className="p-2.5 rounded-lg bg-white/5 border border-white/[0.06] hover:bg-white/10 transition" title="Help">
              <span className="text-lg">?</span>
            </button>
          </div>
        </header>

        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
