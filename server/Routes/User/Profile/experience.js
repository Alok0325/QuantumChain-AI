
const express = require("express");
const router = express.Router();
const experienceController = require("../../../Controller/User/Profile/experience");

router.post("/get", experienceController.getExperience);
router.post("/add", experienceController.addExperience);
router.post("/delete", experienceController.deleteExperience);
router.post("/update", experienceController.updateExperience);

module.exports = router;


