import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const PriceChart = ({ symbol, timeframe }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: '#0b1018' }, textColor: '#cbd5e1' },
      grid:   { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      crosshair: {
        mode: 0,
        vertLine: { width: 1, color: '#6ee7ff', style: 0 },
        horzLine: { width: 1, color: '#6ee7ff', style: 0 },
      },
      rightPriceScale: { borderColor: '#1e293b', scaleMargins: { top: 0.1, bottom: 0.2 } },
      timeScale:       { borderColor: '#1e293b', timeVisible: true, secondsVisible: false },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#34d399', downColor: '#fb7185', borderVisible: false,
      wickUpColor: '#34d399', wickDownColor: '#fb7185',
    });
    const volumeSeries = chart.addHistogramSeries({
      color: '#6ee7ff', priceFormat: { type: 'volume' }, priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    chartRef.current = chart;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    (async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${timeframe}&limit=200`
        );
        const data = await response.json();
        candlestickSeries.setData(
          data.map((d) => ({
            time:  d[0] / 1000,
            open:  parseFloat(d[1]),
            high:  parseFloat(d[2]),
            low:   parseFloat(d[3]),
            close: parseFloat(d[4]),
          }))
        );
        volumeSeries.setData(
          data.map((d) => ({
            time:  d[0] / 1000,
            value: parseFloat(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#34d39933' : '#fb718533',
          }))
        );
      } catch (e) {
        console.error('Error fetching historical data:', e);
      }
    })();

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@kline_${timeframe}`
    );
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.k) return;
      const { t, o, h, l, c, v } = data.k;
      const sec = t / 1000;
      candlestickSeries.update({
        time: sec, open: parseFloat(o), high: parseFloat(h), low: parseFloat(l), close: parseFloat(c),
      });
      volumeSeries.update({
        time: sec, value: parseFloat(v),
        color: parseFloat(c) >= parseFloat(o) ? '#34d39933' : '#fb718533',
      });
    };
    wsRef.current = ws;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) wsRef.current.close();
      chart.remove();
    };
  }, [symbol, timeframe]);

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

const PREDEFINED_COINS = [
  { symbol: 'BTC',   name: 'Bitcoin',   icon: '₿', color: '#F7931A' },
  { symbol: 'ETH',   name: 'Ethereum',  icon: 'Ξ', color: '#627EEA' },
  { symbol: 'SOL',   name: 'Solana',    icon: 'S', color: '#00FFA3' },
  { symbol: 'XRP',   name: 'Ripple',    icon: 'X', color: '#23292F' },
  { symbol: 'BNB',   name: 'Binance',   icon: 'B', color: '#F3BA2F' },
  { symbol: 'ADA',   name: 'Cardano',   icon: 'A', color: '#0033AD' },
  { symbol: 'DOGE',  name: 'Dogecoin',  icon: 'D', color: '#C2A633' },
  { symbol: 'DOT',   name: 'Polkadot',  icon: '●', color: '#E6007A' },
  { symbol: 'AVAX',  name: 'Avalanche', icon: 'A', color: '#E84142' },
  { symbol: 'MATIC', name: 'Polygon',   icon: 'M', color: '#8247E5' },
];

const TIMEFRAMES = [
  { value: '1m',  label: '1M'  },
  { value: '5m',  label: '5M'  },
  { value: '15m', label: '15M' },
  { value: '1h',  label: '1H'  },
  { value: '4h',  label: '4H'  },
  { value: '1d',  label: '1D'  },
];

const CoinIcon = ({ coin, size = 32 }) => (
  <div
    className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    style={{ backgroundColor: coin.color, width: size, height: size, fontSize: size * 0.5 }}
  >
    {coin.icon}
  </div>
);

