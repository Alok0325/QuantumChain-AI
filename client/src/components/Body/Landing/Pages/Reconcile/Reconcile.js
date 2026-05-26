import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '../../../../../context/AuthContext';
import reconcileService from '../../../../../services/reconcileService';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'ATOM'];

const HELP = {
  API_KEYS_MISSING: (
    <>
      You haven&apos;t saved Binance API keys yet.{' '}
      <Link to="/settings/api-keys" className="text-cyan-300 hover:underline">Add them here →</Link>
    </>
  ),
};

const usd = (v) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: v >= 100 ? 2 : 4 }).format(v);

const num = (v, d = 6) =>
  v == null ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: d });

const time = (msOrSec) => {
  if (!msOrSec) return '—';
  const ms = msOrSec > 1e12 ? msOrSec : msOrSec * 1000;
  return new Date(ms).toLocaleString();
};

const SIDE_TONES = {
  buy:  'bg-emerald-500/15 text-emerald-300',
  sell: 'bg-rose-500/15    text-rose-300',
};
const sideTag = (side) => (
  <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[0.7rem] tracking-wider ${SIDE_TONES[side] || 'bg-slate-500/12 text-slate-300'}`}>
    {side?.toUpperCase()}
  </span>
);

const BUCKET_TONES = {
  good:    { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35' },
  warn:    { pill: 'bg-amber-500/15   text-amber-300   border-amber-400/35' },
  neutral: { pill: 'bg-slate-500/12   text-slate-400   border-slate-400/35' },
};

const Reconcile = () => {
  const { isAuthed } = useAuth();
  const [symbol, setSymbol] = useState('BTC');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthed) return <Navigate to="/login" />;

  const run = async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const result = await reconcileService.reconcile(symbol);
      setData(result);
    } catch (e) {
      const help = e.code && HELP[e.code];
      setError(help || e.message || 'Reconcile failed');
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[1100px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold qc-title-gradient">Trade Reconciliation</h1>
          <p className="mt-2 max-w-3xl text-slate-300 leading-relaxed">
            Compare your local ledger against your real Binance trade history.
            Orders are matched first by Binance{' '}
            <code className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-cyan-300 text-sm">orderId</code>,
            then by the{' '}
            <code className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-cyan-300 text-sm">qc-…</code>{' '}
            <code className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-cyan-300 text-sm">clientOrderId</code>
            {' '}the engine tags on every order it places.
          </p>
        </div>
        <Link to="/predictions" className="text-cyan-300 hover:underline text-sm whitespace-nowrap shrink-0">← Back to predictions</Link>
      </header>

      <article className="qc-card">
        <div className="flex items-end gap-4 flex-wrap">
          <label className="flex flex-col gap-1.5">
            <span className="qc-label-up">Symbol</span>
            <select className="qc-input min-w-[140px]" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {SYMBOLS.map((s) => <option key={s} value={s}>{s}USDT</option>)}
            </select>
          </label>
          <button type="button" className="qc-btn qc-btn-primary" onClick={run} disabled={loading}>
            {loading ? 'Reconciling…' : 'Run reconcile'}
          </button>
        </div>
        {error && (
          <div className="mt-4 bg-rose-500/12 border border-rose-400/35 text-rose-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </article>

      {data && (
        <>
          <article className="qc-card">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-6 gap-y-2 m-0 mb-4">
              <div className="flex flex-col gap-1">
                <dt className="qc-label-up">Symbol</dt><dd className="m-0 font-semibold">{data.symbol}USDT</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="qc-label-up">Ledger rows</dt><dd className="m-0 font-semibold">{data.ledgerRows}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="qc-label-up">Binance trade fills</dt><dd className="m-0 font-semibold">{data.binanceTradeRows}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="qc-label-up">Binance unique orders</dt><dd className="m-0 font-semibold">{data.binanceUniqueOrders}</dd>
              </div>
            </dl>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${BUCKET_TONES.good.pill}`}>{data.engineMatched.length} engine-matched</span>
              <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${BUCKET_TONES.warn.pill}`}>{data.manualOnly.length} manual-only</span>
              <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${BUCKET_TONES.neutral.pill}`}>{data.ledgerOnly.length} ledger-only</span>
            </div>
          </article>

          <Bucket
            title="Engine-matched" tone="good"
            help="Orders the engine placed and we can confirm filled on Binance."
            rows={data.engineMatched}
            headers={['Side', 'Order ID', 'Qty', 'Avg price', 'Quote', 'Ledger', 'Time']}
            renderRow={(r) => (
              <>
                <td className="px-3.5 py-3">{sideTag(r.side)}</td>
                <td className="px-3.5 py-3 font-mono text-sm">{r.orderId}</td>
                <td className="px-3.5 py-3">{num(r.qty)}</td>
                <td className="px-3.5 py-3">{usd(r.avgPrice)}</td>
                <td className="px-3.5 py-3">{usd(r.quoteQty)}</td>
                <td className="px-3.5 py-3">
                  {r.ledgerId ?? <span className="inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-xs font-semibold">no ledger row</span>}
                </td>
                <td className="px-3.5 py-3">{time(r.time)}</td>
              </>
            )}
            empty="No engine-matched orders yet."
          />

          <Bucket
            title="Manual-only" tone="warn"
            help="Trades you made on Binance directly (or by another bot). The engine didn't place these."
            rows={data.manualOnly}
            headers={['Side', 'Order ID', 'Client ID', 'Qty', 'Avg price', 'Quote', 'Time']}
            renderRow={(r) => (
              <>
                <td className="px-3.5 py-3">{sideTag(r.side)}</td>
                <td className="px-3.5 py-3 font-mono text-sm">{r.orderId}</td>
                <td className="px-3.5 py-3 font-mono text-sm">{r.clientOrderId || '—'}</td>
                <td className="px-3.5 py-3">{num(r.qty)}</td>
                <td className="px-3.5 py-3">{usd(r.avgPrice)}</td>
                <td className="px-3.5 py-3">{usd(r.quoteQty)}</td>
                <td className="px-3.5 py-3">{time(r.time)}</td>
              </>
            )}
            empty="No manual trades. Nice and clean."
          />

          <Bucket
            title="Ledger-only" tone="neutral"
            help="Engine ledger rows whose orderId doesn't match any Binance fill. Usually stale (engine restart), failed, or dry-run rows."
            rows={data.ledgerOnly}
            headers={['Side', 'Status', 'Order ID', 'Client ID', 'Row', 'Created']}
            renderRow={(r) => (
              <>
                <td className="px-3.5 py-3">{sideTag(r.side)}</td>
                <td className="px-3.5 py-3">{r.status}</td>
                <td className="px-3.5 py-3 font-mono text-sm">{r.orderId}</td>
                <td className="px-3.5 py-3 font-mono text-sm">{r.clientOrderId || '—'}</td>
                <td className="px-3.5 py-3">#{r.id}</td>
                <td className="px-3.5 py-3">{time(new Date(r.createdAt).getTime())}</td>
              </>
            )}
            empty="No orphan ledger rows."
          />
        </>
      )}
    </div>
  );
};

const Bucket = ({ title, tone, help, rows, renderRow, headers, empty }) => (
  <article className="qc-card">
    <header className="flex justify-between items-start gap-4 mb-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-slate-400 mt-1">{help}</p>
      </div>
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold min-w-[2.5rem] text-center border ${BUCKET_TONES[tone].pill}`}>
        {rows.length}
      </span>
    </header>
    {rows.length === 0 ? (
      <p className="text-slate-400">{empty}</p>
    ) : (
      <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr]:border-t [&_tr]:border-white/[0.06] hover:[&_tr]:bg-white/[0.02]">
            {rows.map((r, i) => (
              <tr key={`${r.orderId || r.id}-${i}`} className="whitespace-nowrap">{renderRow(r)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </article>
);

export default Reconcile;
