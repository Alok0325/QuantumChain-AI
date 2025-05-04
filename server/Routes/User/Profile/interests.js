const express = require("express");
const router = express.Router();
const interestsController = require("../../../Controller/User/Profile/interests");

router.post("/get", interestsController.getInterests);
router.post("/update", interestsController.updateInterests);

module.exports = router;    
