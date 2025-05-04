
const userRouter = require("./User/user");
const filesRouter = require("./Files/files");

exports.setupRoutes = (app) => {
  app.use("/user", userRouter);
  app.use("/files", filesRouter);
};
