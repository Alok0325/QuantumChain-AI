const multer = require("multer");
const fs = require("fs");
const path=require('path');
const { baseDir } = require("../importantInfo");

function createFilePath(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }
}

// Safe file deletion function with retries
const safeDeleteFile = async (filePath, maxRetries = 3) => {
  if (!filePath) return;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        //console.log(`Successfully deleted file: ${filePath}`);
        return;
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath} (attempt ${attempt + 1}/${maxRetries}):`, error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.warn(`Failed to delete file after ${maxRetries} attempts: ${filePath}`);
};

exports.saveFile = (file, dir, name) => {
  const newDir=path.join(baseDir,dir)
  if (file) {
    const ext = path.extname(file.originalname);
    const filePath = path.join(newDir, `${name}${ext}`);

    createFilePath(newDir);
    fs.writeFileSync(filePath, file.buffer); // Save the file
    
    return path.join("files", dir, `${name}${ext}`).replace(/\\/g, "/");
  }
};

exports.setFileSizeLimit = ({ fileSizeLimit = 0.5 ,fileName=""}) => {
  return (req, res, next) => {
    req.fileName=fileName
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

exports.singleFileHandler = (fileName) => {
  const fields = [{ name: fileName, maxCount: 1 }];
  const storage = multer.memoryStorage();

  return multer({
    storage: storage,
  }).fields(fields);
};

exports.checkFileExist=(req,res,next)=>{
  if(req.fileName){
    return next();
  }
  res.status(404).json({error:"File not Found!"})
}

exports.safeDeleteFile = safeDeleteFile;