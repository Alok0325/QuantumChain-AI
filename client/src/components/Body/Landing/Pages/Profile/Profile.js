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
    notificationsEnabled: user?.notificationsEnabled || true,
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    nationality: user?.nationality || '',
    occupation: user?.occupation || '',
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    country: user?.country || 'India',
    panNumber: user?.panNumber || '',
    panVerified: user?.panVerified || false,
    panCardImage: null,
    aadharNumber: user?.aadharNumber || '',
    aadharVerified: user?.aadharVerified || false,
    aadharFrontImage: null,
    aadharBackImage: null,
    addressProofType: user?.addressProofType || '',
    addressProofNumber: user?.addressProofNumber || '',
    addressProofImage: null,
    addressProofDate: user?.addressProofDate || '',
    bankName: user?.bankName || '',
    accountNumber: user?.accountNumber || '',
    ifscCode: user?.ifscCode || '',
    accountType: user?.accountType || '',
    bankVerified: user?.bankVerified || false,
    kycStatus: user?.kycStatus || 'pending',
    kycVerifiedDate: user?.kycVerifiedDate || null,
    kycRejectionReason: user?.kycRejectionReason || ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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

  const renderKYCSection = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>KYC Verification</h3>
        {formData.kycStatus !== 'verified' && (
          <button 
            className="action-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Update KYC'}
          </button>
        )}
      </div>

      <div className="kyc-status">
        <div className={`status-badge ${formData.kycStatus}`}>
          {formData.kycStatus === 'verified' ? 'Verified' : 
           formData.kycStatus === 'pending' ? 'Pending Verification' : 
           'Not Verified'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h4>Personal Information</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth <span className="required">*</span></label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                required
              />
            </div>

            <div className="form-group">
              <label>Gender <span className="required">*</span></label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nationality <span className="required">*</span></label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                required
              />
            </div>

            <div className="form-group">
              <label>Occupation <span className="required">*</span></label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Address Information</h4>
          
          <div className="form-group">
            <label>Address Line 1 <span className="required">*</span></label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              disabled={!isEditing || formData.kycVerified}
              placeholder="House/Flat No, Building Name, Street"
              required
            />
          </div>

          <div className="form-group">
            <label>Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              disabled={!isEditing || formData.kycVerified}
              placeholder="Area, Landmark"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City <span className="required">*</span></label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                required
              />
            </div>

            <div className="form-group">
              <label>State <span className="required">*</span></label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>PIN Code <span className="required">*</span></label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                disabled={!isEditing || formData.kycVerified}
                pattern="[0-9]{6}"
                title="Please enter a valid 6-digit PIN code"
                required
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                disabled={true}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Identity Documents</h4>
          
          <div className="form-group">
            <label>PAN Card Number <span className="required">*</span></label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleInputChange}
              disabled={!isEditing || formData.panVerified}
              placeholder="Enter your PAN card number"
              pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              title="Please enter a valid PAN number (e.g., ABCDE1234F)"
              required
            />
            {formData.panVerified && (
              <span className="verified-badge">
                <i className="fas fa-check-circle"></i> Verified
              </span>
            )}
          </div>

          {isEditing && !formData.panVerified && (
            <div className="form-group">
              <label>Upload PAN Card <span className="required">*</span></label>
              <div className="file-upload">
                <input
                  type="file"
                  name="panCardImage"
                  onChange={handleInputChange}
                  accept="image/jpeg,image/png,image/jpg"
                  required
                />
                <p className="file-help">Upload a clear image of your PAN card (JPEG, PNG, max 5MB)</p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Aadhar Number <span className="required">*</span></label>
            <input
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleInputChange}
              disabled={!isEditing || formData.aadharVerified}
              placeholder="Enter your 12-digit Aadhar number"
              pattern="[0-9]{12}"
              title="Please enter a valid 12-digit Aadhar number"
              required
            />
            {formData.aadharVerified && (
              <span className="verified-badge">
                <i className="fas fa-check-circle"></i> Verified
              </span>
            )}
          </div>

          {isEditing && !formData.aadharVerified && (
            <>
              <div className="form-group">
                <label>Upload Aadhar Front <span className="required">*</span></label>
                <div className="file-upload">
                  <input
                    type="file"
                    name="aadharFrontImage"
                    onChange={handleInputChange}
                    accept="image/jpeg,image/png,image/jpg"
                    required
                  />
                  <p className="file-help">Upload front side of your Aadhar card (JPEG, PNG, max 5MB)</p>
                </div>
              </div>

              <div className="form-group">
                <label>Upload Aadhar Back <span className="required">*</span></label>
                <div className="file-upload">
                  <input
                    type="file"
                    name="aadharBackImage"
                    onChange={handleInputChange}
                    accept="image/jpeg,image/png,image/jpg"
                    required
                  />
                  <p className="file-help">Upload back side of your Aadhar card (JPEG, PNG, max 5MB)</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="form-section">
          <h4>Address Proof</h4>
          
          <div className="form-group">
            <label>Address Proof Type <span className="required">*</span></label>
            <select
              name="addressProofType"
              value={formData.addressProofType}
              onChange={handleInputChange}
              disabled={!isEditing || formData.kycVerified}
              required
            >
              <option value="">Select Proof Type</option>
              <option value="utility_bill">Utility Bill</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="rental_agreement">Rental Agreement</option>
              <option value="passport">Passport</option>
            </select>
          </div>

          <div className="form-group">
            <label>Document Number <span className="required">*</span></label>
            <input
              type="text"
              name="addressProofNumber"
              value={formData.addressProofNumber}
              onChange={handleInputChange}
              disabled={!isEditing || formData.kycVerified}
              placeholder="Enter document reference number"
              required
            />
          </div>

          <div className="form-group">
            <label>Document Date <span className="required">*</span></label>
            <input
              type="date"
              name="addressProofDate"
              value={formData.addressProofDate}
              onChange={handleInputChange}
              disabled={!isEditing || formData.kycVerified}
              required
            />
          </div>

          {isEditing && !formData.kycVerified && (
            <div className="form-group">
              <label>Upload Address Proof <span className="required">*</span></label>
              <div className="file-upload">
                <input
                  type="file"
                  name="addressProofImage"
                  onChange={handleInputChange}
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  required
                />
                <p className="file-help">Upload your address proof document (JPEG, PNG, PDF, max 5MB)</p>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h4>Bank Account Details</h4>
          
          <div className="form-group">
            <label>Bank Name <span className="required">*</span></label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              disabled={!isEditing || formData.bankVerified}
              required
            />
          </div>

          <div className="form-group">
            <label>Account Number <span className="required">*</span></label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              disabled={!isEditing || formData.bankVerified}
              pattern="[0-9]{9,18}"
              title="Please enter a valid account number"
              required
            />
          </div>

          <div className="form-group">
            <label>IFSC Code <span className="required">*</span></label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleInputChange}
              disabled={!isEditing || formData.bankVerified}
              pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
              title="Please enter a valid IFSC code"
              required
            />
          </div>

          <div className="form-group">
            <label>Account Type <span className="required">*</span></label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleInputChange}
              disabled={!isEditing || formData.bankVerified}
              required
            >
              <option value="">Select Account Type</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
        </div>

        {isEditing && !formData.kycVerified && (
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {!isEditing && !formData.kycVerified && formData.panNumber && (
          <div className="verification-pending">
            <i className="fas fa-clock"></i>
            <p>Your KYC verification is in progress. This usually takes 24-48 hours.</p>
          </div>
        )}

        {formData.kycStatus === 'rejected' && (
          <div className="verification-rejected">
            <i className="fas fa-exclamation-circle"></i>
            <div>
              <h4>Verification Failed</h4>
              <p>{formData.kycRejectionReason}</p>
            </div>
          </div>
        )}
      </form>

      <div className="kyc-guidelines">
        <h4>KYC Guidelines</h4>
        <ul>
          <li>All fields marked with <span className="required">*</span> are mandatory</li>
          <li>Ensure all documents are clear and all details are visible</li>
          <li>Address proof should not be older than 3 months</li>
          <li>Bank account should be in your name and active</li>
          <li>Verification process typically takes 24-48 hours</li>
          <li>Trading limits will be restricted until KYC is verified</li>
        </ul>
      </div>
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
            className={activeTab === 'kyc' ? 'active' : ''}
            onClick={() => setActiveTab('kyc')}
          >
            KYC
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
          {activeTab === 'kyc' && renderKYCSection()}
          {activeTab === 'binance' && renderBinanceSection()}
          {activeTab === 'security' && renderSecuritySection()}
        </div>
      </div>
    </div>
  );
};

export default Profile; 