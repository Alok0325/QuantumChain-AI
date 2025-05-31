import React, { useState } from 'react';
import './AdminComponents.css';

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy user data
  const users = Array.from({ length: 20 }, (_, i) => {
    const names = [
      'Quantum Master', 'Heisenberg Prime', 'Schrödinger Elite', 'Planck Observer',
      'Bohr Analyst', 'Dirac Supervisor', 'Einstein Overseer', 'Feynman Controller',
      'Maxwell Guardian', 'Tesla Watcher', 'Curie Monitor', 'Hawking Sentinel',
      'Newton Keeper', 'Pauli Protector', 'Fermi Director', 'Born Coordinator',
      'Compton Manager', 'Rutherford Lead', 'Bohm Administrator', 'Lorentz Chief'
    ];
    
    const emailProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    const randomProvider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
    const email = names[i].toLowerCase()
      .replace(/\s+/g, '.')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      + Math.floor(Math.random() * 100)
      + '@' + randomProvider;
    
    return {
      id: i + 1,
      name: names[i],
      email: email,
      phone: `+91 98765432${i + 1}`.slice(0, 14),
      joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)],
      kycStatus: ['verified', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
      tradingVolume: Math.floor(Math.random() * 1000000),
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      role: Math.random() > 0.9 ? 'admin' : 'user',
      twoFactorEnabled: Math.random() > 0.5,
      loginHistory: Array.from({ length: 5 }, () => ({
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        device: ['Chrome / Windows', 'Safari / macOS', 'Firefox / Linux', 'Mobile / Android', 'Mobile / iOS'][Math.floor(Math.random() * 5)]
      })),
      transactions: Array.from({ length: 5 }, () => ({
        id: Math.random().toString(36).substr(2, 9),
        type: ['buy', 'sell'][Math.floor(Math.random() * 2)],
        amount: Math.random() * 10000,
        currency: ['BTC', 'ETH', 'USDT'][Math.floor(Math.random() * 3)],
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))
    };
  });

  const handleStatusChange = (userId, newStatus) => {
    console.log(`Changing status of user ${userId} to ${newStatus}`);
  };

  const handleRoleChange = (userId, newRole) => {
    console.log(`Changing role of user ${userId} to ${newRole}`);
  };

  const filteredUsers = users.filter(user => {
    if (filter !== 'all' && user.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query)
      );
    }
    return true;
  });

  return (
    <div className="user-management">
      <div className="management-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive
          </button>
          <button 
            className={`filter-btn ${filter === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilter('suspended')}
          >
            Suspended
          </button>
        </div>

        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="users-grid">
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>KYC</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr 
                  key={user.id}
                  className={selectedUser?.id === user.id ? 'selected' : ''}
                  onClick={() => setSelectedUser(user)}
                >
                  <td>
                    <div className="user-cell">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        alt={user.name}
                      />
                      <div>
                        <h4>{user.name}</h4>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`status-badge ${user.status}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </div>
                  </td>
                  <td>
                    <div className={`status-badge ${user.kycStatus}`}>
                      {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
                    </div>
                  </td>
                  <td>
                    <div className={`role-badge ${user.role}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                  </td>
                  <td>
                    {new Date(user.joinedDate).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className={`action-btn ${user.status === 'suspended' ? 'restore' : 'suspend'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(
                            user.id, 
                            user.status === 'suspended' ? 'active' : 'suspended'
                          );
                        }}
                      >
                        <i className={`fas fa-${user.status === 'suspended' ? 'undo' : 'ban'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <div className="user-details">
            <div className="details-header">
              <h3>User Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="details-content">
              <section className="detail-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>Joined Date</label>
                    <p>{new Date(selectedUser.joinedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Account Status</h4>
                <div className="status-controls">
                  <div className="control-group">
                    <label>Account Status</label>
                    <select
                      value={selectedUser.status}
                      onChange={(e) => handleStatusChange(selectedUser.id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>User Role</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>2FA Status</label>
                    <div className={`status-badge ${selectedUser.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                      {selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Recent Activity</h4>
                <div className="activity-list">
                  {selectedUser.loginHistory.map((login, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon login">
                        <i className="fas fa-sign-in-alt"></i>
                      </div>
                      <div className="activity-details">
                        <p>Logged in from {login.device}</p>
                        <span>IP: {login.ip}</span>
                        <span>{new Date(login.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="detail-section">
                <h4>Recent Transactions</h4>
                <div className="transactions-list">
                  {selectedUser.transactions.map((transaction, index) => (
                    <div key={index} className="transaction-item">
                      <div className={`transaction-icon ${transaction.type}`}>
                        <i className={`fas fa-${transaction.type === 'buy' ? 'arrow-down' : 'arrow-up'}`}></i>
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-info">
                          <h5>{transaction.type === 'buy' ? 'Bought' : 'Sold'} {transaction.currency}</h5>
                          <span className={`status-badge ${transaction.status}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                        <div className="transaction-meta">
                          <span>{transaction.amount.toFixed(2)} {transaction.currency}</span>
                          <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement; 