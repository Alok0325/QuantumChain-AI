import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const TRADING_PAIRS = [
  { symbol: 'BTC/USDT', price: '43,521.23', change: '+2.34%' },
  { symbol: 'ETH/USDT', price: '2,345.67',  change: '-1.23%' },
  { symbol: 'SOL/USDT', price: '98.45',     change: '+5.67%' },
  { symbol: 'BNB/USDT', price: '312.89',    change: '+0.89%' },
];

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const ORDER_BOOK = {
  asks: [
    { price: '43,521.23', amount: '0.1234', total: '5,370.52'  },
    { price: '43,520.00', amount: '0.2345', total: '10,205.94' },
    { price: '43,519.50', amount: '0.3456', total: '15,039.74' },
  ],
  bids: [
    { price: '43,518.00', amount: '0.4567', total: '19,874.17' },
    { price: '43,517.50', amount: '0.5678', total: '24,709.64' },
    { price: '43,517.00', amount: '0.6789', total: '29,544.59' },
  ],
};

const RECENT_TRADES = [
  { price: '43,521.23', amount: '0.1234', time: '12:34:56', side: 'buy'  },
  { price: '43,520.00', amount: '0.2345', time: '12:34:55', side: 'sell' },
  { price: '43,519.50', amount: '0.3456', time: '12:34:54', side: 'buy'  },
];

