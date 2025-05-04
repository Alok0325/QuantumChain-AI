const express = require("express");
const router = express.Router();
const achievmentsController = require("../../../Controller/User/Profile/achievments");
const { fileHandlerRouter } = require("../../FileHandler/fileHandler");

router.post("/get", achievmentsController.getAchievements);
router.post("/add", fileHandlerRouter(["image"], 15), achievmentsController.addAchievements);    
router.post("/delete", achievmentsController.deleteAchievements);
router.post("/update", fileHandlerRouter(["image"], 15), achievmentsController.updateAchievements);

module.exports = router;

