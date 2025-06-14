import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>QuantumChain AI</h1>
          </Link>
        </div>

        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`} ref={menuRef}>
          <ul>
            <li><Link to="/market">Market</Link></li>
            <li><Link to="/p2p">P2P</Link></li>
            <li><Link to="/trade">Trade</Link></li>
            <li><Link to="/predictions">Predictions</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </nav>

        <div className="auth-buttons">
          {user ? (
            <div className="profile-dropdown" ref={profileRef}>
              <button className="profile-button" onClick={toggleProfile}>
                <div className="profile-avatar">
                  <img 
                    src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff&size=32`} 
                    alt={user.name}
                    className="avatar-image"
                  />
                </div>
                <span className="profile-name">{user.name || 'User'}</span>
                <i className={`fas fa-chevron-${isProfileOpen ? 'up' : 'down'}`}></i>
              </button>
              
              <div className={`dropdown-menu ${isProfileOpen ? 'show' : ''}`}>
                <div className="dropdown-header">
                  <div className="user-info">
                    <span className="user-name">{user.name || 'User'}</span>
                    <span className="user-status">
                      <i className="fas fa-circle"></i> Online
                    </span>
                  </div>
                </div>
                
                <Link to="/portfolio" className="dropdown-item">
                  <i className="fas fa-chart-line"></i>
                  Portfolio
                </Link>
                
                <Link to="/profile" className="dropdown-item">
                  <i className="fas fa-user-circle"></i>
                  Profile Settings
                </Link>
                
                <button onClick={handleLogout} className="dropdown-item logout">
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register" className="register-btn">Register</Link>
            </>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

export default Header; 