const SpotTrade = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const chartContainerRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const wsRef = useRef(null);

  const fetchHistorical = async (symbol, interval) => {
    try {
      const r = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`
      );
      const data = await r.json();
      return {
        candles: data.map((d) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]), high: parseFloat(d[2]),
          low: parseFloat(d[3]),  close: parseFloat(d[4]),
        })),
        volumes: data.map((d) => ({
          time: d[0] / 1000,
          value: parseFloat(d[5]),
          color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#34d39933' : '#fb718533',
        })),
      };
    } catch (e) {
      console.error('Error fetching historical data:', e);
      return { candles: [], volumes: [] };
    }
  };

  const openWebSocket = (symbol, interval) => {
    if (wsRef.current) wsRef.current.close();
    const formatted = symbol.replace('/', '').toLowerCase();
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${formatted}@kline_${interval}`
    );
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.k) return;
      const { t, o, h, l, c, v } = data.k;
      candlestickSeriesRef.current?.update({
        time: t / 1000,
        open: parseFloat(o), high: parseFloat(h),
        low: parseFloat(l), close: parseFloat(c),
      });
      volumeSeriesRef.current?.update({
        time: t / 1000, value: parseFloat(v),
        color: parseFloat(c) >= parseFloat(o) ? '#34d39933' : '#fb718533',
      });
    };
    wsRef.current = ws;
  };

  // Initialize chart once
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
      height: 420,
    });
    const candles = chart.addCandlestickSeries({
      upColor: '#34d399', downColor: '#fb7185', borderVisible: false,
      wickUpColor: '#34d399', wickDownColor: '#fb7185',
    });
    const volume = chart.addHistogramSeries({
      color: '#6ee7ff', priceFormat: { type: 'volume' }, priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    candlestickSeriesRef.current = candles;
    volumeSeriesRef.current = volume;

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) wsRef.current.close();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load + stream new pair/timeframe
  useEffect(() => {
    const symbol = selectedPair.replace('/', '');
    fetchHistorical(symbol, timeframe).then(({ candles, volumes }) => {
      candlestickSeriesRef.current?.setData(candles);
      volumeSeriesRef.current?.setData(volumes);
    });
    openWebSocket(symbol, timeframe);
  }, [selectedPair, timeframe]);

  const baseAsset = selectedPair.split('/')[0];

  return (
    <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px] gap-4 text-slate-100">

      {/* Trading pairs sidebar */}
      <aside className="qc-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Trading Pairs</h3>
        <div className="flex flex-col gap-1.5">
          {TRADING_PAIRS.map((pair) => {
            const positive = pair.change.startsWith('+');
            const selected = selectedPair === pair.symbol;
            return (
              <button
                key={pair.symbol}
                type="button"
                className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg text-left transition border ${
                  selected
                    ? 'bg-cyan-300/10 border-cyan-300/40'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                }`}
                onClick={() => setSelectedPair(pair.symbol)}
              >
                <span className="font-semibold text-sm">{pair.symbol}</span>
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-xs text-slate-300">${pair.price}</span>
                  <span className={`text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pair.change}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Chart */}
      <article className="qc-card p-4 flex flex-col gap-3 min-w-0">
        <header className="flex justify-between items-center gap-3 flex-wrap">
          <h3 className="text-base font-semibold">{selectedPair} chart</h3>
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  timeframe === tf
                    ? 'bg-cyan-300/20 text-cyan-300'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
                onClick={() => setTimeframe(tf)}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <div ref={chartContainerRef} className="w-full h-[420px]" />
      </article>

      {/* Order book + form + trades */}
      <aside className="flex flex-col gap-4 min-w-0">
        {/* Order book */}
        <div className="qc-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Order Book</h3>
          <div className="grid grid-cols-3 text-[0.65rem] text-slate-500 uppercase tracking-wider pb-1.5 border-b border-white/[0.06]">
            <span>Price</span><span className="text-right">Amount</span><span className="text-right">Total</span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1.5">
            {ORDER_BOOK.asks.slice().reverse().map((a, i) => (
              <div key={i} className="grid grid-cols-3 text-xs font-mono py-0.5">
                <span className="text-rose-400">{a.price}</span>
                <span className="text-right text-slate-300">{a.amount}</span>
                <span className="text-right text-slate-400">{a.total}</span>
              </div>
            ))}
          </div>
          <div className="my-1.5 py-1 text-center text-xs text-slate-400 border-y border-white/[0.06]">
            Spread <span className="text-cyan-300 ml-1">0.01%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {ORDER_BOOK.bids.map((b, i) => (
              <div key={i} className="grid grid-cols-3 text-xs font-mono py-0.5">
                <span className="text-emerald-400">{b.price}</span>
                <span className="text-right text-slate-300">{b.amount}</span>
                <span className="text-right text-slate-400">{b.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order form */}
        <div className="qc-card p-4 flex flex-col gap-3">
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10 self-start">
            {['limit', 'market'].map((o) => (
              <button
                key={o}
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-medium transition capitalize ${
                  orderType === o ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300'
                }`}
                onClick={() => setOrderType(o)}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['buy', 'sell'].map((s) => {
              const active = side === s;
              const isBuy = s === 'buy';
              return (
                <button
                  key={s}
                  type="button"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold uppercase transition ${
                    active
                      ? isBuy
                        ? 'bg-emerald-500 text-slate-900'
                        : 'bg-rose-500 text-slate-900'
                      : 'bg-white/5 text-slate-300 hover:bg-white/[0.09]'
                  }`}
                  onClick={() => setSide(s)}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <label className="flex flex-col gap-1">
            <span className="qc-label-up">Price</span>
            <input
              type="number" placeholder="0.00"
              className="qc-input font-mono disabled:opacity-50"
              value={price} onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === 'market'}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="qc-label-up">Amount</span>
            <input
              type="number" placeholder="0.00"
              className="qc-input font-mono"
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="qc-label-up">Total</span>
            <input
              type="number" placeholder="0.00" readOnly disabled
              className="qc-input font-mono opacity-60"
              value={price && amount ? (Number(price) * Number(amount)).toFixed(2) : ''}
            />
          </label>

          <button
            type="button"
            className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-sm transition ${
              side === 'buy'
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-900 hover:-translate-y-0.5'
                : 'bg-gradient-to-r from-rose-400 to-rose-500 text-slate-900 hover:-translate-y-0.5'
            }`}
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {baseAsset}
          </button>
        </div>

        {/* Recent trades */}
        <div className="qc-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Recent Trades</h3>
          <div className="grid grid-cols-3 text-[0.65rem] text-slate-500 uppercase tracking-wider pb-1.5 border-b border-white/[0.06]">
            <span>Price</span><span className="text-right">Amount</span><span className="text-right">Time</span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1.5">
            {RECENT_TRADES.map((t, i) => (
              <div key={i} className="grid grid-cols-3 text-xs font-mono py-0.5">
                <span className={t.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>{t.price}</span>
                <span className="text-right text-slate-300">{t.amount}</span>
                <span className="text-right text-slate-400">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SpotTrade;
