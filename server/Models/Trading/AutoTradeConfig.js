const Sequelize = require("sequelize");
const { sequelize } = require("../../importantInfo");

// Server-side hard ceilings — clients cannot exceed these regardless of input.
const HARD_LIMITS = Object.freeze({
  MAX_POSITION_USD: 5000,
  MAX_DAILY_LOSS_USD: 1000,
  MIN_STOP_LOSS_PCT: 0.1,
  MAX_STOP_LOSS_PCT: 50,
  MIN_TAKE_PROFIT_PCT: 0.1,
  MAX_TAKE_PROFIT_PCT: 100,
  SUPPORTED_SYMBOLS: ["BTC", "ETH", "SOL", "BNB", "ATOM"],
  LIVE_ACK_TTL_HOURS: Number(process.env.LIVE_ACK_TTL_HOURS || 24),
  LIVE_FAILURE_THRESHOLD: 3, // consecutive failures before auto kill-switch
  MIN_ORDER_NOTIONAL_USD: 10, // Binance min, plus a small safety buffer
});

const AutoTradeConfig = sequelize.define(
  "AutoTradeConfig",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    mode: {
      type: Sequelize.ENUM("dry-run", "live"),
      allowNull: false,
      defaultValue: "dry-run",
    },
    maxPositionUsd: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 500,
      validate: { min: 1, max: HARD_LIMITS.MAX_POSITION_USD },
    },
    dailyLossLimitUsd: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 100,
      validate: { min: 1, max: HARD_LIMITS.MAX_DAILY_LOSS_USD },
    },
    stopLossPct: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 2,
      validate: {
        min: HARD_LIMITS.MIN_STOP_LOSS_PCT,
        max: HARD_LIMITS.MAX_STOP_LOSS_PCT,
      },
    },
    takeProfitPct: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 4,
      validate: {
        min: HARD_LIMITS.MIN_TAKE_PROFIT_PCT,
        max: HARD_LIMITS.MAX_TAKE_PROFIT_PCT,
      },
    },
    minConfidence: {
      type: Sequelize.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "high",
    },
    allowedSymbols: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: ["BTC", "ETH"],
      validate: {
        subsetOfWhitelist(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error("allowedSymbols must be a non-empty array");
          }
          const bad = value.filter(
            (s) => !HARD_LIMITS.SUPPORTED_SYMBOLS.includes(s)
          );
          if (bad.length) {
            throw new Error(
              `unsupported symbols: ${bad.join(", ")}. ` +
                `supported: ${HARD_LIMITS.SUPPORTED_SYMBOLS.join(", ")}`
            );
          }
        },
      },
    },
    killSwitchTriggered: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    killSwitchAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    killSwitchReason: {
      type: Sequelize.STRING(400),
      allowNull: true,
    },
    // Set when the user re-enters their password to acknowledge live trading.
    // Valid for LIVE_ACK_TTL_HOURS (default 24). Cleared when user flips back
    // to dry-run or when the executor refuses live for any reason.
    liveAcknowledgedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    // Engine resets this on success; trips kill switch when it crosses LIVE_FAILURE_THRESHOLD.
    consecutiveFailures: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "autoTradeConfigs",
  }
);

AutoTradeConfig.HARD_LIMITS = HARD_LIMITS;

module.exports = AutoTradeConfig;
