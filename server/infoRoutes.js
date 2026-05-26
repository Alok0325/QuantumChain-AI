const express = require("express");

const router = express.Router();

router.get("/getServerInfo", (req, res) => {
  return res.status(200).json({
    socketPort: process.env.SOCKET_PORT,
    nodeEnv: process.env.NODE_ENV,
  });
});

module.exports = router;
