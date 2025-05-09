import axios from 'axios';
import CryptoJS from 'crypto-js';

const BASE_URL = 'https://api.binance.com/api/v3';

const generateSignature = (queryString, secretKey) => {
  return CryptoJS.HmacSHA256(queryString, secretKey).toString();
};

const createSignedRequest = (endpoint, params, apiKey, secretKey) => {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  const signature = generateSignature(queryString, secretKey);
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

  return fetch(url, {
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  }).then(res => res.json());
};

export const getAccountInfo = async (apiKey, secretKey) => {
  const timestamp = Date.now();
  return createSignedRequest('/account', { timestamp }, apiKey, secretKey);
};

export const getPortfolioData = async (apiKey, secretKey) => {
  const timestamp = Date.now();
  const accountInfo = await getAccountInfo(apiKey, secretKey);
  
  // Calculate total portfolio value
  const balances = accountInfo.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
  
  // Get current prices for all assets
  const symbols = balances.map(b => `${b.asset}USDT`).join(',');
  const pricesResponse = await fetch(`${BASE_URL}/ticker/price?symbols=[${symbols}]`);
  const prices = await pricesResponse.json();
  
  // Calculate total value and individual holdings
  let totalValue = 0;
  const holdings = balances.map(balance => {
    const price = prices.find(p => p.symbol === `${balance.asset}USDT`)?.price || 0;
    const value = (parseFloat(balance.free) + parseFloat(balance.locked)) * parseFloat(price);
    totalValue += value;
    
    return {
      symbol: balance.asset,
      name: balance.asset,
      amount: parseFloat(balance.free) + parseFloat(balance.locked),
      value: value,
      avgBuyPrice: 0, // This would require historical trade data
      pnl: 0, // This would require historical trade data
      pnlPercentage: 0,
      change24h: 0, // This would require 24h price change data
      allocation: 0, // Will be calculated after total value is known
    };
  });

  // Calculate allocations
  holdings.forEach(holding => {
    holding.allocation = (holding.value / totalValue) * 100;
  });

  return {
    totalValue,
    holdings,
    change24h: 0, // This would require historical data
    totalPnl: 0,
    totalPnlPercentage: 0,
    availableBalance: parseFloat(accountInfo.availableBalance || 0),
  };
};

export const getRecentTransactions = async (apiKey, secretKey) => {
  const timestamp = Date.now();
  const trades = await createSignedRequest('/myTrades', { timestamp }, apiKey, secretKey);
  
  return trades.map(trade => ({
    type: trade.isBuyer ? 'buy' : 'sell',
    symbol: trade.symbol,
    amount: parseFloat(trade.qty),
    price: parseFloat(trade.price),
    total: parseFloat(trade.qty) * parseFloat(trade.price),
    date: trade.time,
  }));
};

export const placeOrder = async (apiKey, secretKey, symbol, side, quantity, price = null) => {
  const timestamp = Date.now();
  const params = {
    symbol,
    side,
    type: price ? 'LIMIT' : 'MARKET',
    quantity,
    timestamp,
  };

  if (price) {
    params.price = price;
  }

  return createSignedRequest('/order', params, apiKey, secretKey);
};

class BinanceService {
  constructor() {
    this.apiKey = process.env.REACT_APP_BINANCE_API_KEY;
    this.apiSecret = process.env.REACT_APP_BINANCE_API_SECRET;
    this.baseUrl = BASE_URL;
  }

  // Get all orders for a symbol
  async getAllOrders(symbol) {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await axios.get(`${this.baseUrl}/allOrders`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        },
        params: {
          symbol,
          timestamp,
          signature
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get recent trades
  async getRecentTrades(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/trades`, {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      throw error;
    }
  }

  // Get current prices for all symbols
  async getAllPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/price`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }

  // Generate HMAC SHA256 signature using crypto-js
  generateSignature(queryString) {
    return CryptoJS.HmacSHA256(queryString, this.apiSecret).toString();
  }
}

export default new BinanceService(); 