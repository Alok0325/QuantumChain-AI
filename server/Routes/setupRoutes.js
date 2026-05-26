const userRouter = require("./User/user");
const filesRouter = require("./Files/files");
const tradingRouter = require("./Trading/autoTrade");

exports.setupRoutes = (app) => {
  app.use("/user", userRouter);
  app.use("/files", filesRouter);
  app.use("/trading", tradingRouter);
};
