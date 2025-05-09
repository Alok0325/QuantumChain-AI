import React, { useState, useEffect } from 'react';
import binanceService from '../../../../../services/binanceService';
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
  const [accountInfo, setAccountInfo] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchAccountInfo();
      fetchRecentTrades();
    }
  }, [isConnected]);

  const fetchAccountInfo = async () => {
    try {
      setLoading(true);
      const info = await binanceService.getAccountInfo();
      setAccountInfo(info);
      setError(null);
    } catch (err) {
      setError('Failed to fetch account information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const trades = await binanceService.getRecentTrades('BTCUSDT');
      setRecentTrades(trades);
    } catch (err) {
      console.error('Error fetching recent trades:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      await fetchAccountInfo();
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
    setAccountInfo(null);
    setRecentTrades([]);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const order = await binanceService.createOrder(
        transactionData.symbol,
        transactionType.toUpperCase(),
        'LIMIT',
        transactionData.amount,
        transactionData.price
      );

      if (onTransaction) {
        onTransaction({
          type: transactionType,
          symbol: transactionData.symbol,
          amount: parseFloat(transactionData.amount),
          price: parseFloat(transactionData.price),
          total: parseFloat(transactionData.amount) * parseFloat(transactionData.price),
          date: new Date().toISOString(),
          orderId: order.orderId
        });
      }

      setShowTransactionModal(false);
      setTransactionData({ symbol: '', amount: '', price: '' });
      fetchAccountInfo();
      fetchRecentTrades();
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
          <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png" alt="Binance" />
          {loading ? 'Connecting...' : 'Connect Binance'}
        </button>
      ) : (
        <div className="binance-connected">
          <div className="connection-status">
            <span className="status-dot connected"></span>
            Connected to Binance
          </div>
          
          {accountInfo && (
            <div className="account-summary">
              <h4>Account Summary</h4>
              <div className="balance-list">
                {accountInfo.balances
                  .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
                  .map(balance => (
                    <div key={balance.asset} className="balance-item">
                      <span className="asset">{balance.asset}</span>
                      <span className="amount">Free: {balance.free}</span>
                      <span className="amount">Locked: {balance.locked}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

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

          {recentTrades.length > 0 && (
            <div className="recent-trades">
              <h4>Recent Trades</h4>
              <div className="trades-list">
                {recentTrades.slice(0, 5).map((trade, index) => (
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
          )}
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