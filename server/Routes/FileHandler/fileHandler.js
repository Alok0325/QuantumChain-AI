const express = require("express");
const {
  setFileSizeLimit,
  checkFileSize,
  multipleFileHandler,
  checkFileExist,
} = require("../../Middleware/fileHandler");
  

exports.fileHandlerRouter = (fileNames, fileSize, isArray = false) => {
  const router = express.Router();

  router.use(
    (req, res, next) => {
      // If isArray is true, we're handling multiple files with the same name
      if (isArray) {
        // For feeds-like scenario where we have multiple files with same name
        req.fileNames = Array.isArray(fileNames) ? fileNames : [fileNames];
      } else {
        // For profile-like scenario where we have multiple files with different names
        if (Array.isArray(fileNames)) {
          req.fileNames = fileNames;
        } else {
          req.fileNames = [fileNames];
        }
      }
      next();
    },
    setFileSizeLimit({ fileSizeLimit: fileSize, fileNames: fileNames }),
    checkFileSize,
    multipleFileHandler(fileNames),
    checkFileExist
  );

  return router;
};
