import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">QuantumChain </span>
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

      <div className="features-section">
        <h2 className="section-title">Why Choose QuantumChain AI</h2>
        <div className="features-grid">
          <div className="feature-box">
            <i className="fas fa-bolt feature-icon"></i>
            <h3>High-Speed Trading</h3>
            <p>Execute trades at quantum speeds with our advanced infrastructure</p>
          </div>
          <div className="feature-box">
            <i className="fas fa-brain feature-icon"></i>
            <h3>Smart Analysis</h3>
            <p>AI-powered market analysis and real-time trading signals</p>
          </div>
          <div className="feature-box">
            <i className="fas fa-shield-alt feature-icon"></i>
            <h3>Enhanced Security</h3>
            <p>Multi-layer security with quantum-resistant encryption</p>
          </div>
          <div className="feature-box">
            <i className="fas fa-chart-line feature-icon"></i>
            <h3>Advanced Charts</h3>
            <p>Professional-grade trading charts and technical analysis tools</p>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>$10B+</h3>
            <p>Trading Volume</p>
          </div>
          <div className="stat-card">
            <h3>100K+</h3>
            <p>Active Traders</p>
          </div>
          <div className="stat-card">
            <h3>50+</h3>
            <p>Trading Pairs</p>
          </div>
          <div className="stat-card">
            <h3>99.9%</h3>
            <p>Uptime</p>
          </div>
        </div>
      </div>

      <div className="trading-tools-section">
        <h2 className="section-title">Professional Trading Tools</h2>
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">📊</div>
            <h3>Advanced Charts</h3>
            <p>Multiple timeframes, indicators, and drawing tools</p>
            <Link to="/trade" className="tool-link">Learn More</Link>
          </div>
          <div className="tool-card">
            <div className="tool-icon">🤖</div>
            <h3>AI Trading Bot</h3>
            <p>Automated trading with customizable strategies</p>
            <Link to="/bots" className="tool-link">Explore Bots</Link>
          </div>
          <div className="tool-card">
            <div className="tool-icon">📱</div>
            <h3>Mobile Trading</h3>
            <p>Trade anywhere with our mobile apps</p>
            <Link to="/mobile" className="tool-link">Get App</Link>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Start Trading Today</h2>
          <p>Join thousands of traders and start your quantum trading journey</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">Create Account</Link>
            <Link to="/about" className="cta-button secondary">Learn More</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 