const Market = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('5m');
  const wsRef = useRef(null);
  const priceRefs = useRef({});

  // Live ticker WebSocket
  useEffect(() => {
    const streams = PREDEFINED_COINS.map((c) => `${c.symbol.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
    ws.onmessage = (event) => {
      const d = JSON.parse(event.data);
      setCryptoData((prev) => {
        const idx = prev.findIndex((it) => it.symbol === d.s.replace('USDT', ''));
        if (idx === -1) return prev;
        const oldPrice = prev[idx].price;
        const newPrice = parseFloat(d.c);
        priceRefs.current[d.s] = {
          direction: newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'none',
          timestamp: Date.now(),
        };
        const next = [...prev];
        next[idx] = {
          ...prev[idx],
          price: newPrice,
          change: parseFloat(d.P),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          volume: parseFloat(d.v),
          priceChange: newPrice - oldPrice,
        };
        return next;
      });
    };
    wsRef.current = ws;
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  // Initial 24h-ticker snapshot
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await r.json();
        const initial = data
          .filter((p) => PREDEFINED_COINS.some((c) => p.symbol === `${c.symbol}USDT`))
          .map((p) => {
            const coin = PREDEFINED_COINS.find((c) => p.symbol === `${c.symbol}USDT`);
            return {
              ...coin,
              price: parseFloat(p.lastPrice),
              change: parseFloat(p.priceChangePercent),
              volume: parseFloat(p.volume),
              high: parseFloat(p.highPrice),
              low: parseFloat(p.lowPrice),
              priceChange: 0,
            };
          });
        // Preserve the predefined order even after filter.
        initial.sort(
          (a, b) =>
            PREDEFINED_COINS.findIndex((c) => c.symbol === a.symbol) -
            PREDEFINED_COINS.findIndex((c) => c.symbol === b.symbol)
        );
        setCryptoData(initial);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to fetch cryptocurrency data. Please try again later.');
        setLoading(false);
      }
    })();
  }, []);

  const priceTickClass = useCallback((symbol) => {
    const info = priceRefs.current[`${symbol}USDT`];
    if (!info || Date.now() - info.timestamp > 1000) return '';
    if (info.direction === 'up') return 'animate-pulse text-emerald-400';
    if (info.direction === 'down') return 'animate-pulse text-rose-400';
    return '';
  }, []);

  const selected = cryptoData.find((c) => c.symbol === selectedSymbol);
  const selectedCoin = PREDEFINED_COINS.find((c) => c.symbol === selectedSymbol);

  if (loading && cryptoData.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto p-8 flex flex-col items-center gap-4 text-slate-300">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
        <p>Loading market data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto p-8 flex flex-col items-center gap-4">
        <p className="text-rose-400">{error}</p>
        <button type="button" className="qc-btn qc-btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header>
        <h1 className="text-3xl font-bold qc-title-gradient">Live Cryptocurrency Market</h1>
        <p className="mt-2 text-slate-300 leading-relaxed">
          Real-time price updates streamed from Binance over WebSocket.
        </p>
      </header>

      <article className="qc-card">
        <header className="flex justify-between items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            {selectedCoin && <CoinIcon coin={selectedCoin} />}
            <h3 className="m-0 text-lg font-semibold">{selectedSymbol}/USDT</h3>
            {selected && (
              <span className={`text-sm font-semibold ${selected.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selected.change >= 0 ? '+' : ''}{selected.change.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  timeframe === tf.value
                    ? 'bg-cyan-300/20 text-cyan-300'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </header>
        <PriceChart symbol={selectedSymbol} timeframe={timeframe} />
      </article>

      <article className="qc-card">
        <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Coin', 'Price', '24h Change', '24h Volume', '24h High / Low'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cryptoData.map((coin) => (
                <tr
                  key={coin.symbol}
                  className={`border-t border-white/[0.06] cursor-pointer transition ${
                    selectedSymbol === coin.symbol ? 'bg-cyan-300/[0.06]' : 'hover:bg-white/[0.02]'
                  }`}
                  onClick={() => setSelectedSymbol(coin.symbol)}
                >
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <CoinIcon coin={coin} size={28} />
                      <div className="flex flex-col">
                        <span className="text-slate-100 font-medium">{coin.name}</span>
                        <span className="text-slate-400 text-xs uppercase">{coin.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`px-3.5 py-3 font-mono transition-colors ${priceTickClass(coin.symbol)}`}>
                    ${coin.price.toFixed(2)}
                  </td>
                  <td className={`px-3.5 py-3 font-semibold ${coin.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                  </td>
                  <td className="px-3.5 py-3 text-slate-300 whitespace-nowrap">
                    ${(coin.volume * coin.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap text-slate-400">
                    <span className="text-emerald-400">${coin.high.toFixed(2)}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-rose-400">${coin.low.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default Market;
