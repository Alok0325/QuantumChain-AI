const path = require("path");
const { baseDir } = require("../../importantInfo");

// Send the file if it exists

exports.getFile = (req, res, next) => {
  const { category,fileName } = req.params;

  // Resolve path to CustomerFiles from the Epe directory
  const pathDir = path.join(baseDir, "CustomFiles");

  // Construct the file path
  const filePath = path.join(pathDir, category,  fileName);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("File not found");
    } else {
     // console.log("File served successfully.");
    }
  });
};