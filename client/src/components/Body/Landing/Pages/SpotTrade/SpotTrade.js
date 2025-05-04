import React, { useState } from 'react';
import './SpotTrade.css';

const SpotTrade = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');

  const tradingPairs = [
    { symbol: 'BTC/USDT', price: '43,521.23', change: '+2.34%' },
    { symbol: 'ETH/USDT', price: '2,345.67', change: '-1.23%' },
    { symbol: 'SOL/USDT', price: '98.45', change: '+5.67%' },
    { symbol: 'BNB/USDT', price: '312.89', change: '+0.89%' },
  ];

  const orderBook = {
    asks: [
      { price: '43,521.23', amount: '0.1234', total: '5,370.52' },
      { price: '43,520.00', amount: '0.2345', total: '10,205.94' },
      { price: '43,519.50', amount: '0.3456', total: '15,039.74' },
    ],
    bids: [
      { price: '43,518.00', amount: '0.4567', total: '19,874.17' },
      { price: '43,517.50', amount: '0.5678', total: '24,709.64' },
      { price: '43,517.00', amount: '0.6789', total: '29,544.59' },
    ],
  };

  const recentTrades = [
    { price: '43,521.23', amount: '0.1234', time: '12:34:56', side: 'buy' },
    { price: '43,520.00', amount: '0.2345', time: '12:34:55', side: 'sell' },
    { price: '43,519.50', amount: '0.3456', time: '12:34:54', side: 'buy' },
  ];

  return (
    <div className="spot-trade-container">
      <div className="trading-pairs">
        <h3>Trading Pairs</h3>
        <div className="pairs-list">
          {tradingPairs.map((pair) => (
            <div
              key={pair.symbol}
              className={`pair-item ${selectedPair === pair.symbol ? 'selected' : ''}`}
              onClick={() => setSelectedPair(pair.symbol)}
            >
              <span className="pair-symbol">{pair.symbol}</span>
              <span className="pair-price">${pair.price}</span>
              <span className={`pair-change ${pair.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {pair.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="trading-chart">
        <div className="chart-header">
          <h3>{selectedPair} Chart</h3>
          <div className="chart-controls">
            <button className="time-button active">1H</button>
            <button className="time-button">4H</button>
            <button className="time-button">1D</button>
            <button className="time-button">1W</button>
          </div>
        </div>
        <div className="chart-placeholder">
          <div className="quantum-chart">
            <div className="quantum-line"></div>
            <div className="quantum-particles"></div>
          </div>
        </div>
      </div>

      <div className="trading-panel">
        <div className="order-book">
          <h3>Order Book</h3>
          <div className="order-book-content">
            <div className="asks">
              {orderBook.asks.map((ask, index) => (
                <div key={index} className="order-row ask">
                  <span className="price">{ask.price}</span>
                  <span className="amount">{ask.amount}</span>
                  <span className="total">{ask.total}</span>
                </div>
              ))}
            </div>
            <div className="spread">
              <span>Spread: 0.01%</span>
            </div>
            <div className="bids">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="order-row bid">
                  <span className="price">{bid.price}</span>
                  <span className="amount">{bid.amount}</span>
                  <span className="total">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-form">
          <div className="order-tabs">
            <button
              className={`order-tab ${orderType === 'limit' ? 'active' : ''}`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
            <button
              className={`order-tab ${orderType === 'market' ? 'active' : ''}`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
          </div>

          <div className="order-side">
            <button
              className={`side-button ${side === 'buy' ? 'active buy' : ''}`}
              onClick={() => setSide('buy')}
            >
              Buy
            </button>
            <button
              className={`side-button ${side === 'sell' ? 'active sell' : ''}`}
              onClick={() => setSide('sell')}
            >
              Sell
            </button>
          </div>

          <div className="order-inputs">
            <div className="input-group">
              <label>Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={orderType === 'market'}
              />
            </div>
            <div className="input-group">
              <label>Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="input-group">
              <label>Total</label>
              <input
                type="number"
                value={price && amount ? (price * amount).toFixed(2) : ''}
                placeholder="0.00"
                disabled
              />
            </div>
          </div>

          <button className={`submit-order ${side}`}>
            {side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.split('/')[0]}
          </button>
        </div>
      </div>

      <div className="recent-trades">
        <h3>Recent Trades</h3>
        <div className="trades-list">
          {recentTrades.map((trade, index) => (
            <div key={index} className={`trade-row ${trade.side}`}>
              <span className="trade-price">{trade.price}</span>
              <span className="trade-amount">{trade.amount}</span>
              <span className="trade-time">{trade.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotTrade; 