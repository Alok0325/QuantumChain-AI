import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const ERROR_HELP = {
  LIVE_DISABLED_BY_SERVER:
    'The server operator has not enabled live trading. Ask them to set ALLOW_LIVE_TRADING=true.',
  API_KEYS_MISSING: (
    <>
      You haven&apos;t saved Binance API keys yet.{' '}
      <Link to="/settings/api-keys" className="text-cyan-300 hover:underline">Add them here →</Link>
    </>
  ),
  API_KEYS_UNTESTED: (
    <>
      Your saved keys haven&apos;t passed the test step.{' '}
      <Link to="/settings/api-keys" className="text-cyan-300 hover:underline">Open the vault and click Test →</Link>
    </>
  ),
  LIVE_ACK_REQUIRED: 'Re-enter your password to acknowledge live trading.',
};

const AckLiveModal = ({ open, onClose, onSubmit, config, busy }) => {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setErr(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    try { await onSubmit(password); }
    catch (ex) {
      const code = ex?.code;
      const help = code && ERROR_HELP[code];
      setErr(help || ex.message || 'Failed');
    }
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]"
      role="dialog" aria-modal="true" onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 p-7 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{ background: 'linear-gradient(180deg, rgba(36,40,58,0.95), rgba(20,22,32,0.95))' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-3 text-xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #fb7185, #b884ff)' }}>
          Acknowledge live trading
        </h2>

        <p className="m-0 mb-5 px-4 py-3.5 rounded-xl bg-rose-500/8 border border-rose-400/30 text-slate-200 text-sm leading-relaxed">
          Live mode places <strong className="text-rose-400">real Binance orders</strong> with your funds.
          The engine will use your saved API keys, decrypted in memory, to market-buy and
          bracket positions with OCO stop-loss / take-profit orders.
        </p>

        <dl className="m-0 mb-5 grid grid-cols-2 gap-x-4 gap-y-2 bg-white/[0.03] rounded-xl px-4 py-3.5 text-sm">
          <div className="contents">
            <dt className="qc-label-up">Max position</dt>
            <dd className="m-0">${Number(config.maxPositionUsd).toFixed(2)}</dd>
          </div>
          <div className="contents">
            <dt className="qc-label-up">Daily loss limit</dt>
            <dd className="m-0">${Number(config.dailyLossLimitUsd).toFixed(2)}</dd>
          </div>
          <div className="contents">
            <dt className="qc-label-up">Stop-loss / Take-profit</dt>
            <dd className="m-0">{Number(config.stopLossPct).toFixed(2)}% / {Number(config.takeProfitPct).toFixed(2)}%</dd>
          </div>
          <div className="contents">
            <dt className="qc-label-up">Min confidence</dt>
            <dd className="m-0">{config.minConfidence}</dd>
          </div>
          <div className="contents">
            <dt className="qc-label-up">Symbols</dt>
            <dd className="m-0">{config.allowedSymbols?.join(', ') || '—'}</dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 mb-4">
            <span className="qc-label-up">Re-enter your password</span>
            <input
              ref={inputRef}
              className="qc-input focus:border-rose-400 focus:ring-rose-400/20"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {err && (
            <div className="bg-rose-500/12 border border-rose-400/35 text-rose-300 px-3.5 py-2.5 rounded-lg text-sm mb-4 leading-relaxed">
              {err}
            </div>
          )}

          <div className="flex gap-3 justify-end mb-4">
            <button type="button" className="qc-btn qc-btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="qc-btn qc-btn-primary" disabled={busy || !password}>
              {busy ? 'Acknowledging…' : 'Enable live trading'}
            </button>
          </div>

          <p className="m-0 text-slate-400 text-xs leading-relaxed">
            The acknowledgement expires after a configurable TTL (default 24h).
            You can always engage the kill switch with one click.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AckLiveModal;
