const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy endpoint for market data
app.get('/api/market', async (req, res) => {
  try {
    console.log('Fetching market data from KuCoin...');
    const response = await axios.get('https://api.kucoin.com/api/v1/market/allTickers', {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('Market data fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message
    });
  }
});

// Proxy endpoint for currency info
app.get('/api/currencies', async (req, res) => {
  try {
    console.log('Fetching currency info from KuCoin...');
    const response = await axios.get('https://api.kucoin.com/api/v1/currencies', {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('Currency info fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching currency info:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch currency info',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
}); 