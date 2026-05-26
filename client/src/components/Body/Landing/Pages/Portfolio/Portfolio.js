import React, { useMemo, useState } from 'react';
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
  Filler,
} from 'chart.js';

import BinanceIntegration from './BinanceIntegration';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Mock portfolio — production wires this to /trading/positions + Binance vault.
const PORTFOLIO = {
  totalValue: 158432.67,
  change24h: 5.34,
  totalPnl: 23567.89,
  totalPnlPercentage: 17.45,
  availableBalance: 25678.90,
  holdings: [
    { symbol: 'BTC',  name: 'Bitcoin',  amount: '2.5643',  value: 89765.43, avgBuyPrice: 32450.21, pnl: 12543.67, pnlPercentage: 15.67, change24h: 4.32,  allocation: 45.3 },
    { symbol: 'ETH',  name: 'Ethereum', amount: '15.234',  value: 45678.90, avgBuyPrice: 2789.34,  pnl: 8765.43,  pnlPercentage: 21.34, change24h: 6.78,  allocation: 28.7 },
    { symbol: 'SOL',  name: 'Solana',   amount: '234.567', value: 23456.78, avgBuyPrice: 87.65,    pnl: 3456.78,  pnlPercentage: 18.90, change24h: -2.45, allocation: 15.5 },
    { symbol: 'DOT',  name: 'Polkadot', amount: '567.89',  value: 12345.67, avgBuyPrice: 19.87,    pnl: 1234.56,  pnlPercentage: 12.34, change24h: 3.21,  allocation: 10.5 },
  ],
  recentTransactions: [
    { type: 'buy',  symbol: 'BTC', amount: '0.5432', price: 35678.90, total: 19378.90, date: '2024-03-20T10:30:00Z' },
    { type: 'sell', symbol: 'ETH', amount: '3.456',  price: 2890.12,  total: 9988.25,  date: '2024-03-19T15:45:00Z' },
    { type: 'buy',  symbol: 'SOL', amount: '45.678', price: 89.32,    total: 4080.00,  date: '2024-03-18T09:15:00Z' },
    { type: 'buy',  symbol: 'DOT', amount: '123.45', price: 21.34,    total: 2634.43,  date: '2024-03-17T14:20:00Z' },
    { type: 'sell', symbol: 'BTC', amount: '0.2345', price: 36789.10, total: 8627.04,  date: '2024-03-16T11:05:00Z' },
  ],
};

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'holdings',     label: 'Holdings' },
  { id: 'transactions', label: 'Transactions' },
];

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1D');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    const labels = [];
    const points = { '1D': 24, '1W': 7, '1M': 30, '3M': 90, '1Y': 12, ALL: 24 }[timeRange] || 24;
    let value = PORTFOLIO.totalValue;
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now);
      if (timeRange === '1D') {
        d.setHours(now.getHours() - i);
        labels.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else if (timeRange === '1W') {
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString([], { weekday: 'short' }));
      } else if (timeRange === '1M' || timeRange === '3M') {
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      } else {
        d.setMonth(now.getMonth() - i);
        labels.push(d.toLocaleDateString([], { month: 'short', year: '2-digit' }));
      }
      value += (Math.random() - 0.5) * (value * 0.02);
      data.push(value);
    }
    return {
      labels,
      datasets: [{
        label: 'Portfolio Value',
        data,
        borderColor: '#6ee7ff',
        backgroundColor: 'rgba(110,231,255,0.10)',
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
      }],
    };
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(11,16,24,0.95)',
        titleColor: '#e2e8f0', bodyColor: '#6ee7ff',
        borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        padding: 12,
        callbacks: { label: (ctx) => `$${ctx.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 0 } },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#94a3b8', callback: (v) => '$' + v.toLocaleString() },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsRefreshing(false);
  };

  const summaryCards = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="qc-card">
        <h3 className="qc-label-up">Total Portfolio Value</h3>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-3xl font-bold">${PORTFOLIO.totalValue.toLocaleString()}</span>
          <span className={`text-sm font-semibold ${PORTFOLIO.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {PORTFOLIO.change24h >= 0 ? '+' : ''}{PORTFOLIO.change24h}%
          </span>
        </div>
      </div>
      <div className="qc-card">
        <h3 className="qc-label-up">Total P&amp;L</h3>
        <div className="flex items-baseline gap-3 mt-2">
          <span className={`text-3xl font-bold ${PORTFOLIO.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${PORTFOLIO.totalPnl.toLocaleString()}
          </span>
          <span className={`text-sm font-semibold ${PORTFOLIO.totalPnlPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {PORTFOLIO.totalPnlPercentage >= 0 ? '+' : ''}{PORTFOLIO.totalPnlPercentage}%
          </span>
        </div>
      </div>
      <div className="qc-card">
        <h3 className="qc-label-up">Available Balance</h3>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-3xl font-bold">${PORTFOLIO.availableBalance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const overview = (
    <div className="flex flex-col gap-6">
      {summaryCards}

      <article className="qc-card">
        <header className="flex justify-between items-center gap-4 mb-4 flex-wrap">
          <h3 className="text-base font-semibold">Portfolio Performance</h3>
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  timeRange === r ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
                onClick={() => setTimeRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </header>
        <div className="w-full h-[280px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </article>

      <BinanceIntegration onTransaction={handleRefresh} />
    </div>
  );

  const holdings = (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold">Your Holdings</h3>
          <p className="text-sm text-slate-400 mt-1">Per-asset rollup including avg buy price, unrealised P/L, and allocation.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="qc-btn qc-btn-ghost">Deposit</button>
          <button type="button" className="qc-btn qc-btn-ghost">Withdraw</button>
          <button type="button" className="qc-btn qc-btn-ghost">Trade</button>
        </div>
      </header>
      <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Asset', 'Amount', 'Value', 'Avg buy', 'P&L', '24h', 'Allocation'].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PORTFOLIO.holdings.map((h) => (
              <tr key={h.symbol} className="border-t border-white/[0.06]">
                <td className="px-3.5 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">{h.symbol}</span>
                    <span className="text-xs text-slate-400">{h.name}</span>
                  </div>
                </td>
                <td className="px-3.5 py-3 font-mono">{h.amount}</td>
                <td className="px-3.5 py-3 font-mono">${h.value.toLocaleString()}</td>
                <td className="px-3.5 py-3 font-mono text-slate-300">${h.avgBuyPrice.toLocaleString()}</td>
                <td className="px-3.5 py-3">
                  <div className="flex flex-col">
                    <span className={`font-semibold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${h.pnl.toLocaleString()}
                    </span>
                    <span className={`text-xs ${h.pnlPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {h.pnlPercentage >= 0 ? '+' : ''}{h.pnlPercentage}%
                    </span>
                  </div>
                </td>
                <td className={`px-3.5 py-3 font-semibold ${h.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {h.change24h >= 0 ? '+' : ''}{h.change24h}%
                </td>
                <td className="px-3.5 py-3 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400" style={{ width: `${h.allocation}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 font-mono">{h.allocation}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );

  const transactions = (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold">Recent Transactions</h3>
          <p className="text-sm text-slate-400 mt-1">For engine-side history see Positions and Reconcile.</p>
        </div>
        <button type="button" className="qc-btn qc-btn-ghost">View All</button>
      </header>
      <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Type', 'Asset', 'Amount', 'Price', 'Total', 'Date'].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PORTFOLIO.recentTransactions.map((tx, i) => (
              <tr key={i} className="border-t border-white/[0.06]">
                <td className="px-3.5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[0.7rem] tracking-wider ${
                    tx.type === 'buy' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                  }`}>
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-3.5 py-3 font-semibold">{tx.symbol}</td>
                <td className="px-3.5 py-3 font-mono">{tx.amount}</td>
                <td className="px-3.5 py-3 font-mono text-slate-300">${tx.price.toLocaleString()}</td>
                <td className="px-3.5 py-3 font-mono">${tx.total.toLocaleString()}</td>
                <td className="px-3.5 py-3 text-slate-400">{new Date(tx.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );

  return (
    <div className="max-w-[1280px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold qc-title-gradient">Portfolio</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">${PORTFOLIO.totalValue.toLocaleString()}</span>
            <span className={`text-sm font-semibold ${PORTFOLIO.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {PORTFOLIO.change24h >= 0 ? '+' : ''}{PORTFOLIO.change24h}%
            </span>
          </div>
        </div>
        <button type="button" className="qc-btn qc-btn-ghost" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="flex gap-1 p-1 bg-black/25 rounded-xl border border-white/10 self-start flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.id ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300 hover:bg-white/[0.04]'
            }`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'     && overview}
      {activeTab === 'holdings'     && holdings}
      {activeTab === 'transactions' && transactions}
    </div>
  );
};

export default Portfolio;
