import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = () => {
  return (
    <Link to="/" className="logo">
      <span className="logo-text">QuantumChain AI</span>
      <span className="logo-dot">AI</span>
    </Link>
  );
};

export default Logo; 