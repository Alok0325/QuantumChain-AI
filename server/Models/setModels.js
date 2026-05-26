const UserProfile = require("./User/userProfile");
const User = require("./User/users");
const UserApiKeys = require("./User/UserApiKeys");
const AutoTradeConfig = require("./Trading/AutoTradeConfig");
const TradeLedger = require("./Trading/TradeLedger");
const WebhookDelivery = require("./Trading/WebhookDelivery");

exports.setupModels = async () => {
  User.hasOne(UserProfile);
  UserProfile.belongsTo(User);

  // One vault row per (user, exchange)
  User.hasMany(UserApiKeys, { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
  UserApiKeys.belongsTo(User, { foreignKey: "userId" });

  // One config per user
  User.hasOne(AutoTradeConfig, { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
  AutoTradeConfig.belongsTo(User, { foreignKey: "userId" });

  // Append-only ledger of trade actions
  User.hasMany(TradeLedger, { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
  TradeLedger.belongsTo(User, { foreignKey: "userId" });

  // Webhook delivery audit log (nullable userId — test dispatches before login wire-up)
  User.hasMany(WebhookDelivery, { foreignKey: { name: "userId", allowNull: true }, onDelete: "CASCADE" });
  WebhookDelivery.belongsTo(User, { foreignKey: "userId" });
};
