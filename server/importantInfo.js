exports.baseDir = __dirname;


exports.AdminTokenExpiresIn = process.env.NODE_ENV === "testing" ? "7d" : "20m";
exports.UserTokenExpiresIn = process.env.NODE_ENV === "testing" ? "7d" : "7d";
exports.DeveloperTokenExpiresIn = process.env.NODE_ENV === "testing" ? "7d" : "2m";

exports.AdminAuthTokenExpiresIn =
  process.env.NODE_ENV === "testing" ? "7d" : "1h";

exports.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
exports.DATABASE_SERVER_JWT_SECRET_KEY = process.env.DATABASE_SERVER_JWT_SECRET_KEY;

exports.NODE_ENV = process.env.NODE_ENV;
exports.APP_PORT = process.env.APP_PORT;

exports.sequelize = require("./database");




//Developer Credentials
exports.DEVELOPER_USERNAME = process.env.DEVELOPER_USERNAME;
exports.DEVELOPER_PASSWORD = process.env.DEVELOPER_PASSWORD;
