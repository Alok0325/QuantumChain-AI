import React, { useState } from 'react';
import './AdminPanel.css';
import UserManagement from './UserManagement';
import KYCVerification from './KYCVerification';
import TransactionHistory from './TransactionHistory';
import PlatformSettings from './PlatformSettings';
import DashboardOverview from './DashboardOverview';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dummy admin data
  const adminStats = {
    totalUsers: 15427,
    activeUsers: 8934,
    pendingKYC: 234,
    totalTransactions: 45789,
    dailyVolume: 2345678,
    monthlyVolume: 45678901
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={adminStats} />;
      case 'users':
        return <UserManagement />;
      case 'kyc':
        return <KYCVerification />;
      case 'transactions':
        return <TransactionHistory />;
      case 'settings':
        return <PlatformSettings />;
      default:
        return <DashboardOverview stats={adminStats} />;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>QuantumChain</h2>
          <span>Admin Panel</span>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-chart-line"></i>
            Dashboard
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            User Management
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc')}
          >
            <i className="fas fa-id-card"></i>
            KYC Verification
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="fas fa-exchange-alt"></i>
            Transactions
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i>
            Platform Settings
          </button>
        </nav>

        <div className="admin-profile">
          <div className="profile-info">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Admin" />
            <div>
              <h4>Quantum</h4>
              <span>Super Admin</span>
            </div>
          </div>
          <button className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <div className="header-title">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'kyc' && 'KYC Verification'}
              {activeTab === 'transactions' && 'Transaction History'}
              {activeTab === 'settings' && 'Platform Settings'}
            </h1>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="header-actions">
            <button className="notification-btn">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>
            <button className="help-btn">
              <i className="fas fa-question-circle"></i>
            </button>
          </div>
        </div>

        <div className="admin-main">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 