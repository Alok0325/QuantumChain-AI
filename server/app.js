require("dotenv").config();
//Checking the changes..
const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const useragent = require("express-useragent");
const geoip = require("geoip-lite");


const { setupRoutes } = require("./Routes/setupRoutes");
const db = require("./database");
const infoRoutes = require("./infoRoutes");
const {setupModels} = require("./Models/setModels");


// Just check-checkinf git working
app = express();

app.set("trust proxy", 1); // 1 means trust the first proxy, usually Nginx or another load balancer

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);


app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Custom error handler for invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format",
      error: err.message
    });
  }
  next();
});


app.use(express.static(path.join(__dirname, "CustomFiles")));

const activityLogger = (req, res, next) => {
  // Extracting IP Addresses (could be a list separated by commas)
  const ipAddresses = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",").map((ip) => ip.trim())
    : [req.connection.remoteAddress];

  // Extract the first IP as the primary client IP (most likely the original client IP)
  const primaryIpAddress = ipAddresses[0];

  // Extracting User-Agent
  const userAgent = req.headers["user-agent"] || "Unknown";

  // Device Type (Desktop/Mobile/Tablet)
  const ua = useragent.parse(userAgent);
  const deviceType = ua.isMobile ? "Mobile" : "Desktop"; // Can also check ua.isTablet, ua.isBot, etc.

  // Geolocation based on the primary IP Address
  const geo = geoip.lookup(primaryIpAddress);
  const location = geo ? `${geo.city}, ${geo.country}` : "Unknown";

  req.clientInfo = {
    ipAddresses, // Array of IPs
    primaryIpAddress, // First IP as the primary one
    userAgent,
    deviceType,
    location,
  };

  // Continue with next middleware or response
  next();
};

app.use(activityLogger);

app.use("/", infoRoutes);

setupRoutes(app);

setupModels();





db.sync({})
  .then(async () => {
    app.listen(process.env.APP_PORT);
    console.log(`Listening to the port : ${process.env.APP_PORT}`);
    
    
    //console.log("Alter is on for the databases");
  })
  .catch((err) => console.log(err));
