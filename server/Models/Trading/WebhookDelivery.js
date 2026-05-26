const Sequelize = require("sequelize");
const { sequelize } = require("../../importantInfo");

/**
 * Append-only log of every webhook dispatch attempt. Used by the
 * `/trading/webhook/deliveries` endpoint to show recent activity to the
 * user. Independent of the regular TradeLedger so we can prune it
 * aggressively without touching trade history.
 */
const WebhookDelivery = sequelize.define(
  "WebhookDelivery",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event: {
      type: Sequelize.STRING(40),
      allowNull: false,
    },
    url: {
      type: Sequelize.STRING(512),
      allowNull: false,
    },
    statusCode: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    delivered: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    responseMs: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    error: {
      type: Sequelize.STRING(400),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
    tableName: "webhookDeliveries",
    indexes: [
      { fields: ["userId", "createdAt"] },
    ],
  }
);

module.exports = WebhookDelivery;
