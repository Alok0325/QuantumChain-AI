import React, { useState } from 'react';
import './AdminComponents.css';

const TransactionHistory = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Dummy transaction data
  const transactions = Array.from({ length: 50 }, (_, i) => {
    const names = [
      'Quantum Master', 'Heisenberg Prime', 'Schrödinger Elite', 'Planck Observer',
      'Bohr Analyst', 'Dirac Supervisor', 'Einstein Overseer', 'Feynman Controller',
      'Maxwell Guardian', 'Tesla Watcher', 'Curie Monitor', 'Hawking Sentinel',
      'Newton Keeper', 'Pauli Protector', 'Fermi Director', 'Born Coordinator',
      'Compton Manager', 'Rutherford Lead', 'Bohm Administrator', 'Lorentz Chief'
    ];
    const userIndex = i % names.length;
    const userName = names[userIndex];
    
    const emailProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    const randomProvider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
    const userEmail = userName.toLowerCase()
      .replace(/\s+/g, '.')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      + Math.floor(Math.random() * 100)
      + '@' + randomProvider;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      user: {
        id: userIndex + 1,
        name: userName,
        email: userEmail
      },
      type: ['buy', 'sell'][Math.floor(Math.random() * 2)],
      amount: Math.random() * 10000,
      price: Math.random() * 50000,
      currency: ['BTC', 'ETH', 'USDT'][Math.floor(Math.random() * 3)],
      status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      fee: Math.random() * 100,
      txHash: `0x${Math.random().toString(36).substr(2, 40)}`,
      details: {
        orderType: ['market', 'limit'][Math.floor(Math.random() * 2)],
        platform: ['web', 'mobile', 'api'][Math.floor(Math.random() * 3)],
        ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        device: ['Chrome / Windows', 'Safari / macOS', 'Firefox / Linux', 'Mobile / Android', 'Mobile / iOS'][Math.floor(Math.random() * 5)]
      }
    };
  });

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.status !== filter) return false;
    
    if (dateRange.start && new Date(tx.timestamp) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(tx.timestamp) > new Date(dateRange.end)) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tx.user.name.toLowerCase().includes(query) ||
        tx.user.email.toLowerCase().includes(query) ||
        tx.id.toLowerCase().includes(query) ||
        tx.txHash.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getTotalVolume = () => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.amount * tx.price, 0);
  };

  const getSuccessRate = () => {
    const completed = filteredTransactions.filter(tx => tx.status === 'completed').length;
    return (completed / filteredTransactions.length) * 100;
  };

  return (
    <div className="transaction-history">
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-info">
            <h3>Total Volume</h3>
            <p>${getTotalVolume().toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>Success Rate</h3>
            <p>{getSuccessRate().toFixed(1)}%</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div className="stat-info">
            <h3>Total Transactions</h3>
            <p>{filteredTransactions.length}</p>
          </div>
        </div>
      </div>

      <div className="history-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
        </div>

        <div className="date-filters">
          <div className="date-input">
            <label>From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div className="date-input">
            <label>To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search by user, transaction ID, or hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="transactions-grid">
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr 
                  key={tx.id}
                  className={selectedTransaction?.id === tx.id ? 'selected' : ''}
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <td>
                    <span className="tx-id">{tx.id}</span>
                  </td>
                  <td>
                    <div className="user-cell">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${tx.user.name}&background=random`}
                        alt={tx.user.name}
                      />
                      <div>
                        <h4>{tx.user.name}</h4>
                        <span>{tx.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`type-badge ${tx.type}`}>
                      {tx.type === 'buy' ? 'Buy' : 'Sell'}
                    </div>
                  </td>
                  <td>
                    <div className="amount-cell">
                      <span className="amount">{tx.amount.toFixed(8)}</span>
                      <span className="currency">{tx.currency}</span>
                    </div>
                  </td>
                  <td>
                    <div className={`status-badge ${tx.status}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </div>
                  </td>
                  <td>
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransaction(tx);
                      }}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedTransaction && (
          <div className="transaction-details">
            <div className="details-header">
              <h3>Transaction Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedTransaction(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="details-content">
              <section className="detail-section">
                <h4>Transaction Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Transaction ID</label>
                    <p>{selectedTransaction.id}</p>
                  </div>
                  <div className="info-item">
                    <label>Type</label>
                    <p>{selectedTransaction.type.toUpperCase()}</p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <div className={`status-badge ${selectedTransaction.status}`}>
                      {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Timestamp</label>
                    <p>{new Date(selectedTransaction.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Amount Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Amount</label>
                    <p>{selectedTransaction.amount.toFixed(8)} {selectedTransaction.currency}</p>
                  </div>
                  <div className="info-item">
                    <label>Price</label>
                    <p>${selectedTransaction.price.toFixed(2)}</p>
                  </div>
                  <div className="info-item">
                    <label>Total Value</label>
                    <p>${(selectedTransaction.amount * selectedTransaction.price).toFixed(2)}</p>
                  </div>
                  <div className="info-item">
                    <label>Fee</label>
                    <p>${selectedTransaction.fee.toFixed(2)}</p>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>User Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{selectedTransaction.user.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{selectedTransaction.user.email}</p>
                  </div>
                  <div className="info-item">
                    <label>User ID</label>
                    <p>{selectedTransaction.user.id}</p>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Technical Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Transaction Hash</label>
                    <p className="hash">{selectedTransaction.txHash}</p>
                  </div>
                  <div className="info-item">
                    <label>Order Type</label>
                    <p>{selectedTransaction.details.orderType.toUpperCase()}</p>
                  </div>
                  <div className="info-item">
                    <label>Platform</label>
                    <p>{selectedTransaction.details.platform.toUpperCase()}</p>
                  </div>
                  <div className="info-item">
                    <label>IP Address</label>
                    <p>{selectedTransaction.details.ip}</p>
                  </div>
                  <div className="info-item">
                    <label>Device</label>
                    <p>{selectedTransaction.details.device}</p>
                  </div>
                </div>
              </section>

              {selectedTransaction.status === 'failed' && (
                <section className="detail-section error-section">
                  <h4>Error Information</h4>
                  <div className="error-details">
                    <i className="fas fa-exclamation-circle"></i>
                    <div>
                      <h5>Transaction Failed</h5>
                      <p>The transaction failed due to insufficient funds in the user's account.</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory; 