const sequelize = require('../config/database');
const User = require('./User');
const KYC = require('./KYC');

// Sync all models with database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized successfully');
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
  });

module.exports = {
  sequelize,
  User,
  KYC
}; 