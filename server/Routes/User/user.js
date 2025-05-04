const { userAuthentication } = require("../../Middleware/auth");
const express = require("express");

const authRoutes = require("./Auth/auth");
const profileRoutes = require("./Profile/profile");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profile", userAuthentication, profileRoutes);

module.exports = router;
