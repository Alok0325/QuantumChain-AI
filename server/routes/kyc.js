const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');

// Configure multer for KYC document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/kyc/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Submit KYC
router.post('/submit', upload.single('idProof'), async (req, res) => {
  try {
    const { userId, fullName, dateOfBirth, address } = req.body;
    const idProofPath = req.file ? req.file.path : null;

    // Insert KYC details
    const [result] = await pool.query(
      'INSERT INTO kyc_details (user_id, full_name, date_of_birth, address, id_proof_path, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, fullName, dateOfBirth, address, idProofPath, 'PENDING']
    );

    res.status(201).json({
      message: 'KYC submitted successfully',
      kycId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get KYC status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [kycDetails] = await pool.query(
      'SELECT * FROM kyc_details WHERE user_id = ?',
      [userId]
    );

    if (kycDetails.length === 0) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    res.json(kycDetails[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 