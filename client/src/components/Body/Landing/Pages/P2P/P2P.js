import React, { useState } from 'react';
import './P2P.css';

const P2P = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [selectedFiat, setSelectedFiat] = useState('USD');
  const [amount, setAmount] = useState('');

  const coins = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'SOL', name: 'Solana' },
  ];

  const fiatCurrencies = [
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'EUR', name: 'Euro' },
    { symbol: 'GBP', name: 'British Pound' },
    { symbol: 'INR', name: 'Indian Rupee' },
  ];

  const mockListings = [
    {
      id: 1,
      user: 'CryptoTrader123',
      rating: 4.9,
      completedTrades: 156,
      price: 65432.21,
      limits: { min: 100, max: 10000 },
      paymentMethods: ['Bank Transfer', 'PayPal'],
      available: 2.5,
    },
    {
      id: 2,
      user: 'QuantumTrader',
      rating: 4.8,
      completedTrades: 89,
      price: 65450.00,
      limits: { min: 500, max: 5000 },
      paymentMethods: ['Bank Transfer', 'Wise'],
      available: 1.8,
    },
    {
      id: 3,
      user: 'CryptoMaster',
      rating: 4.7,
      completedTrades: 234,
      price: 65400.00,
      limits: { min: 200, max: 20000 },
      paymentMethods: ['Bank Transfer', 'PayPal', 'Wise'],
      available: 3.2,
    },
  ];

  return (
    <div className="p2p-container">
      <div className="p2p-controls">
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            Buy
          </button>
          <button
            className={`tab-button ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            Sell
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Coin</label>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="filter-select"
            >
              {coins.map((coin) => (
                <option key={coin.symbol} value={coin.symbol}>
                  {coin.symbol} - {coin.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Fiat</label>
            <select
              value={selectedFiat}
              onChange={(e) => setSelectedFiat(e.target.value)}
              className="filter-select"
            >
              {fiatCurrencies.map((fiat) => (
                <option key={fiat.symbol} value={fiat.symbol}>
                  {fiat.symbol} - {fiat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="amount-input"
            />
          </div>
        </div>
      </div>

      <div className="listings-container">
        <div className="listings-header">
          <div className="header-item">Trader</div>
          <div className="header-item">Price</div>
          <div className="header-item">Limits</div>
          <div className="header-item">Payment Methods</div>
          <div className="header-item">Available</div>
          <div className="header-item">Action</div>
        </div>

        <div className="listings">
          {mockListings.map((listing) => (
            <div key={listing.id} className="listing-card">
              <div className="listing-item">
                <div className="trader-info">
                  <span className="trader-name">{listing.user}</span>
                  <div className="trader-stats">
                    <span className="rating">★ {listing.rating}</span>
                    <span className="trades">({listing.completedTrades} trades)</span>
                  </div>
                </div>
              </div>
              <div className="listing-item">
                <span className="price">{listing.price.toLocaleString()} {selectedFiat}</span>
              </div>
              <div className="listing-item">
                <span className="limits">
                  {listing.limits.min.toLocaleString()} - {listing.limits.max.toLocaleString()} {selectedFiat}
                </span>
              </div>
              <div className="listing-item">
                <div className="payment-methods">
                  {listing.paymentMethods.map((method, index) => (
                    <span key={index} className="payment-method">{method}</span>
                  ))}
                </div>
              </div>
              <div className="listing-item">
                <span className="available">{listing.available} {selectedCoin}</span>
              </div>
              <div className="listing-item">
                <button className="trade-button">
                  {activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default P2P;
