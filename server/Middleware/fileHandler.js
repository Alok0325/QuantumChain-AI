const multer = require("multer");

exports.setFileSizeLimit = ({ fileSizeLimit = 0.5, fileNames = [] }) => {
  return (req, res, next) => {
    req.fileNames = fileNames;
    req.fileSizeLimit = fileSizeLimit * 1024 * 1024; // Convert MB to bytes
    next();
  };
};

exports.checkFileSize = (req, res, next) => {
  // Check if Content-Length header exists and is within the limit
  const contentLength = parseInt(req.headers["content-length"], 10);

  if (contentLength > req.fileSizeLimit) {
    return res.status(400).json({
      error: `File size exceeds the ${
        req.fileSizeLimit / (1024 * 1024)
      } MB limit. Current Size: ${contentLength / (1024 * 1024)} MB`,
    });
  }
  next();
};

exports.multipleFileHandler = (fileNames) => {
  const storage = multer.memoryStorage();
  
  return multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      // If fileNames is a string, treat it as a single field name
      if (typeof fileNames === 'string') {
        if (file.fieldname === fileNames) {
          cb(null, true);
        } else {
          cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
      } 
      // If fileNames is an array, check if the field name is in the array
      else if (Array.isArray(fileNames)) {
        if (fileNames.includes(file.fieldname)) {
          cb(null, true);
        } else {
          cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
      }
    }
  }).fields(fileNames.map(name => ({ name, maxCount: 10 })));
};

exports.checkFileExist = (req, res, next) => {
  // Check if at least one file was uploaded
  if (req.files && Object.keys(req.files).length > 0) {
    return next();
  }
  // If no files are required, proceed
  return next();
};