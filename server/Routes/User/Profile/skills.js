const express = require("express");
const router = express.Router();
const skillsController = require("../../../Controller/User/Profile/skills");

router.post("/get", skillsController.getSkills);
router.post("/add", skillsController.addSkills);
router.post("/delete", skillsController.deleteSkills);
router.post("/update", skillsController.updateSkills);

module.exports = router;    
