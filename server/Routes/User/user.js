const { userAuthentication } = require("../../Middleware/auth");
const express = require("express");

const authRoutes = require("./Auth/auth");
const profileRoutes = require("./Profile/profile");
const apiKeysRoutes = require("./ApiKeys/apiKeys");
const twoFactorRoutes = require("./TwoFactor/twoFactor");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profile", userAuthentication, profileRoutes);
router.use("/api-keys", userAuthentication, apiKeysRoutes);
router.use("/2fa", userAuthentication, twoFactorRoutes);

module.exports = router;
