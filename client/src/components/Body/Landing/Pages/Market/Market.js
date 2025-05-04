import React, { useState, useEffect, useCallback } from 'react';
import './Market.css';

const Market = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'price', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currency, setCurrency] = useState('USDT');
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('24h');
  const [inrRate, setInrRate] = useState(83);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const perPage = 20;

  // Fetch INR rate
  const fetchInrRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setInrRate(data.rates.INR);
    } catch (err) {
      console.error('Failed to fetch INR rate:', err);
    }
  };

  const fetchCryptoData = useCallback(async () => {
    // Rate limiting - only fetch every 30 seconds
    const now = Date.now();
    if (now - lastFetchTime < 30000) {
      return;
    }
    setLastFetchTime(now);

    try {
      setLoading(true);
      
      // Use our proxy server
      const proxyBaseUrl = 'http://localhost:5000/api';
      
      // Fetch market data
      const marketResponse = await fetch(`${proxyBaseUrl}/market`);
      if (!marketResponse.ok) throw new Error('Failed to fetch market data');
      const marketData = await marketResponse.json();
      
      // Fetch currency info
      const currencyResponse = await fetch(`${proxyBaseUrl}/currencies`);
      if (!currencyResponse.ok) throw new Error('Failed to fetch currency info');
      const currencyData = await currencyResponse.json();

      if (!marketData.data || !Array.isArray(marketData.data.ticker)) {
        throw new Error('Invalid market data format');
      }

      // Process the data
      const processedData = marketData.data.ticker
        .filter(item => item.symbol.endsWith(currency))
        .map(item => {
          const symbol = item.symbol.replace(`-${currency}`, '');
          const currencyInfo = currencyData.data.find(c => c.currency === symbol);
          const price = parseFloat(item.last) || 0;
          const usdPrice = currency === 'USDT' ? price : price * 1; // USDT is 1:1 with USD
          
          return {
            symbol: symbol,
            name: currencyInfo?.fullName || symbol,
            current_price: price,
            inr_price: usdPrice * inrRate,
            price_change_percentage_24h: parseFloat(item.changeRate) * 100 || 0,
            high_24h: parseFloat(item.high) || price,
            low_24h: parseFloat(item.low) || price,
            total_volume: parseFloat(item.vol) || 0,
            quote_volume: parseFloat(item.volValue) || 0,
            market_cap: parseFloat(item.volValue) || 0,
            image: `https://assets.kucoin.com/${symbol.toLowerCase()}.png`,
            market_cap_rank: 0
          };
        })
        .sort((a, b) => b.market_cap - a.market_cap)
        .map((item, index) => ({
          ...item,
          market_cap_rank: index + 1
        }));

      if (processedData.length === 0) {
        throw new Error('No valid data after processing');
      }

      setCryptoData(processedData);
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch cryptocurrency data. Please try again later.');
      setLoading(false);
    }
  }, [currency, inrRate, lastFetchTime]);

  useEffect(() => {
    fetchInrRate();
    const inrInterval = setInterval(fetchInrRate, 3600000); // Update INR rate every hour
    return () => clearInterval(inrInterval);
  }, []);

  useEffect(() => {
    setCryptoData([]);
    setPage(1);
    setHasMore(true);
    fetchCryptoData();
  }, [currency, filter, timeframe, fetchCryptoData]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      fetchCryptoData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  }, [fetchCryptoData]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedData = () => {
    let filteredData = [...cryptoData];

    switch (filter) {
      case 'trending':
        filteredData = filteredData.filter(coin => Math.abs(coin.price_change_percentage_24h) > 5);
        break;
      case 'highest':
        filteredData = filteredData.sort((a, b) => b.current_price - a.current_price);
        break;
      case 'lowest':
        filteredData = filteredData.sort((a, b) => a.current_price - b.current_price);
        break;
      case 'gainers':
        filteredData = filteredData.filter(coin => coin.price_change_percentage_24h > 0)
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        break;
      case 'losers':
        filteredData = filteredData.filter(coin => coin.price_change_percentage_24h < 0)
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
        break;
      default:
        filteredData.sort((a, b) => {
          if (sortConfig.direction === 'asc') {
            return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
          }
          return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
        });
    }

    return filteredData;
  };

  const formatNumber = (num, isInr = false) => {
    if (!num) return '0.00';
    const formattedNum = num.toFixed(2);
    if (isInr) {
      return `₹${formattedNum}`;
    }
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    return formattedNum;
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  if (loading && cryptoData.length === 0) {
    return (
      <div className="market-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchCryptoData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredAndSortedData();

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>Cryptocurrency Market</h1>
        <p>Real-time cryptocurrency prices and market data</p>
      </div>

      <div className="market-controls">
        <div className="controls-row">
          <div className="currency-selector">
            <button 
              className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >
              USD
            </button>
            <button 
              className={`currency-btn ${currency === 'USDT' ? 'active' : ''}`}
              onClick={() => setCurrency('USDT')}
            >
              USDT
            </button>
            <button 
              className={`currency-btn ${currency === 'BUSD' ? 'active' : ''}`}
              onClick={() => setCurrency('BUSD')}
            >
              BUSD
            </button>
            <button 
              className={`currency-btn ${currency === 'INR' ? 'active' : ''}`}
              onClick={() => setCurrency('INR')}
            >
              INR
            </button>
          </div>

          <div className="timeframe-selector">
            <button 
              className={`timeframe-btn ${timeframe === '24h' ? 'active' : ''}`}
              onClick={() => setTimeframe('24h')}
            >
              24H
            </button>
            <button 
              className={`timeframe-btn ${timeframe === '7d' ? 'active' : ''}`}
              onClick={() => setTimeframe('7d')}
            >
              7D
            </button>
            <button 
              className={`timeframe-btn ${timeframe === '30d' ? 'active' : ''}`}
              onClick={() => setTimeframe('30d')}
            >
              30D
            </button>
          </div>
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'trending' ? 'active' : ''}`}
            onClick={() => setFilter('trending')}
          >
            Trending
          </button>
          <button 
            className={`filter-btn ${filter === 'highest' ? 'active' : ''}`}
            onClick={() => setFilter('highest')}
          >
            Highest Price
          </button>
          <button 
            className={`filter-btn ${filter === 'lowest' ? 'active' : ''}`}
            onClick={() => setFilter('lowest')}
          >
            Lowest Price
          </button>
          <button 
            className={`filter-btn ${filter === 'gainers' ? 'active' : ''}`}
            onClick={() => setFilter('gainers')}
          >
            Top Gainers
          </button>
          <button 
            className={`filter-btn ${filter === 'losers' ? 'active' : ''}`}
            onClick={() => setFilter('losers')}
          >
            Top Losers
          </button>
        </div>
      </div>

      <div className="market-table-container">
        <table className="market-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('market_cap_rank')}>#</th>
              <th>Coin</th>
              <th onClick={() => handleSort('current_price')}>Price</th>
              <th onClick={() => handleSort('price_change_percentage_24h')}>24h %</th>
              <th>High/Low</th>
              <th onClick={() => handleSort('total_volume')}>Volume (24h)</th>
              <th onClick={() => handleSort('quote_volume')}>Quote Volume</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((coin) => (
              <tr key={coin.symbol} className="market-row">
                <td>{coin.market_cap_rank}</td>
                <td className="coin-cell">
                  <img src={coin.image} alt={coin.name} className="coin-image" />
                  <div className="coin-info">
                    <span className="coin-name">{coin.name}</span>
                    <span className="coin-symbol">{coin.symbol}</span>
                  </div>
                </td>
                <td>
                  {currency === 'INR' 
                    ? formatNumber(coin.inr_price, true)
                    : `${formatNumber(coin.current_price)} ${currency}`}
                </td>
                <td className={coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>
                  {coin.price_change_percentage_24h?.toFixed(2)}%
                </td>
                <td className="high-low-cell">
                  <div className="high-low-indicator">
                    <span className="high">
                      H: {currency === 'INR' 
                        ? formatNumber(coin.high_24h * inrRate, true)
                        : formatNumber(coin.high_24h)}
                    </span>
                    <span className="low">
                      L: {currency === 'INR'
                        ? formatNumber(coin.low_24h * inrRate, true)
                        : formatNumber(coin.low_24h)}
                    </span>
                  </div>
                </td>
                <td>{formatNumber(coin.total_volume)}</td>
                <td>
                  {currency === 'INR'
                    ? formatNumber(coin.quote_volume * inrRate, true)
                    : `${formatNumber(coin.quote_volume)} ${currency}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div className="load-more-container">
            <button 
              className="load-more-button" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
