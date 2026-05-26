import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DUMMY_BALANCES = [
  { asset: 'BTC',  free: '2.5643',  locked: '0.1000' },
  { asset: 'ETH',  free: '15.234',  locked: '0.500' },
  { asset: 'SOL',  free: '234.567', locked: '10.000' },
  { asset: 'USDT', free: '25678.90', locked: '1000.00' },
];

const DUMMY_TRADES = [
  { symbol: 'BTCUSDT', price: '35678.90', qty: '0.5432', time: Date.now() - 3600000,  isBuyer: true  },
  { symbol: 'ETHUSDT', price: '2890.12',  qty: '3.456',  time: Date.now() - 7200000,  isBuyer: false },
  { symbol: 'SOLUSDT', price: '89.32',    qty: '45.678', time: Date.now() - 10800000, isBuyer: true  },
];

const BinanceIntegration = ({ onTransaction }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('buy');
  const [transactionData, setTransactionData] = useState({ symbol: '', amount: '', price: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Failed to connect to Binance');
    } finally {
      setLoading(false);
    }
  };
  const handleDisconnect = () => setIsConnected(false);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      onTransaction?.({
        type: transactionType,
        symbol: transactionData.symbol,
        amount: parseFloat(transactionData.amount),
        price: parseFloat(transactionData.price),
        total: parseFloat(transactionData.amount) * parseFloat(transactionData.price),
        date: new Date().toISOString(),
      });
      setShowTransactionModal(false);
      setTransactionData({ symbol: '', amount: '', price: '' });
    } catch (err) {
      setError('Failed to execute transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Binance integration (demo)</h3>
          <p className="text-sm text-slate-400 mt-1">
            Illustrative view with mock balances. For production, use the
            encrypted vault at{' '}
            <Link to="/settings/api-keys" className="text-cyan-300 hover:underline">/settings/api-keys</Link>.
          </p>
        </div>
        {isConnected && (
          <span className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Connected
          </span>
        )}
      </header>

      {!isConnected ? (
        <button
          type="button"
          className="qc-btn qc-btn-primary"
          onClick={handleConnect}
          disabled={loading}
        >
          <span className="text-lg leading-none">₿</span>
          <span>{loading ? 'Connecting…' : 'Connect Binance (demo)'}</span>
        </button>
      ) : (
        <>
          <div className="mb-4">
            <h4 className="qc-label-up mb-2">Account Summary</h4>
            <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Asset', 'Free', 'Locked'].map((h) => (
                      <th key={h} className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_BALANCES.map((b) => (
                    <tr key={b.asset} className="border-t border-white/[0.06]">
                      <td className="px-3.5 py-2.5 font-semibold">{b.asset}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-200">{b.free}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-400">{b.locked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap mb-5">
            <button
              type="button"
              className="qc-btn qc-btn-ghost text-emerald-300 border-emerald-400/30"
              onClick={() => { setTransactionType('buy'); setShowTransactionModal(true); }}
              disabled={loading}
            >
              Buy
            </button>
            <button
              type="button"
              className="qc-btn qc-btn-ghost text-rose-300 border-rose-400/30"
              onClick={() => { setTransactionType('sell'); setShowTransactionModal(true); }}
              disabled={loading}
            >
              Sell
            </button>
            <button type="button" className="qc-btn qc-btn-ghost" onClick={handleDisconnect} disabled={loading}>
              Disconnect
            </button>
          </div>

          <div>
            <h4 className="qc-label-up mb-2">Recent trades</h4>
            <div className="flex flex-col gap-2">
              {DUMMY_TRADES.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/20 border border-white/[0.06]">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[0.7rem] tracking-wider ${
                    t.isBuyer ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                  }`}>
                    {t.isBuyer ? 'BUY' : 'SELL'}
                  </span>
                  <span className="font-mono text-sm">{t.qty} {t.symbol}</span>
                  <span className="font-mono text-sm text-slate-300 ml-auto">${t.price}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(t.time).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="mt-3 bg-rose-500/12 border border-rose-400/35 text-rose-300 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showTransactionModal && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog" aria-modal="true"
          onMouseDown={() => !loading && setShowTransactionModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 p-6 text-slate-100 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, rgba(36,40,58,0.95), rgba(20,22,32,0.95))' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {transactionType === 'buy' ? 'Buy' : 'Sell'} Cryptocurrency (demo)
            </h3>
            <form onSubmit={handleTransactionSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="qc-label-up">Symbol</span>
                <input
                  type="text" required placeholder="e.g. BTCUSDT"
                  className="qc-input font-mono"
                  value={transactionData.symbol}
                  onChange={(e) => setTransactionData({ ...transactionData, symbol: e.target.value.toUpperCase() })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="qc-label-up">Amount</span>
                <input
                  type="number" required step="any" placeholder="Amount"
                  className="qc-input"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="qc-label-up">Price (USD)</span>
                <input
                  type="number" required step="any" placeholder="Price per unit"
                  className="qc-input"
                  value={transactionData.price}
                  onChange={(e) => setTransactionData({ ...transactionData, price: e.target.value })}
                />
              </label>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button" className="qc-btn qc-btn-ghost"
                  onClick={() => setShowTransactionModal(false)} disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="qc-btn qc-btn-primary" disabled={loading}>
                  {loading ? 'Processing…' : transactionType === 'buy' ? 'Buy' : 'Sell'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
};

export default BinanceIntegration;
