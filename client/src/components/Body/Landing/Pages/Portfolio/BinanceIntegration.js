import React, { useState } from 'react';
import './BinanceIntegration.css';

const BinanceIntegration = ({ onTransaction }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('buy');
  const [transactionData, setTransactionData] = useState({
    symbol: '',
    amount: '',
    price: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dummy account data
  const dummyAccountInfo = {
    balances: [
      { asset: 'BTC', free: '2.5643', locked: '0.1000' },
      { asset: 'ETH', free: '15.234', locked: '0.500' },
      { asset: 'SOL', free: '234.567', locked: '10.000' },
      { asset: 'USDT', free: '25678.90', locked: '1000.00' }
    ]
  };

  // Dummy recent trades
  const dummyRecentTrades = [
    {
      symbol: 'BTCUSDT',
      price: '35678.90',
      qty: '0.5432',
      time: Date.now() - 3600000,
      isBuyer: true
    },
    {
      symbol: 'ETHUSDT',
      price: '2890.12',
      qty: '3.456',
      time: Date.now() - 7200000,
      isBuyer: false
    },
    {
      symbol: 'SOLUSDT',
      price: '89.32',
      qty: '45.678',
      time: Date.now() - 10800000,
      isBuyer: true
    }
  ];

  const handleConnect = async () => {
    try {
      setLoading(true);
      // Simulate API connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Failed to connect to Binance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onTransaction) {
        onTransaction({
          type: transactionType,
          symbol: transactionData.symbol,
          amount: parseFloat(transactionData.amount),
          price: parseFloat(transactionData.price),
          total: parseFloat(transactionData.amount) * parseFloat(transactionData.price),
          date: new Date().toISOString()
        });
      }

      setShowTransactionModal(false);
      setTransactionData({ symbol: '', amount: '', price: '' });
    } catch (err) {
      setError('Failed to execute transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="binance-integration">
      {!isConnected ? (
        <button 
          className="connect-button" 
          onClick={handleConnect}
          disabled={loading}
        >
          <span className="binance-icon">₿</span>
          <span className="connect-text">
            {loading ? 'Connecting...' : 'Connect Binance'}
          </span>
        </button>
      ) : (
        <div className="binance-connected">
          <div className="connection-status">
            <span className="status-dot connected"></span>
            Connected to Binance
          </div>
          
          <div className="account-summary">
            <h4>Account Summary</h4>
            <div className="balance-list">
              {dummyAccountInfo.balances.map(balance => (
                <div key={balance.asset} className="balance-item">
                  <span className="asset">{balance.asset}</span>
                  <span className="amount">Free: {balance.free}</span>
                  <span className="amount">Locked: {balance.locked}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="binance-actions">
            <button 
              className="action-button buy"
              onClick={() => {
                setTransactionType('buy');
                setShowTransactionModal(true);
              }}
              disabled={loading}
            >
              Buy
            </button>
            <button 
              className="action-button sell"
              onClick={() => {
                setTransactionType('sell');
                setShowTransactionModal(true);
              }}
              disabled={loading}
            >
              Sell
            </button>
            <button 
              className="action-button disconnect" 
              onClick={handleDisconnect}
              disabled={loading}
            >
              Disconnect
            </button>
          </div>

          <div className="recent-trades">
            <h4>Recent Trades</h4>
            <div className="trades-list">
              {dummyRecentTrades.map((trade, index) => (
                <div key={index} className="trade-item">
                  <span className={`side ${trade.isBuyer ? 'buy' : 'sell'}`}>
                    {trade.isBuyer ? 'BUY' : 'SELL'}
                  </span>
                  <span className="amount">{trade.qty} {trade.symbol}</span>
                  <span className="price">${trade.price}</span>
                  <span className="time">{new Date(trade.time).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showTransactionModal && (
        <div className="transaction-modal">
          <div className="modal-content">
            <h3>{transactionType === 'buy' ? 'Buy' : 'Sell'} Cryptocurrency</h3>
            <form onSubmit={handleTransactionSubmit}>
              <div className="form-group">
                <label>Symbol</label>
                <input
                  type="text"
                  value={transactionData.symbol}
                  onChange={(e) => setTransactionData({ ...transactionData, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., BTCUSDT"
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                  placeholder="Amount"
                  step="any"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (USD)</label>
                <input
                  type="number"
                  value={transactionData.price}
                  onChange={(e) => setTransactionData({ ...transactionData, price: e.target.value })}
                  placeholder="Price per unit"
                  step="any"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : transactionType === 'buy' ? 'Buy' : 'Sell'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowTransactionModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinanceIntegration; 