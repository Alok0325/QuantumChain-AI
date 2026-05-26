const express = require("express");
const ctl = require("../../../Controller/User/ApiKeys/apiKeys");

const router = express.Router();

router.get("/binance", ctl.getBinance);
router.put("/binance", ctl.setBinance);
router.delete("/binance", ctl.deleteBinance);
router.post("/binance/test", ctl.testBinance);

module.exports = router;
