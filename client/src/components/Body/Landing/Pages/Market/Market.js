import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import './Market.css';

const PriceChart = ({ symbol }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      // Create chart instance
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: '#1a1a1a' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#242424' },
          horzLines: { color: '#242424' },
        },
        crosshair: {
          mode: 0,
          vertLine: {
            width: 1,
            color: '#00ffff',
            style: 0,
          },
          horzLine: {
            width: 1,
            color: '#00ffff',
            style: 0,
          },
        },
        rightPriceScale: {
          borderColor: '#242424',
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },
        timeScale: {
          borderColor: '#242424',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00c853',
        downColor: '#ff3d00',
        borderVisible: false,
        wickUpColor: '#00c853',
        wickDownColor: '#ff3d00',
      });

      // Create volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;
      chartRef.current = chart;

      // Handle resize
      const handleResize = () => {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      };

      window.addEventListener('resize', handleResize);

      // Fetch historical data
      const fetchHistoricalData = async () => {
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=5m&limit=100`
          );
          const data = await response.json();
          
          const candleData = data.map(d => ({
            time: d[0] / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4])
          }));

          const volumeData = data.map(d => ({
            time: d[0] / 1000,
            value: parseFloat(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#00c85333' : '#ff3d0033'
          }));

          candlestickSeries.setData(candleData);
          volumeSeries.setData(volumeData);
        } catch (error) {
          console.error('Error fetching historical data:', error);
        }
      };

      fetchHistoricalData();

      // Initialize WebSocket connection
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@kline_5m`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.k) {
          const { t: time, o: open, h: high, l: low, c: close, v: volume } = data.k;

          const candleData = {
            time: time / 1000,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close)
          };

          const volumeData = {
            time: time / 1000,
            value: parseFloat(volume),
            color: parseFloat(close) >= parseFloat(open) ? '#00c85333' : '#ff3d0033'
          };

          candlestickSeries.update(candleData);
          volumeSeries.update(volumeData);
        }
      };

      wsRef.current = ws;

      return () => {
        window.removeEventListener('resize', handleResize);
        if (wsRef.current) {
          wsRef.current.close();
        }
        chart.remove();
      };
    }
  }, [symbol]);

  return (
    <div className="price-chart-container">
      <div className="chart-container" ref={chartContainerRef}></div>
    </div>
  );
};

const Market = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('5m');
  const wsRef = useRef(null);
  const priceRefs = useRef({});

  // Predefined list of coins with metadata
  const predefinedCoins = [
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
    { symbol: 'SOL', name: 'Solana', icon: 'S', color: '#00FFA3' },
    { symbol: 'XRP', name: 'Ripple', icon: 'X', color: '#23292F' },
    { symbol: 'BNB', name: 'Binance', icon: 'B', color: '#F3BA2F' },
    { symbol: 'ADA', name: 'Cardano', icon: 'A', color: '#0033AD' },
    { symbol: 'DOGE', name: 'Dogecoin', icon: 'D', color: '#C2A633' },
    { symbol: 'DOT', name: 'Polkadot', icon: '●', color: '#E6007A' },
    { symbol: 'AVAX', name: 'Avalanche', icon: 'A', color: '#E84142' },
    { symbol: 'MATIC', name: 'Polygon', icon: 'M', color: '#8247E5' }
  ];

  // Initialize WebSocket connection for all coins
  useEffect(() => {
    const symbols = predefinedCoins.map(coin => `${coin.symbol.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCryptoData(prevData => {
        const updatedData = [...prevData];
        const index = updatedData.findIndex(item => item.symbol === data.s.replace('USDT', ''));
        
        if (index !== -1) {
          const oldPrice = updatedData[index].price;
          const newPrice = parseFloat(data.c);
          
          priceRefs.current[data.s] = {
            direction: newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'none',
            timestamp: Date.now()
          };

          updatedData[index] = {
            ...updatedData[index],
            price: newPrice,
            change: parseFloat(data.P),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            volume: parseFloat(data.v),
            priceChange: newPrice - oldPrice
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

  // Initial data fetch from Binance API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();
        
        const initialData = data
          .filter(pair => predefinedCoins.some(coin => pair.symbol === `${coin.symbol}USDT`))
          .map(pair => {
            const coin = predefinedCoins.find(c => pair.symbol === `${c.symbol}USDT`);
            return {
              ...coin,
              price: parseFloat(pair.lastPrice),
              change: parseFloat(pair.priceChangePercent),
              volume: parseFloat(pair.volume),
              high: parseFloat(pair.highPrice),
              low: parseFloat(pair.lowPrice),
              priceChange: 0
            };
          });

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

  const getPriceChangeClass = useCallback((symbol) => {
    const priceInfo = priceRefs.current[`${symbol}USDT`];
    if (!priceInfo) return '';
    
    if (Date.now() - priceInfo.timestamp > 1000) return '';
    
    return priceInfo.direction === 'up' ? 'price-up' : 
           priceInfo.direction === 'down' ? 'price-down' : '';
  }, []);

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
  ];

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
        <h1>Live Cryptocurrency Market</h1>
        <p>Real-time price updates from Binance</p>
      </div>

      <div className="market-content">
        <div className="market-chart">
          <div className="chart-header">
            <div className="chart-title">
              <div className="selected-coin">
                <div 
                  className="coin-icon"
                  style={{
                    backgroundColor: predefinedCoins.find(c => c.symbol === selectedSymbol)?.color
                  }}
                >
                  {predefinedCoins.find(c => c.symbol === selectedSymbol)?.icon}
                </div>
                <h3>{selectedSymbol}/USDT</h3>
              </div>
              <span className={cryptoData.find(c => c.symbol === selectedSymbol)?.change >= 0 ? 'positive' : 'negative'}>
                {cryptoData.find(c => c.symbol === selectedSymbol)?.change.toFixed(2)}%
              </span>
            </div>
            <div className="timeframe-selector">
              {timeframes.map(tf => (
                <button
                  key={tf.value}
                  className={`timeframe-btn ${timeframe === tf.value ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf.value)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          <PriceChart symbol={selectedSymbol} />
        </div>

        <div className="market-table-container">
          <table className="market-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>24h Volume</th>
                <th>24h High/Low</th>
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
                    <div 
                      className="coin-icon"
                      style={{
                        backgroundColor: coin.color
                      }}
                    >
                      {coin.icon}
                    </div>
                    <div className="coin-info">
                      <span className="coin-name">{coin.name}</span>
                      <span className="coin-symbol">{coin.symbol}</span>
                    </div>
                  </td>
                  <td className={`price-cell ${getPriceChangeClass(coin.symbol)}`}>
                    ${coin.price.toFixed(2)}
                  </td>
                  <td className={coin.change >= 0 ? 'positive' : 'negative'}>
                    {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                  </td>
                  <td>${(coin.volume * coin.price).toLocaleString()}</td>
                  <td className="high-low-cell">
                    <div className="high-low-indicator">
                      <span className="high">${coin.high.toFixed(2)}</span>
                      <span className="separator">/</span>
                      <span className="low">${coin.low.toFixed(2)}</span>
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
