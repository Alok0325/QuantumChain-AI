const express = require("express");
const geoip = require("geoip-lite");

const router = express.Router();

router.use("/getServerInfo", (req, res, next) => {
  return res.status(200).json({
    socketPort: process.env.SOCKET_PORT,
    nodeEnv: process.env.NODE_ENV,
  });
});




module.exports = router;
