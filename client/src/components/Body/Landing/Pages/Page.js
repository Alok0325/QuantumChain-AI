import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './Page.css';

const Page = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop();

  const getPageTitle = () => {
    switch (currentPath) {
      case 'market':
        return 'Cryptocurrency Market';
      case 'trade':
        return 'Trading Platform';
      case 'p2p':
        return 'P2P Trading';
      case 'predictions':
        return 'AI Predictions';
      case 'about':
        return 'About Us';
      default:
        return '';
    }
  };

  const getPageDescription = () => {
    switch (currentPath) {
      case 'market':
        return 'Real-time cryptocurrency prices and market data';
      case 'trade':
        return 'Advanced trading platform with quantum-powered features';
      case 'p2p':
        return 'Secure peer-to-peer cryptocurrency trading';
      case 'predictions':
        return 'AI-powered market predictions and analysis';
      case 'about':
        return 'Learn more about QuantumChain AI';
      default:
        return '';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{getPageTitle()}</h1>
        <p className="page-description">{getPageDescription()}</p>
      </div>
      
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Page;
