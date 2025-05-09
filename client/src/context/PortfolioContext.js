import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext(null);

// Mock data generator
const generateMockPortfolioData = () => {
  const mockHoldings = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: (Math.random() * 2).toFixed(4),
      value: (Math.random() * 100000).toFixed(2),
      change24h: (Math.random() * 10 - 5).toFixed(2),
      allocation: Math.floor(Math.random() * 60 + 20),
      avgBuyPrice: (Math.random() * 50000).toFixed(2),
      pnl: (Math.random() * 30000).toFixed(2),
      pnlPercentage: (Math.random() * 50).toFixed(2)
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: (Math.random() * 20).toFixed(4),
      value: (Math.random() * 50000).toFixed(2),
      change24h: (Math.random() * 10 - 5).toFixed(2),
      allocation: Math.floor(Math.random() * 30 + 10),
      avgBuyPrice: (Math.random() * 3000).toFixed(2),
      pnl: (Math.random() * 15000).toFixed(2),
      pnlPercentage: (Math.random() * 40).toFixed(2)
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      amount: (Math.random() * 200).toFixed(4),
      value: (Math.random() * 30000).toFixed(2),
      change24h: (Math.random() * 10 - 5).toFixed(2),
      allocation: Math.floor(Math.random() * 20 + 5),
      avgBuyPrice: (Math.random() * 200).toFixed(2),
      pnl: (Math.random() * 10000).toFixed(2),
      pnlPercentage: (Math.random() * 30).toFixed(2)
    }
  ];

  const totalValue = mockHoldings.reduce((sum, holding) => sum + parseFloat(holding.value), 0);
  const totalPnl = mockHoldings.reduce((sum, holding) => sum + parseFloat(holding.pnl), 0);
  const totalPnlPercentage = ((totalPnl / (totalValue - totalPnl)) * 100).toFixed(2);

  return {
    totalValue: totalValue.toFixed(2),
    totalPnl: totalPnl.toFixed(2),
    totalPnlPercentage,
    change24h: (Math.random() * 10 - 5).toFixed(2),
    availableBalance: (Math.random() * 10000).toFixed(2),
    holdings: mockHoldings,
    recentTransactions: [
      {
        type: 'buy',
        symbol: 'BTC',
        amount: (Math.random() * 0.5).toFixed(4),
        price: (Math.random() * 50000).toFixed(2),
        total: (Math.random() * 25000).toFixed(2),
        date: new Date(Date.now() - Math.random() * 86400000).toISOString()
      },
      {
        type: 'sell',
        symbol: 'ETH',
        amount: (Math.random() * 5).toFixed(4),
        price: (Math.random() * 3000).toFixed(2),
        total: (Math.random() * 15000).toFixed(2),
        date: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }
    ]
  };
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1D');

  // Simulate real-time updates
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data = generateMockPortfolioData();
        setPortfolioData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch portfolio data');
        console.error('Portfolio data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time updates
    const updateInterval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  }, [user, timeRange]);

  const value = {
    portfolioData,
    loading,
    error,
    timeRange,
    setTimeRange,
    refreshData: () => {
      setLoading(true);
      const data = generateMockPortfolioData();
      setPortfolioData(data);
      setLoading(false);
    }
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}; 