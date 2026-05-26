const Sequelize = require("sequelize");
const { sequelize } = require("../../importantInfo");

const TradeLedger = sequelize.define(
  "TradeLedger",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    symbol: {
      type: Sequelize.STRING(12),
      allowNull: false,
    },
    side: {
      type: Sequelize.ENUM("buy", "sell"),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM(
        "dry-run",
        "submitted",
        "filled",
        "cancelled",
        "skipped",
        "failed"
      ),
      allowNull: false,
    },
    mode: {
      type: Sequelize.ENUM("dry-run", "live"),
      allowNull: false,
    },
    reason: {
      type: Sequelize.STRING(400),
      allowNull: true,
    },
    notionalUsd: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    qty: {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: false,
      defaultValue: 0,
    },
    entryPrice: {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: false,
      defaultValue: 0,
    },
    stopLossPrice: {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: true,
    },
    takeProfitPrice: {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: true,
    },
    predictedClose: {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: true,
    },
    predictedMovePct: {
      type: Sequelize.DECIMAL(8, 4),
      allowNull: true,
    },
    confidence: {
      type: Sequelize.ENUM("low", "medium", "high"),
      allowNull: true,
    },
    exitPrice: {
      type: Sequelize.DECIMAL(20, 8),
      allowNull: true,
    },
    realizedPnlUsd: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    },
    exchangeOrderId: {
      type: Sequelize.STRING(60),
      allowNull: true,
    },
    // `clientOrderId` we sent on the original POST. Lets reconcile attribute
    // a Binance trade back to the engine even if `orderId` matching fails.
    clientOrderId: {
      type: Sequelize.STRING(60),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "tradeLedger",
    indexes: [
      { fields: ["userId", "createdAt"] },
      { fields: ["userId", "symbol", "createdAt"] },
    ],
  }
);

module.exports = TradeLedger;
