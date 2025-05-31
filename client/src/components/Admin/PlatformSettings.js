import React, { useState } from 'react';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    trading: {
      enabled: true,
      maintenanceMode: false,
      tradingPairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
      minimumTradeAmount: 10,
      maximumTradeAmount: 100000,
      tradingFee: 0.1,
      withdrawalFee: 0.2,
      leverageOptions: [1, 2, 5, 10, 20, 50, 100],
      maxLeverage: 100
    },
    security: {
      twoFactorRequired: true,
      kycRequired: true,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      ipWhitelist: ['192.168.1.1', '10.0.0.1'],
      adminIpRestriction: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      tradingAlerts: true,
      securityAlerts: true,
      marketingEmails: false,
      newsletterFrequency: 'weekly'
    },
    kyc: {
      autoVerification: false,
      requiredDocuments: ['passport', 'national_id', 'drivers_license'],
      verificationTimeout: 48,
      maxAttempts: 3,
      minAge: 18
    },
    api: {
      enabled: true,
      rateLimit: 1000,
      webhookUrl: 'https://api.example.com/webhook',
      apiKeys: [
        { id: 1, name: 'Production API', key: '********', active: true },
        { id: 2, name: 'Testing API', key: '********', active: false }
      ]
    },
    maintenance: {
      scheduledTime: '',
      estimatedDuration: 2,
      affectedServices: [],
      notificationLeadTime: 24
    }
  });

  const [activeTab, setActiveTab] = useState('trading');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleNestedSettingChange = (category, parent, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parent]: {
          ...prev[category][parent],
          [setting]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  const renderTradingSettings = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="setting-item">
          <label>Trading Status</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.trading.enabled}
              onChange={(e) => handleSettingChange('trading', 'enabled', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Maintenance Mode</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.trading.maintenanceMode}
              onChange={(e) => handleSettingChange('trading', 'maintenanceMode', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Trading Fee (%)</label>
          <input
            type="number"
            value={settings.trading.tradingFee}
            onChange={(e) => handleSettingChange('trading', 'tradingFee', parseFloat(e.target.value))}
            disabled={!isEditing}
            step="0.01"
            min="0"
            max="100"
          />
        </div>

        <div className="setting-item">
          <label>Withdrawal Fee (%)</label>
          <input
            type="number"
            value={settings.trading.withdrawalFee}
            onChange={(e) => handleSettingChange('trading', 'withdrawalFee', parseFloat(e.target.value))}
            disabled={!isEditing}
            step="0.01"
            min="0"
            max="100"
          />
        </div>

        <div className="setting-item">
          <label>Minimum Trade Amount (USDT)</label>
          <input
            type="number"
            value={settings.trading.minimumTradeAmount}
            onChange={(e) => handleSettingChange('trading', 'minimumTradeAmount', parseInt(e.target.value))}
            disabled={!isEditing}
            min="0"
          />
        </div>

        <div className="setting-item">
          <label>Maximum Trade Amount (USDT)</label>
          <input
            type="number"
            value={settings.trading.maximumTradeAmount}
            onChange={(e) => handleSettingChange('trading', 'maximumTradeAmount', parseInt(e.target.value))}
            disabled={!isEditing}
            min="0"
          />
        </div>

        <div className="setting-item">
          <label>Maximum Leverage</label>
          <select
            value={settings.trading.maxLeverage}
            onChange={(e) => handleSettingChange('trading', 'maxLeverage', parseInt(e.target.value))}
            disabled={!isEditing}
          >
            {settings.trading.leverageOptions.map(leverage => (
              <option key={leverage} value={leverage}>{leverage}x</option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h4>Trading Pairs</h4>
        <div className="tags-input">
          {settings.trading.tradingPairs.map((pair, index) => (
            <div key={index} className="tag">
              {pair}
              {isEditing && (
                <button
                  onClick={() => {
                    const newPairs = settings.trading.tradingPairs.filter((_, i) => i !== index);
                    handleSettingChange('trading', 'tradingPairs', newPairs);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <input
              type="text"
              placeholder="Add pair (e.g., BTC/USDT)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleSettingChange('trading', 'tradingPairs', [
                    ...settings.trading.tradingPairs,
                    e.target.value.toUpperCase()
                  ]);
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="setting-item">
          <label>Require 2FA</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.security.twoFactorRequired}
              onChange={(e) => handleSettingChange('security', 'twoFactorRequired', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Require KYC</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.security.kycRequired}
              onChange={(e) => handleSettingChange('security', 'kycRequired', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Maximum Login Attempts</label>
          <input
            type="number"
            value={settings.security.maxLoginAttempts}
            onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            disabled={!isEditing}
            min="1"
            max="10"
          />
        </div>

        <div className="setting-item">
          <label>Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
            disabled={!isEditing}
            min="5"
            max="120"
          />
        </div>
      </div>

      <div className="settings-group">
        <h4>Password Policy</h4>
        <div className="setting-item">
          <label>Minimum Length</label>
          <input
            type="number"
            value={settings.security.passwordPolicy.minLength}
            onChange={(e) => handleNestedSettingChange('security', 'passwordPolicy', 'minLength', parseInt(e.target.value))}
            disabled={!isEditing}
            min="6"
            max="32"
          />
        </div>

        <div className="setting-item">
          <label>Require Uppercase</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireUppercase}
              onChange={(e) => handleNestedSettingChange('security', 'passwordPolicy', 'requireUppercase', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Require Lowercase</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireLowercase}
              onChange={(e) => handleNestedSettingChange('security', 'passwordPolicy', 'requireLowercase', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Require Numbers</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireNumbers}
              onChange={(e) => handleNestedSettingChange('security', 'passwordPolicy', 'requireNumbers', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Require Special Characters</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireSpecialChars}
              onChange={(e) => handleNestedSettingChange('security', 'passwordPolicy', 'requireSpecialChars', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>IP Whitelist</h4>
        <div className="tags-input">
          {settings.security.ipWhitelist.map((ip, index) => (
            <div key={index} className="tag">
              {ip}
              {isEditing && (
                <button
                  onClick={() => {
                    const newList = settings.security.ipWhitelist.filter((_, i) => i !== index);
                    handleSettingChange('security', 'ipWhitelist', newList);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <input
              type="text"
              placeholder="Add IP address"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleSettingChange('security', 'ipWhitelist', [
                    ...settings.security.ipWhitelist,
                    e.target.value
                  ]);
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="setting-item">
          <label>Email Notifications</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>SMS Notifications</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications.smsNotifications}
              onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Push Notifications</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications.pushNotifications}
              onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Trading Alerts</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications.tradingAlerts}
              onChange={(e) => handleSettingChange('notifications', 'tradingAlerts', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Security Alerts</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications.securityAlerts}
              onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Marketing Emails</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications.marketingEmails}
              onChange={(e) => handleSettingChange('notifications', 'marketingEmails', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Newsletter Frequency</label>
          <select
            value={settings.notifications.newsletterFrequency}
            onChange={(e) => handleSettingChange('notifications', 'newsletterFrequency', e.target.value)}
            disabled={!isEditing}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderKYCSettings = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="setting-item">
          <label>Auto Verification</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.kyc.autoVerification}
              onChange={(e) => handleSettingChange('kyc', 'autoVerification', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Verification Timeout (hours)</label>
          <input
            type="number"
            value={settings.kyc.verificationTimeout}
            onChange={(e) => handleSettingChange('kyc', 'verificationTimeout', parseInt(e.target.value))}
            disabled={!isEditing}
            min="1"
            max="72"
          />
        </div>

        <div className="setting-item">
          <label>Maximum Attempts</label>
          <input
            type="number"
            value={settings.kyc.maxAttempts}
            onChange={(e) => handleSettingChange('kyc', 'maxAttempts', parseInt(e.target.value))}
            disabled={!isEditing}
            min="1"
            max="5"
          />
        </div>

        <div className="setting-item">
          <label>Minimum Age</label>
          <input
            type="number"
            value={settings.kyc.minAge}
            onChange={(e) => handleSettingChange('kyc', 'minAge', parseInt(e.target.value))}
            disabled={!isEditing}
            min="18"
            max="100"
          />
        </div>
      </div>

      <div className="settings-group">
        <h4>Required Documents</h4>
        <div className="tags-input">
          {settings.kyc.requiredDocuments.map((doc, index) => (
            <div key={index} className="tag">
              {doc.replace('_', ' ').toUpperCase()}
              {isEditing && (
                <button
                  onClick={() => {
                    const newDocs = settings.kyc.requiredDocuments.filter((_, i) => i !== index);
                    handleSettingChange('kyc', 'requiredDocuments', newDocs);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <input
              type="text"
              placeholder="Add document type"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleSettingChange('kyc', 'requiredDocuments', [
                    ...settings.kyc.requiredDocuments,
                    e.target.value.toLowerCase().replace(' ', '_')
                  ]);
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderAPISettings = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="setting-item">
          <label>API Status</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.api.enabled}
              onChange={(e) => handleSettingChange('api', 'enabled', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>

        <div className="setting-item">
          <label>Rate Limit (requests/minute)</label>
          <input
            type="number"
            value={settings.api.rateLimit}
            onChange={(e) => handleSettingChange('api', 'rateLimit', parseInt(e.target.value))}
            disabled={!isEditing}
            min="100"
            max="10000"
          />
        </div>

        <div className="setting-item">
          <label>Webhook URL</label>
          <input
            type="url"
            value={settings.api.webhookUrl}
            onChange={(e) => handleSettingChange('api', 'webhookUrl', e.target.value)}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="settings-group">
        <h4>API Keys</h4>
        <div className="api-keys-list">
          {settings.api.apiKeys.map((key, index) => (
            <div key={index} className="api-key-item">
              <div className="key-info">
                <h5>{key.name}</h5>
                <p>{key.key}</p>
              </div>
              <div className="key-actions">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={key.active}
                    onChange={(e) => {
                      const newKeys = [...settings.api.apiKeys];
                      newKeys[index].active = e.target.checked;
                      handleSettingChange('api', 'apiKeys', newKeys);
                    }}
                    disabled={!isEditing}
                  />
                  <span className="toggle-slider"></span>
                </div>
                {isEditing && (
                  <button
                    className="delete-btn"
                    onClick={() => {
                      const newKeys = settings.api.apiKeys.filter((_, i) => i !== index);
                      handleSettingChange('api', 'apiKeys', newKeys);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
          {isEditing && (
            <button 
              className="add-key-btn"
              onClick={() => {
                handleSettingChange('api', 'apiKeys', [
                  ...settings.api.apiKeys,
                  {
                    id: settings.api.apiKeys.length + 1,
                    name: 'New API Key',
                    key: '********',
                    active: true
                  }
                ]);
              }}
            >
              <i className="fas fa-plus"></i>
              Add New API Key
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderMaintenanceSettings = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="setting-item">
          <label>Scheduled Maintenance Time</label>
          <input
            type="datetime-local"
            value={settings.maintenance.scheduledTime}
            onChange={(e) => handleSettingChange('maintenance', 'scheduledTime', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="setting-item">
          <label>Estimated Duration (hours)</label>
          <input
            type="number"
            value={settings.maintenance.estimatedDuration}
            onChange={(e) => handleSettingChange('maintenance', 'estimatedDuration', parseInt(e.target.value))}
            disabled={!isEditing}
            min="1"
            max="24"
          />
        </div>

        <div className="setting-item">
          <label>Notification Lead Time (hours)</label>
          <input
            type="number"
            value={settings.maintenance.notificationLeadTime}
            onChange={(e) => handleSettingChange('maintenance', 'notificationLeadTime', parseInt(e.target.value))}
            disabled={!isEditing}
            min="1"
            max="72"
          />
        </div>
      </div>

      <div className="settings-group">
        <h4>Affected Services</h4>
        <div className="tags-input">
          {settings.maintenance.affectedServices.map((service, index) => (
            <div key={index} className="tag">
              {service}
              {isEditing && (
                <button
                  onClick={() => {
                    const newServices = settings.maintenance.affectedServices.filter((_, i) => i !== index);
                    handleSettingChange('maintenance', 'affectedServices', newServices);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <input
              type="text"
              placeholder="Add affected service"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleSettingChange('maintenance', 'affectedServices', [
                    ...settings.maintenance.affectedServices,
                    e.target.value
                  ]);
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="platform-settings">
      <div className="settings-header">
        <div className="header-title">
          <h3>Platform Settings</h3>
          <p>Configure system-wide settings and parameters</p>
        </div>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button 
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'trading' ? 'active' : ''}`}
          onClick={() => setActiveTab('trading')}
        >
          Trading
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
          onClick={() => setActiveTab('kyc')}
        >
          KYC
        </button>
        <button
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API
        </button>
        <button
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'trading' && renderTradingSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'kyc' && renderKYCSettings()}
        {activeTab === 'api' && renderAPISettings()}
        {activeTab === 'maintenance' && renderMaintenanceSettings()}
      </div>
    </div>
  );
};

export default PlatformSettings; 