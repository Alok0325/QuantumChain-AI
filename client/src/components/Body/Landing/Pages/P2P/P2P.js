import React, { useState, useEffect } from 'react';
import './P2P.css';

const TradeModal = ({ isOpen, onClose, listing, type, selectedCoin, selectedFiat }) => {
  const [step, setStep] = useState(1);
  const [tradeAmount, setTradeAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [status, setStatus] = useState('pending');
  const [timer, setTimer] = useState(900);
  const [tradeCurrency, setTradeCurrency] = useState(selectedFiat);
  const [exchangeRate, setExchangeRate] = useState(1);

  // Mock exchange rates - In production, these would come from an API
  const exchangeRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.12,
    AUD: 1.52,
    CAD: 1.35,
    JPY: 149.50,
    CNY: 7.19,
    SGD: 1.34,
    AED: 3.67
  };

  useEffect(() => {
    setExchangeRate(exchangeRates[tradeCurrency] / exchangeRates[selectedFiat]);
  }, [tradeCurrency, selectedFiat]);

  useEffect(() => {
    let interval;
    if (isOpen && step === 2) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      setStatus('completed');
      setTimeout(() => {
        onClose();
        setStep(1);
        setTradeAmount('');
        setSelectedPayment('');
        setStatus('pending');
        setTimer(900);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  const convertedPrice = listing.price * exchangeRate;
  const totalAmount = parseFloat(tradeAmount) * convertedPrice;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{type === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}</h2>
        
        {step === 1 ? (
          <form onSubmit={handleSubmit} className="trade-form">
            <div className="form-group">
              <label>Trading Currency</label>
              <select
                value={tradeCurrency}
                onChange={(e) => setTradeCurrency(e.target.value)}
                className="currency-select"
              >
                {Object.keys(exchangeRates).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency} - {getCurrencyName(currency)}
                  </option>
                ))}
              </select>
              <div className="exchange-rate-info">
                1 {selectedCoin} = {convertedPrice.toFixed(2)} {tradeCurrency}
              </div>
            </div>

            <div className="form-group">
              <label>Amount ({selectedCoin})</label>
              <div className="amount-input-group">
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder={`Enter amount`}
                  required
                  min={listing.limits.min / convertedPrice}
                  max={Math.min(listing.available, listing.limits.max / convertedPrice)}
                  step="0.00000001"
                />
                <span className="input-suffix">{selectedCoin}</span>
              </div>
              <div className="limits-info">
                Limits: {(listing.limits.min / convertedPrice).toFixed(8)} - {(listing.limits.max / convertedPrice).toFixed(8)} {selectedCoin}
              </div>
            </div>
            
            <div className="form-group">
              <label>Total ({tradeCurrency})</label>
              <div className="amount-input-group">
                <input
                  type="text"
                  value={totalAmount ? totalAmount.toFixed(2) : ''}
                  readOnly
                  className="total-amount"
                />
                <span className="input-suffix">{tradeCurrency}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                required
              >
                <option value="">Select payment method</option>
                {listing.paymentMethods.map((method, index) => (
                  <option key={index} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="confirm-button">
              Confirm Order
            </button>
          </form>
        ) : (
          <div className="trade-confirmation">
            <div className="timer">Time remaining: {formatTime(timer)}</div>
            
            <div className="trade-details">
              <div className="detail-row">
                <span>Amount:</span>
                <span>{tradeAmount} {selectedCoin}</span>
              </div>
              <div className="detail-row">
                <span>Price:</span>
                <span>{convertedPrice.toFixed(2)} {tradeCurrency}</span>
              </div>
              <div className="detail-row">
                <span>Total:</span>
                <span>{totalAmount.toFixed(2)} {tradeCurrency}</span>
              </div>
              <div className="detail-row">
                <span>Payment Method:</span>
                <span>{selectedPayment}</span>
              </div>
            </div>

            <div className="payment-instructions">
              <h3>Payment Instructions</h3>
              <p>1. Send {totalAmount.toFixed(2)} {tradeCurrency} using {selectedPayment}</p>
              <p>2. Use the reference number in your payment description</p>
              <p>3. Click "Payment Sent" after completing the transfer</p>
              
              <div className="account-details">
                <div className="detail-row">
                  <span>Account Name:</span>
                  <span>{listing.user}</span>
                </div>
                <div className="detail-row">
                  <span>Reference:</span>
                  <span>P2P-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {status === 'pending' ? (
              <button onClick={handleSubmit} className="confirm-button">
                Payment Sent
              </button>
            ) : (
              <div className="success-message">
                Trade completed successfully!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get currency names
const getCurrencyName = (code) => {
  const currencyNames = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    INR: 'Indian Rupee',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    JPY: 'Japanese Yen',
    CNY: 'Chinese Yuan',
    SGD: 'Singapore Dollar',
    AED: 'UAE Dirham'
  };
  return currencyNames[code] || code;
};

const TopTraders = () => {
  const topTraders = [
    {
      id: 1,
      username: 'CryptoKing',
      avatar: '👑',
      totalTrades: 1205,
      successRate: 99.8,
      volume: 15250000,
      monthlyTrades: 145,
      verifiedSince: '2021-05',
      specialization: ['BTC', 'ETH', 'USDT'],
      recentTrades: [
        { type: 'buy', amount: '2.5 BTC', time: '2h ago' },
        { type: 'sell', amount: '45 ETH', time: '5h ago' },
        { type: 'buy', amount: '12000 USDT', time: '8h ago' }
      ]
    },
    {
      id: 2,
      username: 'BlockchainPro',
      avatar: '⭐',
      totalTrades: 856,
      successRate: 99.5,
      volume: 8750000,
      monthlyTrades: 98,
      verifiedSince: '2022-01',
      specialization: ['BTC', 'SOL', 'BNB'],
      recentTrades: [
        { type: 'sell', amount: '1.8 BTC', time: '1h ago' },
        { type: 'buy', amount: '150 SOL', time: '4h ago' },
        { type: 'sell', amount: '25 BNB', time: '6h ago' }
      ]
    },
    {
      id: 3,
      username: 'CryptoWhale',
      avatar: '🐋',
      totalTrades: 2150,
      successRate: 99.9,
      volume: 25500000,
      monthlyTrades: 180,
      verifiedSince: '2020-12',
      specialization: ['BTC', 'ETH', 'SOL'],
      recentTrades: [
        { type: 'buy', amount: '5.2 BTC', time: '30m ago' },
        { type: 'sell', amount: '180 ETH', time: '3h ago' },
        { type: 'buy', amount: '1000 SOL', time: '7h ago' }
      ]
    },
    {
      id: 4,
      username: 'P2PMaster',
      avatar: '🌟',
      totalTrades: 1580,
      successRate: 99.7,
      volume: 12800000,
      monthlyTrades: 135,
      verifiedSince: '2021-08',
      specialization: ['ETH', 'BNB', 'ADA'],
      recentTrades: [
        { type: 'sell', amount: '75 ETH', time: '45m ago' },
        { type: 'buy', amount: '120 BNB', time: '2h ago' },
        { type: 'sell', amount: '5000 ADA', time: '5h ago' }
      ]
    },
    {
      id: 5,
      username: 'TradeLegend',
      avatar: '🏆',
      totalTrades: 1890,
      successRate: 99.6,
      volume: 18900000,
      monthlyTrades: 165,
      verifiedSince: '2021-03',
      specialization: ['BTC', 'DOGE', 'XRP'],
      recentTrades: [
        { type: 'buy', amount: '3.1 BTC', time: '1h ago' },
        { type: 'sell', amount: '100000 DOGE', time: '4h ago' },
        { type: 'buy', amount: '15000 XRP', time: '9h ago' }
      ]
    }
  ];

  return (
    <div className="top-traders-section">
      <div className="section-header">
        <h2>Top P2P Traders</h2>
        <span className="section-subtitle">Trusted traders with highest volume and success rate</span>
      </div>
      
      <div className="traders-grid">
        {topTraders.map((trader) => (
          <div key={trader.id} className="trader-card">
            <div className="trader-header">
              <div className="trader-avatar">{trader.avatar}</div>
              <div className="trader-info">
                <h3>{trader.username}</h3>
                <span className="verified-since">Verified since {trader.verifiedSince}</span>
              </div>
              <div className="trader-badge">
                Top {trader.id}
              </div>
            </div>

            <div className="trader-stats">
              <div className="stat-item">
                <span className="stat-label">Total Trades</span>
                <span className="stat-value">{trader.totalTrades.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value success">{trader.successRate}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Monthly Trades</span>
                <span className="stat-value">{trader.monthlyTrades}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Volume</span>
                <span className="stat-value">${(trader.volume).toLocaleString()}</span>
              </div>
            </div>

            <div className="trader-specialization">
              <span className="specialization-label">Specializes in:</span>
              <div className="coin-tags">
                {trader.specialization.map((coin, index) => (
                  <span key={index} className="coin-tag">{coin}</span>
                ))}
              </div>
            </div>

            <div className="recent-trades">
              <span className="recent-trades-label">Recent Trades:</span>
              <div className="trades-list">
                {trader.recentTrades.map((trade, index) => (
                  <div key={index} className={`trade-item ${trade.type}`}>
                    <span className="trade-type">{trade.type.toUpperCase()}</span>
                    <span className="trade-amount">{trade.amount}</span>
                    <span className="trade-time">{trade.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const P2P = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [selectedFiat, setSelectedFiat] = useState('USD');
  const [amount, setAmount] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const coins = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'XRP', name: 'Ripple' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'DOGE', name: 'Dogecoin' }
  ];

  const fiatCurrencies = [
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'EUR', name: 'Euro' },
    { symbol: 'GBP', name: 'British Pound' },
    { symbol: 'INR', name: 'Indian Rupee' },
    { symbol: 'AUD', name: 'Australian Dollar' },
    { symbol: 'CAD', name: 'Canadian Dollar' },
    { symbol: 'JPY', name: 'Japanese Yen' },
    { symbol: 'CNY', name: 'Chinese Yuan' },
    { symbol: 'SGD', name: 'Singapore Dollar' },
    { symbol: 'AED', name: 'UAE Dirham' }
  ];

  const mockListings = [
    {
      id: 1,
      user: 'CryptoTrader123',
      rating: 4.9,
      completedTrades: 156,
      price: 65432.21,
      limits: { min: 100, max: 10000 },
      paymentMethods: ['Bank Transfer', 'PayPal', 'Wise'],
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
      paymentMethods: ['Bank Transfer', 'PayPal', 'Wise', 'Revolut'],
      available: 3.2,
    },
  ];

  const handleTrade = (listing) => {
    setSelectedListing(listing);
    setModalOpen(true);
  };

  const filteredListings = mockListings.filter(listing => {
    const matchesSearch = listing.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.paymentMethods.some(method => method.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriceRange = (!priceRange.min || listing.price >= parseFloat(priceRange.min)) &&
                             (!priceRange.max || listing.price <= parseFloat(priceRange.max));
    return matchesSearch && matchesPriceRange;
  });

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
            <label>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by trader or payment method"
              className="search-input"
            />
          </div>

          <div className="filter-group price-range">
            <label>Price Range ({selectedFiat})</label>
            <div className="price-inputs">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                placeholder="Min"
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                placeholder="Max"
                className="price-input"
              />
            </div>
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
          {filteredListings.map((listing) => (
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
                <button 
                  className="trade-button"
                  onClick={() => handleTrade(listing)}
                >
                  {activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TopTraders />

      {modalOpen && selectedListing && (
        <TradeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          listing={selectedListing}
          type={activeTab}
          selectedCoin={selectedCoin}
          selectedFiat={selectedFiat}
        />
      )}
    </div>
  );
};

export default P2P;
