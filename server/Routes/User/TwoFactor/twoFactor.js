const express = require("express");
const ctl = require("../../../Controller/User/TwoFactor/twoFactor");
const { twoFactorLimiter } = require("../../../Middleware/rateLimit");

const router = express.Router();

router.get("/status", ctl.getStatus);
router.post("/setup", ctl.setup);
router.post("/enable", twoFactorLimiter, ctl.enable);
router.post("/disable", twoFactorLimiter, ctl.disable);
router.post("/backup-codes", twoFactorLimiter, ctl.regenerateBackupCodes);

module.exports = router;
