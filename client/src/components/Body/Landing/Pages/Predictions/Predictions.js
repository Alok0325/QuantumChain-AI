import React, { useState, useEffect } from 'react';
import { predictionService } from '../../../../../services/predictionService';
import './Predictions.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Predictions = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [timeframe, setTimeframe] = useState('24h');
  const [isAutoTradeEnabled, setIsAutoTradeEnabled] = useState(false);
  const [autoTradeStatus, setAutoTradeStatus] = useState('Inactive');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState({
    BTC: {
      '24h': {
        prediction: '$45,000',
        confidence: 85,
        factors: [
          'Strong market momentum',
          'Increased institutional adoption',
          'Positive technical indicators'
        ]
      },
      '7d': {
        prediction: '$48,000',
        confidence: 75,
        factors: [
          'Growing DeFi integration',
          'Regulatory clarity improvements',
          'Rising retail interest'
        ]
      },
      '30d': {
        prediction: '$52,000',
        confidence: 65,
        factors: [
          'Long-term adoption trends',
          'Macro-economic factors',
          'Market cycle analysis'
        ]
      }
    },
    ETH: {
      '24h': {
        prediction: '$2,400',
        confidence: 82,
        factors: [
          'Network upgrade success',
          'DeFi ecosystem growth',
          'Staking participation increase'
        ]
      },
      '7d': {
        prediction: '$2,600',
        confidence: 72,
        factors: [
          'Layer 2 adoption',
          'NFT market recovery',
          'Protocol improvements'
        ]
      },
      '30d': {
        prediction: '$3,000',
        confidence: 62,
        factors: [
          'ETH 2.0 development',
          'Institutional interest',
          'DeFi innovation'
        ]
      }
    },
    SOL: {
      '24h': {
        prediction: '$102',
        confidence: 80,
        factors: [
          'Network stability',
          'Developer activity',
          'DApp growth'
        ]
      },
      '7d': {
        prediction: '$110',
        confidence: 70,
        factors: [
          'Ecosystem expansion',
          'Partnership announcements',
          'Technical improvements'
        ]
      },
      '30d': {
        prediction: '$125',
        confidence: 60,
        factors: [
          'Market share growth',
          'Infrastructure development',
          'Community engagement'
        ]
      }
    },
    BNB: {
      '24h': {
        prediction: '$320',
        confidence: 83,
        factors: [
          'Exchange volume growth',
          'BNB Chain adoption',
          'Token burn mechanics'
        ]
      },
      '7d': {
        prediction: '$340',
        confidence: 73,
        factors: [
          'DeFi protocol launches',
          'Cross-chain integration',
          'Market maker activity'
        ]
      },
      '30d': {
        prediction: '$380',
        confidence: 63,
        factors: [
          'Exchange development',
          'Regulatory compliance',
          'Ecosystem growth'
        ]
      }
    }
  });

  const cryptocurrencies = [
    { symbol: 'BTC', name: 'Bitcoin', price: '$43,521.23', change: '+2.34%' },
    { symbol: 'ETH', name: 'Ethereum', price: '$2,345.67', change: '-1.23%' },
    { symbol: 'SOL', name: 'Solana', price: '$98.45', change: '+5.67%' },
    { symbol: 'BNB', name: 'Binance Coin', price: '$312.89', change: '+0.89%' },
  ];

  useEffect(() => {
    fetchPrediction();
  }, [selectedCrypto]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await predictionService.getPrediction(selectedCrypto);
      setPrediction(result);
    } catch (err) {
      setError('Failed to fetch prediction. ' + err.message);
      toast.error('Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    try {
      setLoading(true);
      setError(null);
      await predictionService.trainModel(selectedCrypto);
      toast.success('Model trained successfully');
      fetchPrediction();
    } catch (err) {
      setError('Failed to train model. ' + err.message);
      toast.error('Failed to train model');
    } finally {
      setLoading(false);
    }
  };

  const recentPredictions = [
    {
      crypto: 'BTC',
      timeframe: '24h',
      predicted: '+2.5%',
      actual: '+2.8%',
      accuracy: 96,
      date: '2024-03-15',
    },
    {
      crypto: 'ETH',
      timeframe: '24h',
      predicted: '-1.0%',
      actual: '-1.2%',
      accuracy: 94,
      date: '2024-03-15',
    },
    {
      crypto: 'SOL',
      timeframe: '24h',
      predicted: '+4.0%',
      actual: '+5.7%',
      accuracy: 92,
      date: '2024-03-15',
    },
  ];

  const marketFactors = [
    {
      name: 'Market Sentiment',
      value: 78,
      trend: 'positive',
      description: 'Overall market sentiment is bullish with increasing institutional interest.',
    },
    {
      name: 'Technical Analysis',
      value: 82,
      trend: 'positive',
      description: 'Technical indicators show strong support levels and upward momentum.',
    },
    {
      name: 'Network Activity',
      value: 65,
      trend: 'neutral',
      description: 'Network metrics indicate stable growth in user adoption.',
    },
    {
      name: 'Regulatory Impact',
      value: 45,
      trend: 'negative',
      description: 'Recent regulatory developments may create short-term volatility.',
    },
  ];

  const toggleAutoTrade = () => {
    setIsAutoTradeEnabled(!isAutoTradeEnabled);
    setAutoTradeStatus(prev => prev === 'Inactive' ? 'Active - AI Trading' : 'Inactive');
  };

  return (
    <div className="predictions-container">
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="loading">Loading predictions...</div>
      ) : (
        <div className="prediction-content">
          <div className="crypto-selector">
            <h2>Select Cryptocurrency</h2>
            <select 
              value={selectedCrypto} 
              onChange={(e) => setSelectedCrypto(e.target.value)}
            >
              {cryptocurrencies.map(crypto => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
            <button onClick={trainModel} disabled={loading}>
              Train Model
            </button>
          </div>

          {prediction && (
            <div className="prediction-details">
              <h3>Price Predictions for {selectedCrypto}</h3>
              <div className="prediction-grid">
                <div className="prediction-card">
                  <h4>Opening Price</h4>
                  <p>${prediction.prediction.open.toFixed(2)}</p>
                </div>
                <div className="prediction-card">
                  <h4>Highest Price</h4>
                  <p>${prediction.prediction.high.toFixed(2)}</p>
                </div>
                <div className="prediction-card">
                  <h4>Lowest Price</h4>
                  <p>${prediction.prediction.low.toFixed(2)}</p>
                </div>
                <div className="prediction-card">
                  <h4>Closing Price</h4>
                  <p>${prediction.prediction.close.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="auto-trade-section">
            <h3>Auto Trading</h3>
            <div className="auto-trade-controls">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isAutoTradeEnabled}
                  onChange={toggleAutoTrade}
                />
                <span className="slider round"></span>
              </label>
              <span className="auto-trade-status">Status: {autoTradeStatus}</span>
            </div>
          </div>

          <div className="market-factors">
            <h3>Market Analysis Factors</h3>
            <div className="factors-grid">
              {marketFactors.map((factor, index) => (
                <div key={index} className={`factor-card ${factor.trend}`}>
                  <h4>{factor.name}</h4>
                  <div className="factor-value">{factor.value}%</div>
                  <p>{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-predictions">
            <h3>Recent Prediction Accuracy</h3>
            <table>
              <thead>
                <tr>
                  <th>Cryptocurrency</th>
                  <th>Timeframe</th>
                  <th>Predicted</th>
                  <th>Actual</th>
                  <th>Accuracy</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPredictions.map((pred, index) => (
                  <tr key={index}>
                    <td>{pred.crypto}</td>
                    <td>{pred.timeframe}</td>
                    <td>{pred.predicted}</td>
                    <td>{pred.actual}</td>
                    <td>{pred.accuracy}%</td>
                    <td>{pred.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="predictions-header">
        <div className="header-content">
          <h1>Quantum-Powered Price Predictions</h1>
          <p className="subtitle">
            Leveraging advanced quantum computing and AI to provide accurate cryptocurrency price predictions
          </p>
        </div>
        <div className="auto-trade-section">
          <div className="auto-trade-status">
            <span className={`status-indicator ${isAutoTradeEnabled ? 'active' : 'inactive'}`}></span>
            <span className="status-text">{autoTradeStatus}</span>
          </div>
          <button 
            className={`auto-trade-toggle ${isAutoTradeEnabled ? 'enabled' : ''}`}
            onClick={toggleAutoTrade}
          >
            {isAutoTradeEnabled ? 'Disable AI Auto-Trade' : 'Enable AI Auto-Trade'}
          </button>
        </div>
      </div>

      <div className="crypto-selector">
        <div className="crypto-list">
          {cryptocurrencies.map((crypto) => (
            <div
              key={crypto.symbol}
              className={`crypto-item ${selectedCrypto === crypto.symbol ? 'selected' : ''}`}
              onClick={() => setSelectedCrypto(crypto.symbol)}
            >
              <span className="crypto-symbol">{crypto.symbol}</span>
              <span className="crypto-name">{crypto.name}</span>
              <span className="crypto-price">{crypto.price}</span>
              <span className={`crypto-change ${crypto.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {crypto.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="prediction-dashboard">
        <div className="timeframe-selector">
          <button
            className={`timeframe-button ${timeframe === '24h' ? 'active' : ''}`}
            onClick={() => setTimeframe('24h')}
          >
            24 Hours
          </button>
          <button
            className={`timeframe-button ${timeframe === '7d' ? 'active' : ''}`}
            onClick={() => setTimeframe('7d')}
          >
            7 Days
          </button>
          <button
            className={`timeframe-button ${timeframe === '30d' ? 'active' : ''}`}
            onClick={() => setTimeframe('30d')}
          >
            30 Days
          </button>
        </div>

        <div className="prediction-cards">
          <div className="prediction-card main">
            <h3>Price Prediction</h3>
            <div className="prediction-value">
              <span className="value">{predictions[selectedCrypto][timeframe].prediction}</span>
              <span className="confidence">
                Confidence: {predictions[selectedCrypto][timeframe].confidence}%
              </span>
            </div>
            <div className="prediction-factors">
              <h4>Key Factors</h4>
              <ul>
                {predictions[selectedCrypto][timeframe].factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
            <div className="historical-accuracy">
              <h4>Historical Accuracy</h4>
              <div className="accuracy-bar">
                <div
                  className="accuracy-fill"
                  style={{ width: `${predictions[selectedCrypto][timeframe].historicalAccuracy}%` }}
                ></div>
                <span>{predictions[selectedCrypto][timeframe].historicalAccuracy}%</span>
              </div>
            </div>
          </div>

          <div className="prediction-card market-factors">
            <h3>Market Factors</h3>
            <div className="factors-list">
              {marketFactors.map((factor, index) => (
                <div key={index} className="factor-item">
                  <div className="factor-header">
                    <span className="factor-name">{factor.name}</span>
                    <span className={`factor-value ${factor.trend}`}>{factor.value}%</span>
                  </div>
                  <div className="factor-bar">
                    <div
                      className={`factor-fill ${factor.trend}`}
                      style={{ width: `${factor.value}%` }}
                    ></div>
                  </div>
                  <p className="factor-description">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="recent-predictions">
          <h3>Recent Predictions</h3>
          <div className="predictions-table">
            <div className="table-header">
              <span>Cryptocurrency</span>
              <span>Timeframe</span>
              <span>Predicted</span>
              <span>Actual</span>
              <span>Accuracy</span>
              <span>Date</span>
            </div>
            {recentPredictions.map((prediction, index) => (
              <div key={index} className="table-row">
                <span>{prediction.crypto}</span>
                <span>{prediction.timeframe}</span>
                <span className={prediction.predicted.startsWith('+') ? 'positive' : 'negative'}>
                  {prediction.predicted}
                </span>
                <span className={prediction.actual.startsWith('+') ? 'positive' : 'negative'}>
                  {prediction.actual}
                </span>
                <span className="accuracy">{prediction.accuracy}%</span>
                <span>{prediction.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="quantum-insights">
        <h3>Quantum Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">⚛️</div>
            <h4>Quantum Pattern Recognition</h4>
            <p>
              Our quantum algorithms analyze complex market patterns that are invisible to classical
              computing methods.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🤖</div>
            <h4>AI Learning</h4>
            <p>
              Machine learning models continuously improve their predictions based on historical
              accuracy and market feedback.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <h4>Multi-factor Analysis</h4>
            <p>
              Comprehensive analysis of technical, fundamental, and sentiment factors to provide
              accurate predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;