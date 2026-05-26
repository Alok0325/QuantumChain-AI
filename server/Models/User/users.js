const Sequelize = require("sequelize");
const { sequelize } = require("../../importantInfo");

const User = sequelize.define(
  "User",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    isBlocked: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: true,
        len: [10, 11], // Adjust based on your requirements
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    // Two-factor (TOTP). When `twoFactorEnabled=true`, the login endpoint
    // requires a 6-digit code in addition to the password.
    twoFactorSecret: {
      type: Sequelize.STRING(64),
      allowNull: true,
    },
    twoFactorEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Bcrypt-hashed backup codes for 2FA recovery. Plaintext is shown to the
    // user exactly once (at enroll / regenerate). Each code is single-use:
    // verifying it removes it from the array.
    twoFactorBackupCodes: {
      type: Sequelize.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: "users", // Optional: specify table name if different from model name
  }
);

module.exports = User;
