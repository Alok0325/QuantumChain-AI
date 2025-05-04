import React, { useState, useEffect } from 'react';
import './Market.css';

const Market = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'marketCap', direction: 'desc' });

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchCryptoData = async () => {
      try {
        // Simulated data - replace with actual API call
        const mockData = [
          {
            id: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            currentPrice: 65432.21,
            marketCap: 1250000000000,
            marketCapRank: 1,
            priceChangePercentage24h: 2.5,
            totalVolume: 45000000000,
            circulatingSupply: 19500000,
            totalSupply: 21000000,
          },
          {
            id: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            currentPrice: 3456.78,
            marketCap: 415000000000,
            marketCapRank: 2,
            priceChangePercentage24h: -1.2,
            totalVolume: 25000000000,
            circulatingSupply: 120000000,
            totalSupply: null,
          },
          {
            id: 'solana',
            symbol: 'SOL',
            name: 'Solana',
            image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
            currentPrice: 123.45,
            marketCap: 52000000000,
            marketCapRank: 5,
            priceChangePercentage24h: 5.7,
            totalVolume: 3500000000,
            circulatingSupply: 420000000,
            totalSupply: 535000000,
          },
        ];
        setCryptoData(mockData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch cryptocurrency data');
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...cryptoData].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
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
        </div>
      </div>
    );
  }

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>Cryptocurrency Market</h1>
        <p>Real-time cryptocurrency prices and market data</p>
      </div>

      <div className="market-table-container">
        <table className="market-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('marketCapRank')}>#</th>
              <th>Coin</th>
              <th onClick={() => handleSort('currentPrice')}>Price</th>
              <th onClick={() => handleSort('priceChangePercentage24h')}>24h %</th>
              <th onClick={() => handleSort('marketCap')}>Market Cap</th>
              <th onClick={() => handleSort('totalVolume')}>Volume (24h)</th>
              <th onClick={() => handleSort('circulatingSupply')}>Circulating Supply</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((coin) => (
              <tr key={coin.id} className="market-row">
                <td>{coin.marketCapRank}</td>
                <td className="coin-cell">
                  <img src={coin.image} alt={coin.name} className="coin-image" />
                  <div className="coin-info">
                    <span className="coin-name">{coin.name}</span>
                    <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                  </div>
                </td>
                <td>{formatNumber(coin.currentPrice)}</td>
                <td className={coin.priceChangePercentage24h >= 0 ? 'positive' : 'negative'}>
                  {coin.priceChangePercentage24h.toFixed(2)}%
                </td>
                <td>{formatNumber(coin.marketCap)}</td>
                <td>{formatNumber(coin.totalVolume)}</td>
                <td>
                  {formatNumber(coin.circulatingSupply)}
                  {coin.totalSupply && ` / ${formatNumber(coin.totalSupply)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Market;
