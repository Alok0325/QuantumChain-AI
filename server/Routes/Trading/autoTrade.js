const express = require("express");
const { userAuthentication } = require("../../Middleware/auth");
const ctl = require("../../Controller/Trading/autoTrade");

const router = express.Router();

router.use(userAuthentication);

router.get("/config", ctl.getConfig);
router.put("/config", ctl.updateConfig);
router.post("/acknowledge-live", ctl.acknowledgeLive);
router.post("/kill-switch", ctl.engageKillSwitch);
router.delete("/kill-switch", ctl.clearKillSwitch);
router.get("/ledger", ctl.getLedger);
router.get("/status", ctl.getStatus);
router.get("/reconcile", ctl.reconcile);
router.get("/positions", ctl.positions);

module.exports = router;
