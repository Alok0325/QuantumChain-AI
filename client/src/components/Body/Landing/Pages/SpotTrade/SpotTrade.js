import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import './SpotTrade.css';

const SpotTrade = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const wsRef = useRef(null);

  const tradingPairs = [
    { symbol: 'BTC/USDT', price: '43,521.23', change: '+2.34%' },
    { symbol: 'ETH/USDT', price: '2,345.67', change: '-1.23%' },
    { symbol: 'SOL/USDT', price: '98.45', change: '+5.67%' },
    { symbol: 'BNB/USDT', price: '312.89', change: '+0.89%' },
  ];

  const orderBook = {
    asks: [
      { price: '43,521.23', amount: '0.1234', total: '5,370.52' },
      { price: '43,520.00', amount: '0.2345', total: '10,205.94' },
      { price: '43,519.50', amount: '0.3456', total: '15,039.74' },
    ],
    bids: [
      { price: '43,518.00', amount: '0.4567', total: '19,874.17' },
      { price: '43,517.50', amount: '0.5678', total: '24,709.64' },
      { price: '43,517.00', amount: '0.6789', total: '29,544.59' },
    ],
  };

  const recentTrades = [
    { price: '43,521.23', amount: '0.1234', time: '12:34:56', side: 'buy' },
    { price: '43,520.00', amount: '0.2345', time: '12:34:55', side: 'sell' },
    { price: '43,519.50', amount: '0.3456', time: '12:34:54', side: 'buy' },
  ];

  // Function to fetch historical klines (candlestick) data
  const fetchHistoricalData = async (symbol, interval) => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`
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

      return { candleData, volumeData };
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return { candleData: [], volumeData: [] };
    }
  };

  // Function to get interval for Binance API
  const getInterval = (timeframe) => {
    const intervals = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    return intervals[timeframe] || '1h';
  };

  // Initialize WebSocket connection
  const initializeWebSocket = (symbol) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const formattedSymbol = symbol.replace('/', '').toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${formattedSymbol}@kline_${getInterval(timeframe)}`);

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

        candlestickSeriesRef.current?.update(candleData);
        volumeSeriesRef.current?.update(volumeData);
      }
    };

    wsRef.current = ws;
  };

  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current) {
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

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00c853',
        downColor: '#ff3d00',
        borderVisible: false,
        wickUpColor: '#00c853',
        wickDownColor: '#ff3d00',
      });

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

      // Initial data load
      const symbol = selectedPair.replace('/', '');
      fetchHistoricalData(symbol, getInterval(timeframe)).then(({ candleData, volumeData }) => {
        candlestickSeries.setData(candleData);
        volumeSeries.setData(volumeData);
      });
      initializeWebSocket(symbol);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (wsRef.current) {
          wsRef.current.close();
        }
        chart.remove();
      };
    }
  }, []);

  // Handle pair and timeframe changes
  useEffect(() => {
    const symbol = selectedPair.replace('/', '');
    fetchHistoricalData(symbol, getInterval(timeframe)).then(({ candleData, volumeData }) => {
      candlestickSeriesRef.current?.setData(candleData);
      volumeSeriesRef.current?.setData(volumeData);
    });
    initializeWebSocket(symbol);
  }, [selectedPair, timeframe]);

  return (
    <div className="spot-trade-container">
      <div className="trading-pairs">
        <h3>Trading Pairs</h3>
        <div className="pairs-list">
          {tradingPairs.map((pair) => (
            <div
              key={pair.symbol}
              className={`pair-item ${selectedPair === pair.symbol ? 'selected' : ''}`}
              onClick={() => setSelectedPair(pair.symbol)}
            >
              <span className="pair-symbol">{pair.symbol}</span>
              <span className="pair-price">${pair.price}</span>
              <span className={`pair-change ${pair.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {pair.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="trading-chart">
        <div className="chart-header">
          <h3>{selectedPair} Chart</h3>
          <div className="chart-controls">
            <button 
              className={`time-button ${timeframe === '1m' ? 'active' : ''}`}
              onClick={() => setTimeframe('1m')}
            >
              1M
            </button>
            <button 
              className={`time-button ${timeframe === '5m' ? 'active' : ''}`}
              onClick={() => setTimeframe('5m')}
            >
              5M
            </button>
            <button 
              className={`time-button ${timeframe === '15m' ? 'active' : ''}`}
              onClick={() => setTimeframe('15m')}
            >
              15M
            </button>
            <button 
              className={`time-button ${timeframe === '1h' ? 'active' : ''}`}
              onClick={() => setTimeframe('1h')}
            >
              1H
            </button>
            <button 
              className={`time-button ${timeframe === '4h' ? 'active' : ''}`}
              onClick={() => setTimeframe('4h')}
            >
              4H
            </button>
            <button 
              className={`time-button ${timeframe === '1d' ? 'active' : ''}`}
              onClick={() => setTimeframe('1d')}
            >
              1D
            </button>
          </div>
        </div>
        <div className="chart-container" ref={chartContainerRef}></div>
      </div>

      <div className="trading-panel">
        <div className="order-book">
          <h3>Order Book</h3>
          <div className="order-book-content">
            <div className="asks">
              {orderBook.asks.map((ask, index) => (
                <div key={index} className="order-row ask">
                  <span className="price">{ask.price}</span>
                  <span className="amount">{ask.amount}</span>
                  <span className="total">{ask.total}</span>
                </div>
              ))}
            </div>
            <div className="spread">
              <span>Spread: 0.01%</span>
            </div>
            <div className="bids">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="order-row bid">
                  <span className="price">{bid.price}</span>
                  <span className="amount">{bid.amount}</span>
                  <span className="total">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-form">
          <div className="order-tabs">
            <button
              className={`order-tab ${orderType === 'limit' ? 'active' : ''}`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
            <button
              className={`order-tab ${orderType === 'market' ? 'active' : ''}`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
          </div>

          <div className="order-side">
            <button
              className={`side-button ${side === 'buy' ? 'active buy' : ''}`}
              onClick={() => setSide('buy')}
            >
              Buy
            </button>
            <button
              className={`side-button ${side === 'sell' ? 'active sell' : ''}`}
              onClick={() => setSide('sell')}
            >
              Sell
            </button>
          </div>

          <div className="order-inputs">
            <div className="input-group">
              <label>Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={orderType === 'market'}
              />
            </div>
            <div className="input-group">
              <label>Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="input-group">
              <label>Total</label>
              <input
                type="number"
                value={price && amount ? (price * amount).toFixed(2) : ''}
                placeholder="0.00"
                disabled
              />
            </div>
          </div>

          <button className={`submit-order ${side}`}>
            {side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.split('/')[0]}
          </button>
        </div>

        <div className="recent-trades">
          <h3>Recent Trades</h3>
          <div className="trades-list">
            {recentTrades.map((trade, index) => (
              <div key={index} className={`trade-row ${trade.side}`}>
                <span className="trade-price">{trade.price}</span>
                <span className="trade-amount">{trade.amount}</span>
                <span className="trade-time">{trade.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotTrade; 