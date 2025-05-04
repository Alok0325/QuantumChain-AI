import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">QuantumChain</span>
          <span className="logo-dot">AI</span>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/market" className="nav-link">Market</Link>
          <Link to="/p2p" className="nav-link">P2P Trade</Link>
          <Link to="/trade" className="nav-link">Spot Trade</Link>
          <Link to="/predictions" className="nav-link">Predictions</Link>
          <Link to="/about" className="nav-link">About</Link>
        </nav>

        <div className="auth-buttons">
          {user ? (
            <div className="user-menu">
              <button className="user-button">
                {user.username}
                <span className="user-arrow">▼</span>
              </button>
              <div className="dropdown-menu">
                <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
                <Link to="/profile" className="dropdown-item">Profile</Link>
                <button onClick={logout} className="dropdown-item">Logout</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-button">Login</Link>
              <Link to="/register" className="register-button">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 