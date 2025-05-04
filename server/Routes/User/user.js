const { userAuthentication } = require("../../Middleware/auth");
const express = require("express");

const authRoutes = require("./Auth/auth");

const router = express.Router();

router.use("/auth", authRoutes);

module.exports = router;
