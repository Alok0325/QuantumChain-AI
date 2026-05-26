import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import accuracyService from '../../../../../services/accuracyService';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'ATOM'];
const WINDOWS = [
  { days: 7,   label: '7d' },
  { days: 14,  label: '14d' },
  { days: 30,  label: '30d' },
  { days: 90,  label: '90d' },
];

const accuracyTone = (pct) => {
  if (pct == null) return 'text-slate-400';
  if (pct >= 60) return 'text-emerald-400';
  if (pct >= 52) return 'text-cyan-300';
  if (pct >= 50) return 'text-slate-200';
  return 'text-rose-400';
};

const Accuracy = () => {
  const [windowDays, setWindowDays] = useState(14);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(null);

  const load = useCallback(async (days) => {
    setLoading(true);
    try {
      const r = await accuracyService.forSymbols(SYMBOLS, days);
      setRows(r);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(windowDays); }, [windowDays, load]);

  const handleTrain = async (symbol) => {
    setTraining(symbol);
    try {
      await accuracyService.trainSymbol(symbol);
      toast.success(`Training kicked off for ${symbol}.`);
      await load(windowDays);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTraining(null);
    }
  };

  const trained = rows.filter((r) => r.accuracy_pct != null);
  const avg =
    trained.length > 0
      ? trained.reduce((s, r) => s + Number(r.accuracy_pct), 0) / trained.length
      : null;

  return (
    <div className="max-w-[1000px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold qc-title-gradient">Model Accuracy</h1>
          <p className="mt-2 max-w-3xl text-slate-300 leading-relaxed">
            Rolling-window directional accuracy for the active forecast backend
            (XGBoost / LSTM / ensemble). Compares each predicted close-vs-open
            direction to the realised candle over the lookback window. 50% is
            random — above that, the model has signal.
          </p>
        </div>
        <Link to="/predictions" className="text-cyan-300 hover:underline text-sm whitespace-nowrap shrink-0">
          ← Back to predictions
        </Link>
      </header>

      <article className="qc-card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="qc-label-up">Lookback window</span>
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                type="button"
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                  windowDays === w.days
                    ? 'bg-cyan-300/20 text-cyan-300'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
                onClick={() => setWindowDays(w.days)}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="qc-btn qc-btn-ghost ml-auto"
            onClick={() => load(windowDays)}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </article>

      {avg != null && (
        <article className="qc-card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="qc-label-up">Trained symbols</span>
              <span className="text-xl font-semibold">{trained.length} / {SYMBOLS.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="qc-label-up">Average accuracy</span>
              <span className={`text-xl font-semibold ${accuracyTone(avg)}`}>{avg.toFixed(1)}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="qc-label-up">Window</span>
              <span className="text-xl font-semibold">{windowDays} days</span>
            </div>
          </div>
        </article>
      )}

      <article className="qc-card">
        <header className="mb-4">
          <h3 className="text-base font-semibold">Per-symbol</h3>
          <p className="text-sm text-slate-400 mt-1">
            Training kicks off a fresh fit against ~360 days of candles. Walk-forward
            retraining runs automatically every 24h on symbols that already have a model.
          </p>
        </header>
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const trained = r.accuracy_pct != null;
            const width = trained ? Math.min(100, Math.max(0, Number(r.accuracy_pct))) : 0;
            const barColor =
              !trained ? 'bg-slate-600' :
              r.accuracy_pct >= 60 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
              r.accuracy_pct >= 52 ? 'bg-gradient-to-r from-cyan-400 to-cyan-300' :
              r.accuracy_pct >= 50 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
              'bg-gradient-to-r from-rose-500 to-rose-400';
            return (
              <div key={r.symbol} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-16 shrink-0">
                  <div className="font-bold text-lg">{r.symbol}</div>
                  <div className="text-xs text-slate-400">{r.samples ?? 0} samples</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden relative">
                    <div
                      className={`absolute left-0 top-0 h-full ${barColor} transition-[width] duration-500`}
                      style={{ width: `${width}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-px bg-white/40"
                      style={{ left: '50%' }}
                      title="50% baseline"
                    />
                  </div>
                  {r.error && (
                    <div className="text-xs text-rose-400 mt-1">{r.error}</div>
                  )}
                </div>
                <div className="w-24 text-right shrink-0">
                  <div className={`text-xl font-semibold ${accuracyTone(r.accuracy_pct)}`}>
                    {trained ? `${Number(r.accuracy_pct).toFixed(1)}%` : '—'}
                  </div>
                </div>
                <button
                  type="button"
                  className="qc-btn qc-btn-ghost shrink-0"
                  onClick={() => handleTrain(r.symbol)}
                  disabled={training === r.symbol}
                >
                  {training === r.symbol ? 'Training…' : trained ? 'Retrain' : 'Train'}
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="qc-card bg-amber-500/5 border-amber-400/15">
        <p className="m-0 text-amber-200 text-sm leading-relaxed">
          <strong className="text-amber-300">Reading the numbers:</strong>{' '}
          accuracy below ~50% means the model is *anti-correlated* with the market
          and the same trades flipped would be profitable. Accuracy 50-52% is noise
          — don&apos;t live-trade on it. 55%+ is meaningful signal; 60%+ is strong
          (and rare for hourly crypto forecasting on small models).
        </p>
      </article>
    </div>
  );
};

export default Accuracy;
