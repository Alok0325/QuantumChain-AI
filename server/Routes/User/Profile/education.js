const express = require("express");
const router = express.Router();
const educationController = require("../../../Controller/User/Profile/education");

router.post("/get", educationController.getEducation);
router.post("/add", educationController.addEducation);
router.post("/delete", educationController.deleteEducation);
router.post("/update", educationController.updateEducation);

module.exports = router;


