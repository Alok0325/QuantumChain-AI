const Sequelize = require("sequelize");
const { sequelize } = require("../../importantInfo");

const UserApiKeys = sequelize.define(
  "UserApiKeys",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    exchange: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "binance",
    },
    apiKeyEnc: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    apiSecretEnc: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    apiKeyMask: {
      // Plaintext mask shown in the UI (e.g. "ABCD…XYZ9"). Safe to read back.
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    testedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    lastTestStatus: {
      // 'ok' | 'invalid_key' | 'network_error' | etc.
      type: Sequelize.STRING(40),
      allowNull: true,
    },
    lastTestMessage: {
      type: Sequelize.STRING(400),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "userApiKeys",
    indexes: [{ unique: true, fields: ["userId", "exchange"] }],
  }
);

module.exports = UserApiKeys;
