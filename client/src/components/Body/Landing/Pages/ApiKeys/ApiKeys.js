import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '../../../../../context/AuthContext';
import apiKeysService from '../../../../../services/apiKeysService';

const STATUS_TONES = {
  ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35',
  invalid_key: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
  network_error: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
  decrypt_failed: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
};

const ApiKeys = () => {
  const { isAuthed } = useAuth();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState(null);
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (!isAuthed) { setLoading(false); return; }
    apiKeysService.getBinance()
      .then((data) => setKeys(data || { hasKeys: false }))
      .catch((err) => toast.error(`Failed to load keys: ${err.message}`))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  if (!isAuthed) return <Navigate to="/login" />;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) { toast.error('Both fields are required'); return; }
    setSaving(true);
    try {
      const data = await apiKeysService.setBinance(apiKey, apiSecret);
      setKeys(data); setEditing(false); setApiKey(''); setApiSecret(''); setShowSecret(false);
      toast.success('Binance keys saved (encrypted at rest).');
    } catch (err) { toast.error(`Save failed: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const data = await apiKeysService.testBinance();
      setKeys(data);
      toast.success(`OK — canTrade=${data.canTrade}, ${data.balanceCount} balances`);
    } catch (err) {
      if (err.snapshot) setKeys(err.snapshot);
      toast.error(`Test failed: ${err.message}`);
    } finally { setTesting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your Binance API keys from the vault?')) return;
    try {
      const data = await apiKeysService.deleteBinance();
      setKeys(data);
      toast.info('Binance keys removed.');
    } catch (err) { toast.error(`Delete failed: ${err.message}`); }
  };

  const statusPill = keys?.hasKeys ? (
    <span className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider border ${
      STATUS_TONES[keys.lastTestStatus] || 'bg-slate-500/12 text-slate-400 border-slate-400/35'
    }`}>
      {keys.lastTestStatus ? keys.lastTestStatus.replace('_', ' ') : 'untested'}
    </span>
  ) : null;

  return (
    <div className="max-w-[880px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold qc-title-gradient">Exchange API Keys</h1>
          <p className="mt-2 max-w-2xl text-slate-300 leading-relaxed">
            Keys are encrypted at rest with AES-256-GCM and only decrypted in memory when the
            auto-trade engine needs to place an order. They are never returned to the browser.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          <Link to="/settings/reconcile" className="text-cyan-300 hover:underline text-sm whitespace-nowrap">Reconcile trades →</Link>
          <Link to="/predictions" className="text-cyan-300 hover:underline text-sm whitespace-nowrap">← Back to predictions</Link>
        </div>
      </header>

      <article className="qc-card">
        <header className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">Binance</h3>
            <p className="text-sm text-slate-400 mt-1">
              Generate a key on Binance with <strong className="text-slate-200">Spot trading</strong> only.
              Disable withdrawals. IP-restrict to this server&apos;s address.
            </p>
          </div>
          {statusPill}
        </header>

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : keys?.hasKeys && !editing ? (
          <>
            <dl className="grid grid-cols-[minmax(140px,max-content)_1fr] gap-x-6 gap-y-2 mb-6">
              <dt className="text-slate-400 text-sm">API key</dt>
              <dd className="m-0 font-mono">{keys.apiKeyMask}</dd>
              <dt className="text-slate-400 text-sm">Last tested</dt>
              <dd className="m-0">{keys.testedAt ? new Date(keys.testedAt).toLocaleString() : '—'}</dd>
              {keys.lastTestMessage && (<>
                <dt className="text-slate-400 text-sm">Last result</dt>
                <dd className="m-0 text-slate-400 text-sm">{keys.lastTestMessage}</dd>
              </>)}
            </dl>

            <div className="flex flex-wrap gap-3 mb-6">
              <button type="button" className="qc-btn qc-btn-primary" onClick={handleTest} disabled={testing}>
                {testing ? 'Testing…' : 'Test connection'}
              </button>
              <button type="button" className="qc-btn qc-btn-ghost" onClick={() => setEditing(true)}>Replace keys</button>
              <button type="button" className="qc-btn qc-btn-danger" onClick={handleDelete}>Delete keys</button>
            </div>
          </>
        ) : (
          <form className="flex flex-col gap-4 mb-6" onSubmit={handleSave}>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">API key</span>
              <input
                type="text" autoComplete="off" spellCheck={false} required
                className="qc-input font-mono"
                placeholder="Paste your Binance API key"
                value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">API secret</span>
              <div className="flex gap-2">
                <input
                  type={showSecret ? 'text' : 'password'}
                  autoComplete="off" spellCheck={false} required
                  className="qc-input font-mono flex-1"
                  placeholder="Paste your Binance API secret"
                  value={apiSecret} onChange={(e) => setApiSecret(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/[0.08]"
                  onClick={() => setShowSecret((v) => !v)}
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="qc-btn qc-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save (encrypted)'}
              </button>
              {keys?.hasKeys && (
                <button
                  type="button"
                  className="qc-btn qc-btn-ghost"
                  onClick={() => { setEditing(false); setApiKey(''); setApiSecret(''); }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        <div className="bg-amber-500/8 border border-amber-400/25 rounded-xl px-5 py-4">
          <h4 className="text-xs uppercase tracking-wider text-amber-300 mb-2 font-semibold">Security checklist</h4>
          <ul className="list-disc list-inside m-0 text-slate-300 text-sm space-y-1.5">
            <li><strong className="text-amber-300">Withdrawals OFF</strong> — never enable withdrawal permissions on the API key.</li>
            <li><strong className="text-amber-300">IP whitelist</strong> — restrict the key to this server&apos;s IP if possible.</li>
            <li><strong className="text-amber-300">Spot only</strong> — leave futures and margin disabled.</li>
            <li><strong className="text-amber-300">Rotate periodically</strong> — replace keys every 90 days.</li>
          </ul>
        </div>
      </article>
    </div>
  );
};

export default ApiKeys;
