import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '../../../../../context/AuthContext';
import twoFactorService from '../../../../../services/twoFactorService';

const TwoFactor = () => {
  const { isAuthed } = useAuth();
  const [enabled, setEnabled] = useState(null);
  const [provisioning, setProvisioning] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('idle');
  const [backupCodes, setBackupCodes] = useState(null);
  const [backupCount, setBackupCount] = useState(0);

  useEffect(() => {
    if (!isAuthed) return;
    twoFactorService.status()
      .then((d) => {
        setEnabled(Boolean(d?.enabled));
        setBackupCount(Number(d?.backupCodesRemaining || 0));
      })
      .catch((e) => toast.error(`Failed to load 2FA status: ${e.message}`));
  }, [isAuthed]);

  if (!isAuthed) return <Navigate to="/login" />;

  const startEnroll = async () => {
    setBusy(true);
    try {
      const data = await twoFactorService.setup();
      setProvisioning(data); setMode('enrolling'); setCode('');
    } catch (e) { toast.error(`Setup failed: ${e.message}`); }
    finally { setBusy(false); }
  };

  const confirmEnroll = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const data = await twoFactorService.enable(code);
      setEnabled(Boolean(data?.enabled)); setProvisioning(null); setCode('');
      if (Array.isArray(data?.backupCodes)) {
        setBackupCodes(data.backupCodes);
        setBackupCount(data.backupCodes.length);
        setMode('showing-backup');
      } else setMode('idle');
      toast.success('2FA enabled.');
    } catch (e) { toast.error(`Activation failed: ${e.message}`); }
    finally { setBusy(false); }
  };

  const confirmDisable = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const data = await twoFactorService.disable(password, code);
      setEnabled(Boolean(data?.enabled)); setBackupCount(0);
      setMode('idle'); setPassword(''); setCode('');
      toast.info('2FA disabled.');
    } catch (e) { toast.error(`Disable failed: ${e.message}`); }
    finally { setBusy(false); }
  };

  const confirmRegenerate = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const data = await twoFactorService.regenerateBackupCodes(password);
      setBackupCodes(data.backupCodes); setBackupCount(data.backupCodes.length);
      setMode('showing-backup'); setPassword('');
      toast.success('New backup codes generated.');
    } catch (e) { toast.error(`Regenerate failed: ${e.message}`); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-[720px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header>
        <h1 className="text-3xl font-bold qc-title-gradient">Two-Factor Authentication</h1>
        <p className="mt-2 max-w-2xl text-slate-300 leading-relaxed">
          TOTP via any authenticator app (Authy, Google Authenticator, 1Password).
          Required on login when enabled, and recommended before turning on live trading.
        </p>
      </header>

      <article className="qc-card">
        <header className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold">Status</h3>
            <p className="text-sm text-slate-400 mt-1">
              {enabled === null ? 'Loading…' : enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-[0.75rem] font-semibold uppercase tracking-wider border ${
            enabled
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
              : 'bg-slate-500/12 text-slate-400 border-slate-400/35'
          }`}>
            {enabled ? '2FA on' : '2FA off'}
          </span>
        </header>

        {mode === 'idle' && enabled === false && (
          <button type="button" className="qc-btn qc-btn-primary" onClick={startEnroll} disabled={busy}>
            {busy ? 'Provisioning…' : 'Set up 2FA'}
          </button>
        )}

        {mode === 'enrolling' && provisioning && (
          <form onSubmit={confirmEnroll} className="flex flex-col gap-4">
            <p className="text-slate-200">1. Scan this QR code with your authenticator app.</p>
            <div className="flex justify-center bg-white p-4 rounded-xl">
              <QRCodeSVG value={provisioning.otpauthUrl} size={196} />
            </div>
            <p className="text-slate-400 text-sm">
              Can&apos;t scan? Add manually with:{' '}
              <code className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-cyan-300 text-sm">{provisioning.secret}</code>
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">2. Enter the 6-digit code from the app</span>
              <input
                className="qc-input"
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value)}
                autoFocus required
              />
            </label>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="qc-btn qc-btn-ghost"
                onClick={() => { setMode('idle'); setProvisioning(null); setCode(''); }}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="qc-btn qc-btn-primary" disabled={busy || !code}>
                {busy ? 'Activating…' : 'Activate 2FA'}
              </button>
            </div>
          </form>
        )}

        {mode === 'idle' && enabled === true && (
          <>
            <p className="text-slate-400 text-sm mb-3">
              Backup codes remaining: <strong className="text-slate-200">{backupCount}</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" className="qc-btn qc-btn-ghost" onClick={() => setMode('regenerating')} disabled={busy}>
                Regenerate backup codes
              </button>
              <button type="button" className="qc-btn qc-btn-danger" onClick={() => setMode('disabling')} disabled={busy}>
                Disable 2FA
              </button>
            </div>
          </>
        )}

        {mode === 'showing-backup' && backupCodes && (
          <div className="bg-cyan-300/6 border border-cyan-300/25 rounded-xl px-5 py-5">
            <h4 className="text-cyan-300 mb-2 font-semibold">Save these backup codes</h4>
            <p className="text-slate-400 leading-relaxed text-sm">
              Each code works exactly once. Treat them like passwords — store them
              somewhere safe (password manager, printed copy). You won&apos;t see them
              again after closing this view.
            </p>
            <ul className="list-none p-0 my-4 grid grid-cols-2 gap-2">
              {backupCodes.map((c) => (
                <li key={c}>
                  <code className="block bg-black/30 border border-white/10 rounded-lg px-3 py-2 font-mono text-base text-center tracking-wider text-slate-100">{c}</code>
                </li>
              ))}
            </ul>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="qc-btn qc-btn-ghost"
                onClick={() => { navigator.clipboard?.writeText(backupCodes.join('\n')); toast.info('Copied to clipboard.'); }}
              >
                Copy all
              </button>
              <button
                type="button"
                className="qc-btn qc-btn-primary"
                onClick={() => { setBackupCodes(null); setMode('idle'); }}
              >
                I&apos;ve saved them
              </button>
            </div>
          </div>
        )}

        {mode === 'regenerating' && (
          <form onSubmit={confirmRegenerate} className="flex flex-col gap-4">
            <p className="text-slate-200">Re-enter your password to generate a fresh set of backup codes.</p>
            <p className="text-slate-400 text-sm">⚠️ Any previously-unused codes will stop working.</p>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Password</span>
              <input
                className="qc-input" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="flex gap-3 justify-end">
              <button type="button" className="qc-btn qc-btn-ghost"
                onClick={() => { setMode('idle'); setPassword(''); }} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="qc-btn qc-btn-primary" disabled={busy || !password}>
                {busy ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </form>
        )}

        {mode === 'disabling' && (
          <form onSubmit={confirmDisable} className="flex flex-col gap-4">
            <p className="text-slate-200">Re-enter your password and a current authenticator code (or a backup code) to disable.</p>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Password</span>
              <input
                className="qc-input" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">TOTP or backup code</span>
              <input
                className="qc-input" type="text" maxLength={12}
                placeholder="123456 or ABCD-EF12" required
                value={code} onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <div className="flex gap-3 justify-end">
              <button type="button" className="qc-btn qc-btn-ghost"
                onClick={() => { setMode('idle'); setPassword(''); setCode(''); }} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="qc-btn qc-btn-danger" disabled={busy || !code || !password}>
                {busy ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </div>
          </form>
        )}
      </article>
    </div>
  );
};

export default TwoFactor;
