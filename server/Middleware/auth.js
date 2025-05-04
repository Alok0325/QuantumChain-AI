const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY, DEVELOPER_USERNAME } = require("../importantInfo");
const User = require("../Models/User/users");






// User Authentication Middleware
exports.userAuthentication = async (req, res, next) => {
  
  try {
    // Get token from header
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please Login to view full details!",
      });
    }
   
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    
    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    
    res.status(503).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};
