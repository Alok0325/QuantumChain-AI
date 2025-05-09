import React, { useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    binanceApiKey: user?.binanceApiKey || '',
    binanceApiSecret: user?.binanceApiSecret || '',
    twoFactorEnabled: user?.twoFactorEnabled || false,
    notificationsEnabled: user?.notificationsEnabled || true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
    setIsSaving(false);
  };

  const renderProfileSection = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Profile Information</h3>
        <button 
          className="action-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your full name"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your phone number"
          />
        </div>
        {isEditing && (
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  const renderBinanceSection = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Binance API Settings</h3>
        <button 
          className="action-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit API Keys'}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>API Key</label>
          <input
            type="text"
            name="binanceApiKey"
            value={formData.binanceApiKey}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your Binance API key"
          />
        </div>
        <div className="form-group">
          <label>API Secret</label>
          <input
            type="password"
            name="binanceApiSecret"
            value={formData.binanceApiSecret}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your Binance API secret"
          />
        </div>
        <div className="api-status">
          <span className={`status-indicator ${formData.binanceApiKey ? 'connected' : 'disconnected'}`}>
            {formData.binanceApiKey ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {isEditing && (
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Security Settings</h3>
        <button 
          className="action-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Security'}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="twoFactorEnabled"
              checked={formData.twoFactorEnabled}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Enable Two-Factor Authentication
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="notificationsEnabled"
              checked={formData.notificationsEnabled}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Enable Email Notifications
          </label>
        </div>
        {isEditing && (
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={activeTab === 'binance' ? 'active' : ''}
            onClick={() => setActiveTab('binance')}
          >
            Binance API
          </button>
          <button
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        <div className="profile-sections">
          {activeTab === 'profile' && renderProfileSection()}
          {activeTab === 'binance' && renderBinanceSection()}
          {activeTab === 'security' && renderSecuritySection()}
        </div>
      </div>
    </div>
  );
};

export default Profile; 