const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const KYC = sequelize.define('KYC_Detail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  idProofPath: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING'
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Define associations
KYC.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasOne(KYC, { foreignKey: 'userId' });

module.exports = KYC; 