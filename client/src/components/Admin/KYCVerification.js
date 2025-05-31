import React, { useState } from 'react';
import './AdminComponents.css';

const KYCVerification = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('pending');

  // Dummy KYC data
  const kycData = [
    {
      id: 1,
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91 9876543210',
        submittedAt: '2024-02-15T10:30:00'
      },
      documents: {
        pan: {
          number: 'ABCDE1234F',
          image: 'https://via.placeholder.com/400x300',
          verified: false
        },
        aadhar: {
          number: '123456789012',
          frontImage: 'https://via.placeholder.com/400x300',
          backImage: 'https://via.placeholder.com/400x300',
          verified: false
        },
        addressProof: {
          type: 'utility_bill',
          number: 'BILL123456',
          image: 'https://via.placeholder.com/400x300',
          verified: false
        }
      },
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        verified: false
      },
      status: 'pending',
      notes: ''
    },
    // Add more dummy data here
  ];

  // Add more dummy data
  const dummyUsers = Array.from({ length: 10 }, (_, i) => ({
    id: i + 2,
    user: {
      name: `User ${i + 2}`,
      email: `user${i + 2}@example.com`,
      phone: `+91 98765432${i + 1}`,
      submittedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    documents: {
      pan: {
        number: `PQRST${i + 1}234F`,
        image: 'https://via.placeholder.com/400x300',
        verified: Math.random() > 0.5
      },
      aadhar: {
        number: `${123456789012 + i}`,
        frontImage: 'https://via.placeholder.com/400x300',
        backImage: 'https://via.placeholder.com/400x300',
        verified: Math.random() > 0.5
      },
      addressProof: {
        type: ['utility_bill', 'bank_statement', 'rental_agreement'][Math.floor(Math.random() * 3)],
        number: `DOC${i + 1}23456`,
        image: 'https://via.placeholder.com/400x300',
        verified: Math.random() > 0.5
      }
    },
    bankDetails: {
      bankName: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'][Math.floor(Math.random() * 4)],
      accountNumber: `${1234567890 + i}`,
      ifscCode: `BANK000${1234 + i}`,
      verified: Math.random() > 0.5
    },
    status: ['pending', 'verified', 'rejected'][Math.floor(Math.random() * 3)],
    notes: ''
  }));

  const allKycData = [...kycData, ...dummyUsers];

  const handleVerify = (userId, type) => {
    // Handle verification logic
    console.log(`Verifying ${type} for user ${userId}`);
  };

  const handleReject = (userId, type, reason) => {
    // Handle rejection logic
    console.log(`Rejecting ${type} for user ${userId} with reason: ${reason}`);
  };

  const handleApproveAll = (userId) => {
    // Handle approve all documents logic
    console.log(`Approving all documents for user ${userId}`);
  };

  const filteredData = allKycData.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="kyc-verification">
      <div className="kyc-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
            onClick={() => setFilter('verified')}
          >
            Verified
          </button>
          <button 
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search by name, email, or document number..."
          />
        </div>
      </div>

      <div className="kyc-grid">
        <div className="kyc-list">
          {filteredData.map(item => (
            <div 
              key={item.id}
              className={`kyc-item ${selectedUser?.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedUser(item)}
            >
              <div className="kyc-item-header">
                <div className="user-info">
                  <h4>{item.user.name}</h4>
                  <span>{item.user.email}</span>
                </div>
                <div className={`status-badge ${item.status}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
              </div>
              
              <div className="kyc-item-details">
                <div className="detail-row">
                  <span>Submitted:</span>
                  <span>{new Date(item.user.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span>Documents:</span>
                  <span>
                    <i className={`fas fa-circle ${item.documents.pan.verified ? 'verified' : 'pending'}`}></i>
                    <i className={`fas fa-circle ${item.documents.aadhar.verified ? 'verified' : 'pending'}`}></i>
                    <i className={`fas fa-circle ${item.documents.addressProof.verified ? 'verified' : 'pending'}`}></i>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div className="kyc-details">
            <div className="details-header">
              <h3>KYC Details</h3>
              <div className="header-actions">
                <button 
                  className="approve-all-btn"
                  onClick={() => handleApproveAll(selectedUser.id)}
                >
                  Approve All
                </button>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="details-content">
              <section className="detail-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{selectedUser.user.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{selectedUser.user.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{selectedUser.user.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>Submitted On</label>
                    <p>{new Date(selectedUser.user.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>PAN Card</h4>
                <div className="document-review">
                  <div className="document-info">
                    <p><strong>Number:</strong> {selectedUser.documents.pan.number}</p>
                    <div className="document-image">
                      <img src={selectedUser.documents.pan.image} alt="PAN Card" />
                    </div>
                  </div>
                  <div className="verification-actions">
                    <button 
                      className="verify-btn"
                      onClick={() => handleVerify(selectedUser.id, 'pan')}
                    >
                      Verify
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReject(selectedUser.id, 'pan', 'Invalid PAN details')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Aadhar Card</h4>
                <div className="document-review">
                  <div className="document-info">
                    <p><strong>Number:</strong> {selectedUser.documents.aadhar.number}</p>
                    <div className="document-images">
                      <div className="document-image">
                        <span>Front Side</span>
                        <img src={selectedUser.documents.aadhar.frontImage} alt="Aadhar Front" />
                      </div>
                      <div className="document-image">
                        <span>Back Side</span>
                        <img src={selectedUser.documents.aadhar.backImage} alt="Aadhar Back" />
                      </div>
                    </div>
                  </div>
                  <div className="verification-actions">
                    <button 
                      className="verify-btn"
                      onClick={() => handleVerify(selectedUser.id, 'aadhar')}
                    >
                      Verify
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReject(selectedUser.id, 'aadhar', 'Invalid Aadhar details')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Address Proof</h4>
                <div className="document-review">
                  <div className="document-info">
                    <p><strong>Type:</strong> {selectedUser.documents.addressProof.type.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Number:</strong> {selectedUser.documents.addressProof.number}</p>
                    <div className="document-image">
                      <img src={selectedUser.documents.addressProof.image} alt="Address Proof" />
                    </div>
                  </div>
                  <div className="verification-actions">
                    <button 
                      className="verify-btn"
                      onClick={() => handleVerify(selectedUser.id, 'address')}
                    >
                      Verify
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReject(selectedUser.id, 'address', 'Invalid address proof')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Bank Account Details</h4>
                <div className="document-review">
                  <div className="document-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Bank Name</label>
                        <p>{selectedUser.bankDetails.bankName}</p>
                      </div>
                      <div className="info-item">
                        <label>Account Number</label>
                        <p>{selectedUser.bankDetails.accountNumber}</p>
                      </div>
                      <div className="info-item">
                        <label>IFSC Code</label>
                        <p>{selectedUser.bankDetails.ifscCode}</p>
                      </div>
                    </div>
                  </div>
                  <div className="verification-actions">
                    <button 
                      className="verify-btn"
                      onClick={() => handleVerify(selectedUser.id, 'bank')}
                    >
                      Verify
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReject(selectedUser.id, 'bank', 'Invalid bank details')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h4>Admin Notes</h4>
                <textarea
                  className="admin-notes"
                  placeholder="Add notes about this verification..."
                  value={selectedUser.notes}
                  onChange={(e) => {
                    // Handle notes update
                    console.log('Updating notes:', e.target.value);
                  }}
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCVerification; 