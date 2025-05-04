const express = require("express");
const router = express.Router();


const profileController = require("../../../Controller/User/Profile/profile");
const { fileHandlerRouter } = require("../../FileHandler/fileHandler");




router.post("/get", profileController.getProfile);
router.post("/update",fileHandlerRouter(["image", "coverImage"], 15), profileController.updateProfile);





module.exports = router;
