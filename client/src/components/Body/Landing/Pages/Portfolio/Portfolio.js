import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './Portfolio.css';
import BinanceIntegration from './BinanceIntegration';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1D');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dummy portfolio data
  const portfolioData = {
    totalValue: 158432.67,
    change24h: 5.34,
    totalPnl: 23567.89,
    totalPnlPercentage: 17.45,
    availableBalance: 25678.90,
    holdings: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: '2.5643',
        value: 89765.43,
        avgBuyPrice: 32450.21,
        pnl: 12543.67,
        pnlPercentage: 15.67,
        change24h: 4.32,
        allocation: 45.3
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        amount: '15.234',
        value: 45678.90,
        avgBuyPrice: 2789.34,
        pnl: 8765.43,
        pnlPercentage: 21.34,
        change24h: 6.78,
        allocation: 28.7
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: '234.567',
        value: 23456.78,
        avgBuyPrice: 87.65,
        pnl: 3456.78,
        pnlPercentage: 18.90,
        change24h: -2.45,
        allocation: 15.5
      },
      {
        symbol: 'DOT',
        name: 'Polkadot',
        amount: '567.89',
        value: 12345.67,
        avgBuyPrice: 19.87,
        pnl: 1234.56,
        pnlPercentage: 12.34,
        change24h: 3.21,
        allocation: 10.5
      }
    ],
    recentTransactions: [
      {
        type: 'buy',
        symbol: 'BTC',
        amount: '0.5432',
        price: 35678.90,
        total: 19378.90,
        date: '2024-03-20T10:30:00Z'
      },
      {
        type: 'sell',
        symbol: 'ETH',
        amount: '3.456',
        price: 2890.12,
        total: 9988.25,
        date: '2024-03-19T15:45:00Z'
      },
      {
        type: 'buy',
        symbol: 'SOL',
        amount: '45.678',
        price: 89.32,
        total: 4080.00,
        date: '2024-03-18T09:15:00Z'
      },
      {
        type: 'buy',
        symbol: 'DOT',
        amount: '123.45',
        price: 21.34,
        total: 2634.43,
        date: '2024-03-17T14:20:00Z'
      },
      {
        type: 'sell',
        symbol: 'BTC',
        amount: '0.2345',
        price: 36789.10,
        total: 8627.04,
        date: '2024-03-16T11:05:00Z'
      }
    ]
  };

  // Generate chart data based on timeRange
  const generateChartData = () => {
    const now = new Date();
    const data = [];
    const labels = [];
    let points = 24; // Default for 1D

    switch (timeRange) {
      case '1W':
        points = 7;
        break;
      case '1M':
        points = 30;
        break;
      case '3M':
        points = 90;
        break;
      case '1Y':
        points = 12;
        break;
      case 'ALL':
        points = 24;
        break;
      default:
        points = 24;
    }

    let value = portfolioData.totalValue;
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === '1D') {
        date.setHours(now.getHours() - i);
        labels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else if (timeRange === '1W') {
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString([], { weekday: 'short' }));
      } else if (timeRange === '1M' || timeRange === '3M') {
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      } else {
        date.setMonth(now.getMonth() - i);
        labels.push(date.toLocaleDateString([], { month: 'short', year: '2-digit' }));
      }

      // Add some random variation to the value
      const change = (Math.random() - 0.5) * (value * 0.02);
      value += change;
      data.push(value);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: data,
          borderColor: '#00ff00',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#00ff00',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#888',
          maxRotation: 0,
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#888',
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Replace with actual refresh logic
    setIsRefreshing(false);
  };

  if (isRefreshing) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner"></div>
        <p>Refreshing portfolio data...</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="portfolio-overview">
      <div className="portfolio-summary">
        <div className="summary-card total-value">
          <h3>Total Portfolio Value</h3>
          <div className="value-display">
            <span className="value">${portfolioData.totalValue.toLocaleString()}</span>
            <span className={`change ${portfolioData.change24h >= 0 ? 'positive' : 'negative'}`}>
              {portfolioData.change24h >= 0 ? '+' : ''}{portfolioData.change24h}%
            </span>
          </div>
        </div>
        <div className="summary-card total-pnl">
          <h3>Total P&L</h3>
          <div className="value-display">
            <span className="value">${portfolioData.totalPnl.toLocaleString()}</span>
            <span className={`change ${portfolioData.totalPnlPercentage >= 0 ? 'positive' : 'negative'}`}>
              {portfolioData.totalPnlPercentage >= 0 ? '+' : ''}{portfolioData.totalPnlPercentage}%
            </span>
          </div>
        </div>
        <div className="summary-card available-balance">
          <h3>Available Balance</h3>
          <div className="value-display">
            <span className="value">${portfolioData.availableBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="portfolio-chart">
        <div className="chart-header">
          <h3>Portfolio Performance</h3>
          <div className="time-range-selector">
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <Line data={generateChartData()} options={chartOptions} />
        </div>
      </div>

      <BinanceIntegration onTransaction={handleRefresh} />
    </div>
  );

  const renderHoldings = () => (
    <div className="holdings-section">
      <div className="section-header">
        <h3>Your Holdings</h3>
        <div className="holdings-actions">
          <button className="action-btn">Deposit</button>
          <button className="action-btn">Withdraw</button>
          <button className="action-btn">Trade</button>
        </div>
      </div>
      <div className="holdings-list">
        <div className="holdings-header">
          <span>Asset</span>
          <span>Amount</span>
          <span>Value</span>
          <span>Avg. Buy</span>
          <span>P&L</span>
          <span>24h Change</span>
          <span>Allocation</span>
        </div>
        {portfolioData.holdings.map((holding) => (
          <div key={holding.symbol} className="holding-item">
            <div className="asset-info">
              <span className="symbol">{holding.symbol}</span>
              <span className="name">{holding.name}</span>
            </div>
            <span className="amount">{holding.amount}</span>
            <span className="value">${holding.value.toLocaleString()}</span>
            <span className="avg-buy">${holding.avgBuyPrice.toLocaleString()}</span>
            <div className="pnl-info">
              <span className={`pnl-value ${parseFloat(holding.pnl) >= 0 ? 'positive' : 'negative'}`}>
                ${holding.pnl.toLocaleString()}
              </span>
              <span className={`pnl-percentage ${parseFloat(holding.pnlPercentage) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(holding.pnlPercentage) >= 0 ? '+' : ''}{holding.pnlPercentage}%
              </span>
            </div>
            <span className={`change ${parseFloat(holding.change24h) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(holding.change24h) >= 0 ? '+' : ''}{holding.change24h}%
            </span>
            <div className="allocation-bar">
              <div 
                className="allocation-fill"
                style={{ width: `${holding.allocation}%` }}
              />
              <span className="allocation-text">{holding.allocation}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="transactions-section">
      <div className="section-header">
        <h3>Recent Transactions</h3>
        <button className="action-btn">View All</button>
      </div>
      <div className="transactions-list">
        <div className="transactions-header">
          <span>Type</span>
          <span>Asset</span>
          <span>Amount</span>
          <span>Price</span>
          <span>Total</span>
          <span>Date</span>
        </div>
        {portfolioData.recentTransactions.map((tx, index) => (
          <div key={index} className="transaction-item">
            <span className={`type ${tx.type}`}>{tx.type.toUpperCase()}</span>
            <span className="symbol">{tx.symbol}</span>
            <span className="amount">{tx.amount}</span>
            <span className="price">${tx.price.toLocaleString()}</span>
            <span className="total">${tx.total.toLocaleString()}</span>
            <span className="date">{new Date(tx.date).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <div className="portfolio-summary">
          <h2>Portfolio Value</h2>
          <div className="portfolio-value">
            <span className="value">${portfolioData.totalValue.toLocaleString()}</span>
            <span className={`change ${portfolioData.change24h >= 0 ? 'positive' : 'negative'}`}>
              {portfolioData.change24h >= 0 ? '+' : ''}{portfolioData.change24h}%
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="portfolio-content">
        <div className="portfolio-tabs">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'holdings' ? 'active' : ''}
            onClick={() => setActiveTab('holdings')}
          >
            Holdings
          </button>
          <button
            className={activeTab === 'transactions' ? 'active' : ''}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'holdings' && renderHoldings()}
        {activeTab === 'transactions' && renderTransactions()}
      </div>
    </div>
  );
};

export default Portfolio; 