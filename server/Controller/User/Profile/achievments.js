const Achievements = require("../../../Models/User/achievments");
const { saveFile, safeDeleteFile } = require("../../../Utils/fileHandler");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { baseDir } = require("../../../importantInfo");

exports.getAchievements = async (req, res) => {
  try {
    const achievements = await Achievements.findAll({
      where: { UserId: req.user.id },
      order: [["date", "DESC"]],
    });
    res.status(200).json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res
      .status(500)
      .json({ message: "Error fetching achievements", error: error.message });
  }
};

exports.addAchievements = async (req, res) => {
  try {
    const { title, description, date, issuer } = req.body;

    const achievementFile = req.files && req.files.image ? req.files.image[0] : null;
    let imageUrl = null;

    if (achievementFile) {
      const commonPath = "CustomFiles";
      const pathAchievement = "AchievementImages";
      const fileName = uuidv4();
      imageUrl = saveFile(
        achievementFile,
        path.join(commonPath, pathAchievement),
        fileName
      );
    }

    const achievement = await Achievements.create({
      title,
      description,
      date,
      issuer,
      imageUrl,
      UserId: req.user.id,
    });

    res
      .status(201)
      .json({ message: "Achievement added successfully", achievement });
  } catch (error) {
    console.error("Error adding achievement:", error);
    res
      .status(500)
      .json({ message: "Error adding achievement", error: error.message });
  }
};

exports.updateAchievements = async (req, res) => {
  try {
    const { id } = req.body;
    const { title, description, date, issuer } = req.body;
    const achievementFile = req.files && req.files ? req.files.image[0] : null;

    const achievement = await Achievements.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    let imageUrl = achievement.imageUrl;
    if (achievementFile) {
      // Delete old image if exists
      if (achievement.imageUrl) {
        const oldImagePath = path.join(
          baseDir,
          achievement.imageUrl.replace("files/", "")
        );
        await safeDeleteFile(oldImagePath);
      }

      const commonPath = "CustomFiles";
      const pathAchievement = "AchievementImages";
      const fileName = uuidv4();
      imageUrl = saveFile(
        achievementFile,
        path.join(commonPath, pathAchievement),
        fileName
      );
    }

    await achievement.update({
      title,
      description,
      date,
      issuer,
      imageUrl,
    });

    res
      .status(200)
      .json({ message: "Achievement updated successfully", achievement });
  } catch (error) {
    console.error("Error updating achievement:", error);
    res
      .status(500)
      .json({ message: "Error updating achievement", error: error.message });
  }
};

exports.deleteAchievements = async (req, res) => {
  try {
    const { id } = req.body;

    const achievement = await Achievements.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    // Delete image if exists
    if (achievement.imageUrl) {
      const imagePath = path.join(
        baseDir,
        achievement.imageUrl.replace("files/", "")
      );
      await safeDeleteFile(imagePath);
    }

    await achievement.destroy();
    res.status(200).json({ message: "Achievement deleted successfully" });
  } catch (error) {
    console.error("Error deleting achievement:", error);
    res
      .status(500)
      .json({ message: "Error deleting achievement", error: error.message });
  }
};
