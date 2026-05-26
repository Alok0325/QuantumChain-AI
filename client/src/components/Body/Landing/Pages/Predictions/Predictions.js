import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import predictionService from '../../../../../services/predictionService';
import useAutoTradeConfig from '../../../../../hooks/useAutoTradeConfig';
import AckLiveModal from '../../../../AckLiveModal/AckLiveModal';

const SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'ATOM', name: 'Cosmos' },
];

const usd = (v) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: v >= 100 ? 2 : 4,
      }).format(v);

const pct = (v) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const fetchSpot = async (symbol) => {
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance spot ${symbol} ${res.status}`);
  const data = await res.json();
  return parseFloat(data.price);
};

const Predictions = () => {
  const [selected, setSelected] = useState('BTC');
  const [spot, setSpot] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [rationale, setRationale] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [training, setTraining] = useState(false);
  const [serviceHealth, setServiceHealth] = useState(null);

  const {
    config: autoTrade,
    synced,
    saving,
    update: updateAutoTrade,
    engageKill,
    clearKill,
    acknowledgeLiveAndEnable,
  } = useAutoTradeConfig();

  const [ackOpen, setAckOpen] = useState(false);
  const [ackBusy, setAckBusy] = useState(false);

  useEffect(() => {
    predictionService.health().then(setServiceHealth).catch(() => setServiceHealth(null));
  }, []);

  const load = useCallback(async (symbol) => {
    setPrediction(null);
    setRationale(null);
    setSpot(null);

    let anchor = 30000;
    try {
      const price = await fetchSpot(symbol);
      setSpot(price);
      anchor = price;
    } catch {
      setSpot(null);
    }

    setLoadingPrediction(true);
    const pred = await predictionService.predictOrDemo(symbol, anchor);
    setPrediction(pred);
    setLoadingPrediction(false);

    setLoadingRationale(true);
    try {
      const r = await predictionService.rationale({
        symbol,
        current_price: anchor,
        predicted: pred.prediction,
      });
      setRationale(r);
    } catch (err) {
      setRationale({
        rationale: `Rationale unavailable: ${err.message}`,
        confidence_label: 'low',
        risk_factors: ['LLM service offline. Start the FastAPI service with ANTHROPIC_API_KEY set.'],
      });
    } finally {
      setLoadingRationale(false);
    }
  }, []);

  useEffect(() => { load(selected); }, [selected, load]);

  const handleTrain = async () => {
    setTraining(true);
    try {
      await predictionService.train(selected);
      toast.success(`Training kicked off for ${selected}`);
      await load(selected);
    } catch (err) {
      toast.error(`Train failed: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const move = useMemo(() => {
    if (!prediction || !spot) return null;
    return ((prediction.prediction.close - spot) / spot) * 100;
  }, [prediction, spot]);

  const bias = useMemo(() => {
    if (!prediction) return null;
    const { open, close } = prediction.prediction;
    if (close > open * 1.001) return 'bullish';
    if (close < open * 0.999) return 'bearish';
    return 'neutral';
  }, [prediction]);

  const toggleAllowedSymbol = (sym) => {
    const has = autoTrade.allowedSymbols.includes(sym);
    const next = has
      ? autoTrade.allowedSymbols.filter((s) => s !== sym)
      : [...autoTrade.allowedSymbols, sym];
    updateAutoTrade({ allowedSymbols: next });
  };

  const triggerKillSwitch = async () => {
    await engageKill('User triggered kill switch');
    toast.warn('Kill switch engaged — auto-trade disabled.');
  };
  const clearKillSwitch = () => clearKill();

  const handleModeClick = (nextMode) => {
    if (nextMode === autoTrade.mode) return;
    if (nextMode === 'live') {
      if (!synced) {
        toast.error('Sign in first to enable live trading.');
        return;
      }
      setAckOpen(true);
    } else {
      updateAutoTrade({ mode: nextMode });
    }
  };

  const handleAckSubmit = async (password) => {
    setAckBusy(true);
    try {
      await acknowledgeLiveAndEnable(password);
      setAckOpen(false);
      toast.success('Live trading enabled.');
    } finally {
      setAckBusy(false);
    }
  };

  const statusPill = (() => {
    if (!serviceHealth) return { label: 'ML offline · demo', tone: 'warn' };
    if (serviceHealth.predictor_available && serviceHealth.llm_enabled) return { label: 'Live · ML + Claude', tone: 'good' };
    if (serviceHealth.llm_enabled) return { label: 'LLM only · predictor unavailable', tone: 'warn' };
    return { label: 'Predictor only · LLM disabled', tone: 'warn' };
  })();

  const pillBase = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-black/20 whitespace-nowrap';
  const toneCls = statusPill.tone === 'good'
    ? 'border-white/10 text-emerald-300'
    : 'border-white/10 text-amber-300';
  const dotCls = statusPill.tone === 'good'
    ? 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]'
    : 'w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]';

  const confidenceBadge = (label) => {
    const map = {
      high:   'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      medium: 'bg-amber-500/15  text-amber-300  border-amber-400/30',
      low:    'bg-rose-500/15   text-rose-300   border-rose-400/30',
    };
    return `inline-block px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider border ${map[label] || map.low}`;
  };

  return (
    <div className="max-w-[1280px] mx-auto p-8 flex flex-col gap-8 text-slate-100">
      <header className="flex justify-between items-start gap-6 p-6 rounded-2xl border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(36,40,58,0.85), rgba(20,22,32,0.85))' }}>
        <div>
          <h1 className="text-3xl font-bold qc-title-gradient">AI Price Predictions</h1>
          <p className="mt-2 max-w-2xl text-slate-300 leading-relaxed">
            LSTM/XGBoost next-hour OHLC forecast paired with Claude-generated
            trade rationale. Plug in your Binance keys to enable AI Auto-Trade.
          </p>
        </div>
        <div className={`${pillBase} ${toneCls}`}>
          <span className={dotCls} />
          {statusPill.label}
        </div>
      </header>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {SYMBOLS.map((s) => (
          <button
            key={s.symbol}
            type="button"
            className={`flex flex-col items-center gap-1 p-4 rounded-2xl border border-white/10 cursor-pointer transition
              ${selected === s.symbol
                ? 'bg-gradient-to-br from-cyan-300/15 to-purple-400/15 border-cyan-300/50 ring-1 ring-cyan-300/30'
                : 'bg-white/5 hover:bg-white/[0.07] hover:-translate-y-0.5'}`}
            onClick={() => setSelected(s.symbol)}
          >
            <span className="text-lg font-bold tracking-wide">{s.symbol}</span>
            <span className="text-sm text-slate-400">{s.name}</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
        <article className="qc-card">
          <header className="flex justify-between items-start gap-4 mb-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Next-Hour Forecast</h3>
              <p className="text-sm text-slate-400 mt-1">Powered by the active backend (XGB / LSTM / ensemble)</p>
            </div>
            {prediction?.demo && (
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/40 text-xs uppercase tracking-wider">demo</span>
            )}
          </header>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.03] mb-5">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-xs">Spot</span>
              <span className="text-xl font-semibold">{usd(spot)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-xs">Bias</span>
              <span className={`text-xl font-semibold capitalize ${
                bias === 'bullish' ? 'text-emerald-400' :
                bias === 'bearish' ? 'text-rose-400' : 'text-slate-400'}`}>{bias || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-xs">Predicted Move</span>
              <span className={`text-xl font-semibold ${move >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pct(move)}</span>
            </div>
          </div>

          {loadingPrediction ? (
            <div className="grid grid-cols-4 gap-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-14 rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.1),rgba(255,255,255,0.04))] bg-[length:200%_100%] animate-shimmer" />
              ))}
            </div>
          ) : prediction ? (
            <div className="grid grid-cols-4 gap-2">
              {[
                ['Open',  prediction.prediction.open,  ''],
                ['High',  prediction.prediction.high,  'text-emerald-400'],
                ['Low',   prediction.prediction.low,   'text-rose-400'],
                ['Close', prediction.prediction.close, ''],
              ].map(([label, val, tone]) => (
                <div key={label} className="flex flex-col gap-1.5 px-3.5 py-3.5 rounded-lg bg-white/[0.03]">
                  <span className="text-slate-400 text-[0.7rem] uppercase tracking-wider">{label}</span>
                  <strong className={`text-base ${tone || 'text-slate-100'}`}>{usd(val)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No forecast yet.</p>
          )}

          <footer className="mt-5 flex justify-between items-center">
            <button
              type="button"
              className="qc-btn qc-btn-ghost"
              onClick={handleTrain}
              disabled={training || !serviceHealth?.predictor_available}
              title={!serviceHealth?.predictor_available ? 'Start the FastAPI service to train' : 'Train a fresh model for this symbol'}
            >
              {training ? 'Training…' : 'Train model'}
            </button>
            <span className="text-slate-400 text-xs">model: {prediction?.model_version || '—'}</span>
          </footer>
        </article>

        <article className="qc-card">
          <header className="flex justify-between items-start gap-4 mb-5">
            <div>
              <h3 className="text-lg font-semibold">AI Rationale</h3>
              <p className="text-sm text-slate-400 mt-1">Claude-generated trade narrative + risk factors</p>
            </div>
            {rationale && (
              <span className={confidenceBadge(rationale.confidence_label)}>
                {rationale.confidence_label} confidence
              </span>
            )}
          </header>

          {loadingRationale ? (
            <div className="flex flex-col gap-2">
              {[0,1,2].map(i => (
                <div key={i} className={`h-3.5 rounded ${i===1 ? 'w-3/4' : ''} bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.1),rgba(255,255,255,0.04))] bg-[length:200%_100%] animate-shimmer`} />
              ))}
            </div>
          ) : rationale ? (
            <>
              <p className="text-base leading-relaxed text-slate-200 mb-5">{rationale.rationale}</p>
              {rationale.risk_factors?.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Risks to monitor</h4>
                  <ul className="list-disc list-outside ml-5 marker:text-rose-400 text-slate-300 space-y-1">
                    {rationale.risk_factors.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-400">No rationale yet.</p>
          )}
        </article>
      </section>

      <section className="qc-card">
        <header className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold">AI Auto-Trade</h3>
            <p className="text-sm text-slate-400 mt-1">
              {synced
                ? 'Configured here, executed by the server-side engine in dry-run mode every 5 min.'
                : 'Configured here, persisted to your browser. Sign in for server-side execution.'}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider border ${
              synced
                ? 'bg-emerald-500/12 text-emerald-300 border-emerald-400/35'
                : 'bg-slate-500/12 text-slate-400 border-slate-400/35'}`}>
              {synced ? (saving ? 'Syncing…' : 'Synced · server engine') : 'Local-only · sign in to sync'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/25 rounded-full text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              autoTrade.killSwitchTriggered ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]' :
              autoTrade.enabled ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse-dot' : 'bg-slate-500'
            }`} />
            <span>
              {autoTrade.killSwitchTriggered ? 'KILL SWITCH' : autoTrade.enabled ? `Active · ${autoTrade.mode}` : 'Disabled'}
            </span>
          </div>
        </header>

        <div className="flex items-center gap-4 flex-wrap mb-5">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="hidden"
              checked={autoTrade.enabled}
              disabled={autoTrade.killSwitchTriggered}
              onChange={(e) => updateAutoTrade({ enabled: e.target.checked })}
            />
            <span className={`relative w-11 h-6 rounded-full transition ${
              autoTrade.enabled ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-slate-600'
            } ${autoTrade.killSwitchTriggered ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full transition ${
                autoTrade.enabled ? 'translate-x-[18px]' : ''
              }`} />
            </span>
            <span className="text-sm">{autoTrade.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>

          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10">
            <button
              type="button"
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                autoTrade.mode === 'dry-run' ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300'
              }`}
              onClick={() => handleModeClick('dry-run')}
            >
              Dry-run
            </button>
            <button
              type="button"
              className={`px-3.5 py-1.5 rounded-md text-sm font-bold transition ${
                autoTrade.mode === 'live'
                  ? 'bg-gradient-to-br from-rose-400/25 to-purple-400/25 text-rose-400'
                  : 'text-slate-300'
              } ${!synced ? 'opacity-40 cursor-not-allowed' : ''}`}
              onClick={() => handleModeClick('live')}
              disabled={!synced}
              title={synced ? 'Switch to live trading' : 'Sign in to enable live'}
            >
              Live
            </button>
          </div>

          <button
            type="button"
            className="qc-btn qc-btn-danger"
            onClick={autoTrade.killSwitchTriggered ? clearKillSwitch : triggerKillSwitch}
          >
            {autoTrade.killSwitchTriggered ? 'Reset kill switch' : 'Engage kill switch'}
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-5">
          {[
            { label: 'Max position (USD)', key: 'maxPositionUsd', step: 50, min: 0 },
            { label: 'Daily loss limit (USD)', key: 'dailyLossLimitUsd', step: 10, min: 0 },
            { label: 'Stop loss (%)', key: 'stopLossPct', step: 0.1, min: 0.1 },
            { label: 'Take profit (%)', key: 'takeProfitPct', step: 0.1, min: 0.1 },
          ].map(({ label, key, step, min }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="qc-label-up">{label}</span>
              <input
                type="number"
                className="qc-input"
                min={min}
                step={step}
                value={autoTrade[key]}
                onChange={(e) => updateAutoTrade({ [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1.5">
            <span className="qc-label-up">Min AI confidence</span>
            <select
              className="qc-input"
              value={autoTrade.minConfidence}
              onChange={(e) => updateAutoTrade({ minConfidence: e.target.value })}
            >
              <option value="low">low (aggressive)</option>
              <option value="medium">medium</option>
              <option value="high">high (conservative)</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <span className="qc-label-up">Allowed symbols</span>
          <div className="flex gap-2 flex-wrap">
            {SYMBOLS.map((s) => {
              const on = autoTrade.allowedSymbols.includes(s.symbol);
              return (
                <button
                  key={s.symbol}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
                    on
                      ? 'bg-cyan-300/20 text-cyan-300 border-cyan-300/50'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/[0.07]'
                  }`}
                  onClick={() => toggleAllowedSymbol(s.symbol)}
                >
                  {s.symbol}
                </button>
              );
            })}
          </div>
        </div>

        <p className="m-0 px-4 py-3.5 rounded-lg bg-amber-500/8 border border-amber-400/25 text-amber-300 text-sm">
          {autoTrade.mode === 'live' ? (
            <>🔴 <strong>Live mode is active</strong>. The engine will place real Binance orders. Disable any time with the kill switch.</>
          ) : (
            <>
              ⚠️ Currently in <strong>dry-run</strong>. Decisions are logged but no orders are placed.{' '}
              <Link to="/settings/api-keys" className="text-cyan-300 hover:underline font-semibold">Add your Binance keys</Link>{' '}
              and re-acknowledge to enable live trading.
            </>
          )}
        </p>
      </section>

      <section>
        <h3 className="text-center text-xl text-slate-300 mb-4">How it works</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {[
            ['📈', '1. Numeric forecast', 'XGBoost (default) or LSTM trained on 360 days of 1h candles predicts the next hour\'s OHLC.'],
            ['🧠', '2. Claude rationale',  'Claude consumes the forecast plus 5 recent headlines and returns a hedged, plain-English rationale with risk factors.'],
            ['🛡️', '3. Safety-first execution', 'Stop-loss, take-profit, daily-loss limit, and a one-click kill switch — all enforced server-side before any order is routed.'],
          ].map(([icon, title, body]) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(110,231,255,0.12)]">
              <div className="text-3xl mb-2">{icon}</div>
              <h4 className="text-base text-cyan-300 mb-2">{title}</h4>
              <p className="text-slate-300 leading-relaxed text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <AckLiveModal
        open={ackOpen}
        onClose={() => !ackBusy && setAckOpen(false)}
        onSubmit={handleAckSubmit}
        config={autoTrade}
        busy={ackBusy}
      />
    </div>
  );
};

export default Predictions;
