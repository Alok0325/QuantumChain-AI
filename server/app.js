require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const useragent = require("express-useragent");
const geoip = require("geoip-lite");


const { setupRoutes } = require("./Routes/setupRoutes");
const db = require("./database");
const infoRoutes = require("./infoRoutes");
const { setupModels } = require("./Models/setModels");
const autoTradeEngine = require("./Services/autoTradeEngine");
const metrics = require("./Services/metrics");


const app = express();

app.set("trust proxy", 1); // trust first proxy (e.g. Nginx / load balancer)

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
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

// Prometheus scrape endpoint. Keep behind a firewall in production —
// the surface is intentionally unauthenticated to match Prom conventions.
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (err) {
    res.status(500).send(`# metrics error: ${err.message}`);
  }
});

setupRoutes(app);

setupModels();





const PORT = process.env.APP_PORT || 5001;

db.sync({})
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on port : ${PORT}`);
      autoTradeEngine.start();
    });
  })
  .catch((err) => console.log(err));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    autoTradeEngine.stop();
    process.exit(0);
  });
}
