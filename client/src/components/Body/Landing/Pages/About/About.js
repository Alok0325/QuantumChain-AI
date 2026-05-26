import React, { useState } from 'react';

const FEATURES = [
  { icon: '⚛️',  title: 'Quantum-Powered Trading', body: 'Quantum-inspired and ensemble ML algorithms analyze market patterns and execute trades with low latency.' },
  { icon: '🤖',  title: 'AI Predictions',          body: 'XGBoost / LSTM forecasts paired with Claude-generated trade rationale, refreshed continuously.' },
  { icon: '🔒',  title: 'Encrypted Vault',         body: 'Per-user Binance API keys encrypted at rest with AES-256-GCM. Never returned to the browser.' },
  { icon: '📊',  title: 'Real-time Analytics',     body: 'Live trade reconciliation, position rollup, model accuracy, and webhook event delivery.' },
];

const TECH = [
  { title: 'Forecasting',  body: 'XGBoost on 13 engineered TA features by default, with an optional LSTM extra. Walk-forward retraining every 24 h.' },
  { title: 'AI rationale', body: 'Claude (Anthropic) blends the numeric forecast, Binance taker buy/sell flow, and recent headlines into a hedged 2-3 sentence rationale with explicit risk factors.' },
  { title: 'Safety',       body: 'Server-enforced hard limits, dry-run by default, four independent gates before any live order, per-user circuit breakers, kill-switch + daily loss limit.' },
];

const TEAM = [
  { name: 'Alok Prajapati',          role: 'Team Leader',           bio: 'Full-stack and AI specialist. Leads platform architecture and the auto-trade engine.', image: '/images/team/Alok.jpeg' },
  { name: 'Saurabh Shukla',          role: 'Database Specialist',   bio: 'Database architecture and distributed systems. Owns the ledger + reconciliation pipeline.',  image: '/images/team/Saurabh.jpeg' },
  { name: 'Abhishek Kumar',          role: 'Frontend Developer',    bio: 'Frontend and design systems. Migrated the platform UI to Tailwind.',                       image: '/images/team/Abhi.jpeg' },
  { name: 'Abhishek Kumar Maurya',   role: 'UI/UX Developer',       bio: 'Interaction design and accessibility.',                                                    image: '/images/team/Maurya.jpeg' },
];

const POSITIONS = [
  ['', 'Select a position'],
  ['frontend', 'Frontend Developer'],
  ['backend', 'Backend Developer'],
  ['fullstack', 'Full Stack Developer'],
  ['ui-ux', 'UI/UX Designer'],
  ['blockchain', 'Blockchain / ML Engineer'],
];

const CareerFormModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', position: '', experience: '', resume: null, coverLetter: '',
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };
  const handleSubmit = (e) => { e.preventDefault(); console.log('Form submitted:', formData); onClose(); };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={onClose}
      role="dialog" aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-white/10 p-7 max-h-[90vh] overflow-y-auto text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{ background: 'linear-gradient(180deg, rgba(36,40,58,0.95), rgba(20,22,32,0.95))' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-5 qc-title-gradient">Join Our Team</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { id: 'name',  label: 'Full Name', type: 'text',   required: true },
            { id: 'email', label: 'Email',     type: 'email',  required: true },
          ].map((f) => (
            <label key={f.id} className="flex flex-col gap-1.5">
              <span className="qc-label-up">{f.label}</span>
              <input
                id={f.id} name={f.id} type={f.type} required={f.required}
                className="qc-input" value={formData[f.id]} onChange={handleChange}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1.5">
            <span className="qc-label-up">Desired Position</span>
            <select
              id="position" name="position" required
              className="qc-input" value={formData.position} onChange={handleChange}
            >
              {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="qc-label-up">Years of Experience</span>
            <input
              id="experience" name="experience" type="number" min="0" max="50" required
              className="qc-input" value={formData.experience} onChange={handleChange}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="qc-label-up">Resume (PDF)</span>
            <input
              id="resume" name="resume" type="file" accept=".pdf" required
              className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-cyan-300/15 file:text-cyan-300 file:font-medium file:cursor-pointer"
              onChange={handleChange}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="qc-label-up">Cover Letter</span>
            <textarea
              id="coverLetter" name="coverLetter" rows="4" required
              className="qc-input resize-y" value={formData.coverLetter} onChange={handleChange}
            />
          </label>
          <button type="submit" className="qc-btn qc-btn-primary self-stretch mt-2">Submit Application</button>
        </form>
      </div>
    </div>
  );
};

const Section = ({ title, children, intro }) => (
  <section className="max-w-[1200px] mx-auto px-6 py-12">
    <h2 className="text-3xl font-bold text-center mb-3">{title}</h2>
    {intro && <p className="text-center text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">{intro}</p>}
    {children}
  </section>
);

const About = () => {
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);

  return (
    <div className="text-slate-100">
      <section className="relative overflow-hidden pt-32 pb-12 px-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(110,231,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184,132,255,0.12) 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-[1100px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight m-0 mb-4 qc-title-gradient">
            Revolutionizing Crypto Trading with AI
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            QuantumChain AI combines machine-learning forecasts with LLM-generated
            rationale and safety-first execution to give traders a transparent,
            auditable edge.
          </p>
        </div>
      </section>

      <Section title="Our Mission">
        <p className="max-w-3xl mx-auto text-center text-slate-300 leading-relaxed">
          We believe AI-assisted trading should be transparent, opt-in, and
          safety-bounded by default. Every decision the engine takes is logged
          to a per-user trade ledger, reconcilable against the exchange,
          accompanied by a hedged Claude rationale, and gated by limits the
          user — not the platform — owns.
        </p>
      </Section>

      <Section title="Key Features">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="qc-card text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="m-0 mb-2 text-base font-semibold text-cyan-300">{f.title}</h3>
              <p className="m-0 text-sm text-slate-300 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Our Technology">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TECH.map((t) => (
            <div key={t.title} className="qc-card">
              <h3 className="m-0 mb-2 text-base font-semibold text-cyan-300">{t.title}</h3>
              <p className="m-0 text-sm text-slate-300 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Meet Our Team"
        intro="The team behind the architecture, ledger pipeline, frontend, and design."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m) => (
            <div key={m.name} className="qc-card text-center flex flex-col">
              <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-2 border-cyan-300/40 shadow-[0_0_15px_rgba(110,231,255,0.2)]">
                <img
                  src={m.image}
                  alt={m.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6ee7ff&color=0b1018&size=96`;
                  }}
                />
              </div>
              <h3 className="m-0 mb-1 text-base font-semibold">{m.name}</h3>
              <span className="text-cyan-300 text-xs font-medium uppercase tracking-wider mb-2">{m.role}</span>
              <p className="m-0 text-sm text-slate-400 leading-relaxed flex-1">{m.bio}</p>
              <div className="flex gap-3 justify-center mt-4 pt-3 border-t border-white/[0.06] text-slate-500 text-sm">
                <span title="GitHub">GitHub</span>
                <span className="text-slate-600">·</span>
                <span title="LinkedIn">LinkedIn</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Join the Revolution">
        <div
          className="qc-card text-center px-8 py-12 max-w-3xl mx-auto"
          style={{ background: 'linear-gradient(135deg, rgba(110,231,255,0.12), rgba(184,132,255,0.12))' }}
        >
          <p className="text-slate-300 m-0 mb-6 leading-relaxed">
            Hiring across full-stack, ML, and design. If you want to build
            transparent, audit-friendly AI trading infrastructure, apply below.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button type="button" className="qc-btn qc-btn-primary" onClick={() => setIsCareerModalOpen(true)}>
              Apply
            </button>
            <a href="/predictions" className="qc-btn qc-btn-ghost">
              See the platform
            </a>
          </div>
        </div>
      </Section>

      <CareerFormModal isOpen={isCareerModalOpen} onClose={() => setIsCareerModalOpen(false)} />
    </div>
  );
};

export default About;
