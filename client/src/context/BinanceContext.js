import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAccountInfo, getPortfolioData, getRecentTransactions } from '../services/binanceService';

const BinanceContext = createContext();

export const useBinance = () => {
  const context = useContext(BinanceContext);
  if (!context) {
    throw new Error('useBinance must be used within a BinanceProvider');
  }
  return context;
};

export const BinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1D');

  const fetchPortfolioData = async () => {
    if (!user?.binanceApiKey || !user?.binanceApiSecret) {
      setError('Please configure your Binance API keys in your profile');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch account info
      const accountInfo = await getAccountInfo(user.binanceApiKey, user.binanceApiSecret);
      
      // Fetch portfolio data
      const portfolio = await getPortfolioData(user.binanceApiKey, user.binanceApiSecret);
      
      // Fetch recent transactions
      const transactions = await getRecentTransactions(user.binanceApiKey, user.binanceApiSecret);

      // Combine all data
      const combinedData = {
        ...portfolio,
        accountInfo,
        recentTransactions: transactions,
      };

      setPortfolioData(combinedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when API keys are available or changed
  useEffect(() => {
    if (user?.binanceApiKey && user?.binanceApiSecret) {
      fetchPortfolioData();
    }
  }, [user?.binanceApiKey, user?.binanceApiSecret]);

  const value = {
    portfolioData,
    loading,
    error,
    timeRange,
    setTimeRange,
    refreshData: fetchPortfolioData,
  };

  return (
    <BinanceContext.Provider value={value}>
      {children}
    </BinanceContext.Provider>
  );
}; 