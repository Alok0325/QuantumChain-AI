const express = require("express");
const router = express.Router();
const authController = require("../../../Controller/User/Auth/auth");
const { loginLimiter } = require("../../../Middleware/rateLimit");

router.post("/signUp", authController.userSignUp);
router.post("/login", loginLimiter, authController.userLogin);

module.exports = router;
