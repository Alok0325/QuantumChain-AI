import React from 'react';
import { Link } from 'react-router-dom';

const HERO_FEATURES = [
  { icon: '⚡',   title: 'Quantum Speed',  body: 'Lightning-fast trading execution and ML inference.' },
  { icon: '🧠',  title: 'AI Predictions', body: 'XGBoost or LSTM next-hour OHLC with Claude-generated rationale.' },
  { icon: '🛡️', title: 'Safety-first',   body: 'Encrypted API key vault, kill switch, daily-loss limit, dry-run mode.' },
];

const MARKET = [
  { pair: 'BTC/USDT', price: '$45,234.56', change: '+2.5%',  positive: true },
  { pair: 'ETH/USDT', price: '$3,245.67',  change: '+1.8%',  positive: true },
  { pair: 'SOL/USDT', price: '$123.45',    change: '-0.5%',  positive: false },
];

const WHY = [
  { icon: '⚡', title: 'High-Speed Trading',   body: 'Execute trades at quantum speeds with our advanced infrastructure.' },
  { icon: '🧠', title: 'Smart Analysis',       body: 'AI-powered market analysis and real-time trading signals.' },
  { icon: '🛡️', title: 'Enhanced Security',   body: 'Encryption-at-rest for keys, two-factor login, rate-limited auth.' },
  { icon: '📈', title: 'Advanced Charts',      body: 'Professional-grade charts and technical analysis tools.' },
];

const STATS = [
  { value: '$10B+',   label: 'Trading Volume' },
  { value: '100K+',   label: 'Active Traders' },
  { value: '50+',     label: 'Trading Pairs' },
  { value: '99.9%',   label: 'Uptime' },
];

const TOOLS = [
  { icon: '📊', title: 'Advanced Charts', body: 'Multiple timeframes, indicators, and drawing tools.', to: '/trade',  cta: 'Open trade' },
  { icon: '🤖', title: 'AI Auto-Trade',   body: 'Dry-run by default. Stop-loss, take-profit, kill switch.', to: '/predictions', cta: 'Configure' },
  { icon: '🔐', title: 'Encrypted Vault', body: 'Per-user Binance keys, AES-256-GCM at rest.',          to: '/settings/api-keys', cta: 'Add keys' },
];

const Home = () => {
  return (
    <div className="text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 px-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(110,231,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184,132,255,0.12) 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] m-0 mb-4">
              <span className="qc-title-gradient">QuantumChain</span>{' '}
              <span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
              The future of AI-powered cryptocurrency trading. Plug in your
              Binance keys, set safety bounds, and let our XGBoost + Claude
              stack run dry-run (or live) with one click.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                to="/register"
                className="px-6 py-3 rounded-lg font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #6ee7ff 0%, #b884ff 100%)' }}
              >
                Get started
              </Link>
              <Link
                to="/predictions"
                className="px-6 py-3 rounded-lg font-semibold text-slate-100 border border-white/15 bg-white/5 transition hover:bg-white/10"
              >
                See predictions
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {HERO_FEATURES.map((f) => (
              <div key={f.title} className="qc-card flex items-start gap-4">
                <div className="text-3xl shrink-0">{f.icon}</div>
                <div>
                  <h3 className="m-0 mb-1 text-base font-semibold text-cyan-300">{f.title}</h3>
                  <p className="m-0 text-sm text-slate-300 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market preview */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-bold mb-6">Live Market Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKET.map((m) => (
            <div key={m.pair} className="qc-card">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-200">{m.pair}</span>
                <span className={`text-sm font-semibold ${m.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-100 mb-1">{m.price}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Indicative · 24h</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-bold mb-6">Why QuantumChain AI</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((w) => (
            <div key={w.title} className="qc-card text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2">{w.icon}</div>
              <h3 className="m-0 mb-2 text-base font-semibold text-cyan-300">{w.title}</h3>
              <p className="m-0 text-sm text-slate-300 leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="qc-card text-center">
              <h3 className="m-0 mb-1 text-3xl font-extrabold qc-title-gradient">{s.value}</h3>
              <p className="m-0 text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-bold mb-6">Professional Trading Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOLS.map((t) => (
            <div key={t.title} className="qc-card flex flex-col">
              <div className="text-3xl mb-2">{t.icon}</div>
              <h3 className="m-0 mb-2 text-base font-semibold text-cyan-300">{t.title}</h3>
              <p className="m-0 text-sm text-slate-300 leading-relaxed flex-1">{t.body}</p>
              <Link to={t.to} className="mt-4 text-cyan-300 font-semibold hover:underline self-start text-sm">
                {t.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div
          className="qc-card text-center px-8 py-12"
          style={{ background: 'linear-gradient(135deg, rgba(110,231,255,0.12), rgba(184,132,255,0.12))' }}
        >
          <h2 className="text-3xl font-bold m-0 mb-3">Start Trading Today</h2>
          <p className="text-slate-300 m-0 mb-6 max-w-xl mx-auto">
            Join thousands of traders. Configure your safety bounds, plug in your
            keys, and let the engine work for you in dry-run before going live.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/register"
              className="px-6 py-3 rounded-lg font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6ee7ff 0%, #b884ff 100%)' }}
            >
              Create account
            </Link>
            <Link
              to="/about"
              className="px-6 py-3 rounded-lg font-semibold text-slate-100 border border-white/15 bg-white/5 transition hover:bg-white/10"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
