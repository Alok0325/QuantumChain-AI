import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">QuantumChain AI</span>
            <span className="ai-text">AI</span>
          </h1>
          <p className="hero-subtitle">
            The Future of Quantum-Powered Cryptocurrency Trading
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/trade" className="cta-button secondary">
              Explore Markets
            </Link>
          </div>
        </div>
        <div className="hero-features">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Quantum Speed</h3>
            <p>Lightning-fast trading execution powered by quantum computing</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Predictions</h3>
            <p>Advanced AI algorithms for market analysis and predictions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Trading</h3>
            <p>State-of-the-art security with quantum encryption</p>
          </div>
        </div>
      </div>

      <div className="market-section">
        <h2 className="section-title">Live Market Data</h2>
        <div className="market-grid">
          <div className="market-card">
            <div className="market-header">
              <span className="market-name">BTC/USDT</span>
              <span className="market-change positive">+2.5%</span>
            </div>
            <div className="market-price">$45,234.56</div>
            <div className="market-volume">Vol: $1.2B</div>
          </div>
          <div className="market-card">
            <div className="market-header">
              <span className="market-name">ETH/USDT</span>
              <span className="market-change positive">+1.8%</span>
            </div>
            <div className="market-price">$3,245.67</div>
            <div className="market-volume">Vol: $856M</div>
          </div>
          <div className="market-card">
            <div className="market-header">
              <span className="market-name">SOL/USDT</span>
              <span className="market-change negative">-0.5%</span>
            </div>
            <div className="market-price">$123.45</div>
            <div className="market-volume">Vol: $234M</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 