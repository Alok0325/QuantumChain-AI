const Sequelize = require("sequelize");
const { errorLog } = require("./Utils/utils");

// Custom logging function for errors only
const logErrors = (msg) => {
  if (msg instanceof Error) {
    errorLog(`\nTime :- ${new Date()}\nSequelize Error: `, msg);
  }
};

console.log(`Database connected : ${process.env.DB_NAME}`);

module.exports = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    host: process.env.DB_HOST,
    logging: logErrors, // Log errors only in production
  }
);
