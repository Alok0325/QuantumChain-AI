import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '../../../../../context/AuthContext';
import positionsService from '../../../../../services/positionsService';

const RANGES = [
  { days: 7,   label: '7d' },
  { days: 30,  label: '30d' },
  { days: 90,  label: '90d' },
  { days: 365, label: '1y' },
];

const usd = (v) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: Math.abs(Number(v)) >= 100 ? 2 : 4,
      }).format(v);

const num = (v, d = 6) =>
  v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });

const pnlClass = (v) =>
  v == null || v === 0 ? 'text-slate-100' : v > 0 ? 'text-emerald-400' : 'text-rose-400';

const Positions = () => {
  const { isAuthed } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (d) => {
    setLoading(true); setError(null);
    try {
      const r = await positionsService.positions(d);
      if (!r) {
        setError('Sign in to view positions.');
        setData(null);
      } else {
        setData(r);
      }
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthed) load(days); }, [days, isAuthed, load]);

  if (!isAuthed) return <Navigate to="/login" />;

  const positions = data?.positions || [];
  const totalRealised = positions.reduce((s, p) => s + Number(p.realizedPnlUsd || 0), 0);
  const totalFills = positions.reduce((s, p) => s + Number(p.fills || 0), 0);
  const totalActions = positions.reduce(
    (s, p) => s + Number(p.fills || 0) + Number(p.dryRuns || 0) + Number(p.skips || 0) + Number(p.failures || 0),
    0
  );

  return (
    <div className="max-w-[1100px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold qc-title-gradient">Positions</h1>
          <p className="mt-2 max-w-3xl text-slate-300 leading-relaxed">
            Per-symbol rollup of the engine&apos;s ledger over the selected window:
            net position, average prices, realized P/L, and a count of every
            ledger action (fills, dry-runs, skips, failures).
          </p>
          <p className="mt-1 text-slate-400 text-sm">
            For exchange-of-truth view, use{' '}
            <Link to="/settings/reconcile" className="text-cyan-300 hover:underline">trade reconciliation</Link>.
          </p>
        </div>
        <Link to="/predictions" className="text-cyan-300 hover:underline text-sm whitespace-nowrap shrink-0">← Back to predictions</Link>
      </header>

      <article className="qc-card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="qc-label-up">Window</span>
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                  days === r.days ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="text-slate-400 text-sm ml-auto">
            {data && `${data.totalLedgerRows} ledger rows · since ${new Date(data.since).toLocaleDateString()}`}
          </span>
        </div>
        {error && (
          <div className="mt-4 bg-rose-500/12 border border-rose-400/35 text-rose-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </article>

      {data && positions.length > 0 && (
        <>
          <article className="qc-card">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-6 gap-y-3">
              <div className="flex flex-col gap-1">
                <span className="qc-label-up">Symbols traded</span>
                <span className="text-xl font-semibold">{positions.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="qc-label-up">Total fills</span>
                <span className="text-xl font-semibold">{totalFills}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="qc-label-up">Total ledger actions</span>
                <span className="text-xl font-semibold">{totalActions}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="qc-label-up">Realized P/L</span>
                <span className={`text-xl font-semibold ${pnlClass(totalRealised)}`}>{usd(totalRealised)}</span>
              </div>
            </div>
          </article>

          <article className="qc-card">
            <header className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold">Per-symbol</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Net qty is engine-tracked only (filled or submitted rows). Manual trades won&apos;t appear here.
                </p>
              </div>
            </header>
            <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Symbol','Net qty','Buy qty','Sell qty','Avg entry','Avg exit','Realized','Fills','Dry-run','Skips','Failures','Last action'].map((h) => (
                      <th key={h} className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr]:border-t [&_tr]:border-white/[0.06] hover:[&_tr]:bg-white/[0.02]">
                  {positions.map((p) => (
                    <tr key={p.symbol} className="whitespace-nowrap">
                      <td className="px-3.5 py-3 font-semibold">{p.symbol}</td>
                      <td className={`px-3.5 py-3 ${p.netQty > 0 ? 'text-emerald-400' : p.netQty < 0 ? 'text-rose-400' : ''}`}>{num(p.netQty)}</td>
                      <td className="px-3.5 py-3">{num(p.buyQty)}</td>
                      <td className="px-3.5 py-3">{num(p.sellQty)}</td>
                      <td className="px-3.5 py-3">{usd(p.avgEntryPrice)}</td>
                      <td className="px-3.5 py-3">{usd(p.avgExitPrice)}</td>
                      <td className={`px-3.5 py-3 font-semibold ${pnlClass(p.realizedPnlUsd)}`}>{usd(p.realizedPnlUsd)}</td>
                      <td className="px-3.5 py-3">{p.fills}</td>
                      <td className="px-3.5 py-3 text-slate-400">{p.dryRuns}</td>
                      <td className="px-3.5 py-3 text-slate-400">{p.skips}</td>
                      <td className={`px-3.5 py-3 ${p.failures > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{p.failures}</td>
                      <td className="px-3.5 py-3 text-slate-400">{p.lastActionAt ? new Date(p.lastActionAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}

      {data && positions.length === 0 && !loading && (
        <article className="qc-card text-center">
          <p className="text-slate-400">
            No ledger activity in the last {days} day{days === 1 ? '' : 's'}.
            Enable auto-trade on the{' '}
            <Link to="/predictions" className="text-cyan-300 hover:underline">predictions page</Link>{' '}
            to start accumulating actions.
          </p>
        </article>
      )}
    </div>
  );
};

export default Positions;
