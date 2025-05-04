import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './Market.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const PriceChart = ({ symbol }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: `${symbol}/USDT Price`,
      data: [],
      borderColor: '#26a69a',
      backgroundColor: 'rgba(38, 166, 154, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1,
    }]
  });
  const wsRef = useRef();

  useEffect(() => {
    // Connect to Binance WebSocket for 5-minute intervals
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@kline_5m`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const kline = data.k;
      setChartData(prevData => {
        const newData = [...prevData.datasets[0].data, {
          x: new Date(kline.t),
          y: parseFloat(kline.c)
        }];
        
        // Keep only last 20 data points (100 minutes of data)
        if (newData.length > 20) {
          newData.shift();
        }

        return {
          labels: newData.map(item => item.x),
          datasets: [{
            ...prevData.datasets[0],
            data: newData
          }]
        };
      });
    };

    wsRef.current = ws;

    // Fetch historical data for 5-minute intervals
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=5m&limit=20`
        );
        const data = await response.json();
        const formattedData = data.map(item => ({
          x: new Date(item[0]),
          y: parseFloat(item[4]) // Closing price
        }));

        setChartData({
          labels: formattedData.map(item => item.x),
          datasets: [{
            label: `${symbol}/USDT Price`,
            data: formattedData,
            borderColor: '#26a69a',
            backgroundColor: 'rgba(38, 166, 154, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
          }]
        });
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${symbol}/USDT Price Chart (5m)`,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="price-chart-container">
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const Market = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const wsRef = useRef(null);

  // Predefined list of coins
  const predefinedCoins = [
    'BTC', 'ETH', 'SOL', 'XRP', 'SUI', 'TRX', 'ADA', 'TRUMP', 'DOGE', 'PEPE',
    'VIRTUAL', 'BNB', 'FDUSD', 'LTC', 'AAVE', 'LINK', 'DOT', 'AVAX', 'BCH', 'EOS',
    'WIF', 'WLD', 'NEAR', 'XLM', 'MEMEFI', 'XMR', 'HBAR', 'MNT', 'ALPACA', 'SHIB',
    'BONK', 'OP', 'AI16Z', 'BGB', 'FET', 'ARB', 'AIXBT', 'ETC', 'CRV', 'UNI',
    'ONDO', 'DASH', 'FIL', 'APT', 'BERA', 'ASR', 'KAS', 'DEEP', 'ENS', 'ATOM'
  ];

  // Initialize WebSocket connection for all coins
  useEffect(() => {
    const symbols = predefinedCoins.map(coin => `${coin.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCryptoData(prevData => {
        const updatedData = [...prevData];
        const index = updatedData.findIndex(item => item.symbol === data.s.replace('USDT', ''));
        
        if (index !== -1) {
          updatedData[index] = {
            ...updatedData[index],
            price: parseFloat(data.c),
            change: parseFloat(data.P),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            volume: parseFloat(data.v)
          };
        }
        
        return updatedData;
      });
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();
        
        const initialData = data
          .filter(pair => predefinedCoins.includes(pair.symbol.replace('USDT', '')))
          .map(pair => ({
            symbol: pair.symbol.replace('USDT', ''),
            price: parseFloat(pair.lastPrice),
            change: parseFloat(pair.priceChangePercent),
            volume: parseFloat(pair.volume),
            high: parseFloat(pair.highPrice),
            low: parseFloat(pair.lowPrice)
          }))
          .sort((a, b) => predefinedCoins.indexOf(a.symbol) - predefinedCoins.indexOf(b.symbol));

        setCryptoData(initialData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to fetch cryptocurrency data. Please try again later.');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>Cryptocurrency Market</h1>
        <p>Real-time price updates for major cryptocurrencies</p>
      </div>

      <div className="market-content">
        <div className="market-chart">
          <PriceChart symbol={selectedSymbol} />
        </div>

        <div className="market-table-container">
          <table className="market-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>24h Volume</th>
                <th>High/Low</th>
              </tr>
            </thead>
            <tbody>
              {cryptoData.map((coin) => (
                <tr 
                  key={coin.symbol} 
                  className={`market-row ${selectedSymbol === coin.symbol ? 'selected' : ''}`}
                  onClick={() => setSelectedSymbol(coin.symbol)}
                >
                  <td className="coin-cell">
                    <span className="coin-symbol">{coin.symbol}</span>
                  </td>
                  <td>${coin.price.toFixed(2)}</td>
                  <td className={coin.change >= 0 ? 'positive' : 'negative'}>
                    {coin.change.toFixed(2)}%
                  </td>
                  <td>${coin.volume.toFixed(2)}</td>
                  <td className="high-low-cell">
                    <div className="high-low-indicator">
                      <span className="high">H: ${coin.high.toFixed(2)}</span>
                      <span className="low">L: ${coin.low.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Market;
