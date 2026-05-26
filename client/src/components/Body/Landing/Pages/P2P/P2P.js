import React, { useState, useEffect } from 'react';

const EXCHANGE_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.12, AUD: 1.52,
  CAD: 1.35, JPY: 149.50, CNY: 7.19, SGD: 1.34, AED: 3.67,
};

const CURRENCY_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', INR: 'Indian Rupee',
  AUD: 'Australian Dollar', CAD: 'Canadian Dollar', JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan', SGD: 'Singapore Dollar', AED: 'UAE Dirham',
};

const COINS = [
  { symbol: 'BTC',  name: 'Bitcoin' },
  { symbol: 'ETH',  name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'SOL',  name: 'Solana' },
  { symbol: 'BNB',  name: 'Binance Coin' },
  { symbol: 'XRP',  name: 'Ripple' },
  { symbol: 'ADA',  name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
];

const FIATS = Object.keys(EXCHANGE_RATES).map((s) => ({ symbol: s, name: CURRENCY_NAMES[s] }));

const MOCK_LISTINGS = [
  { id: 1, user: 'CryptoTrader123', rating: 4.9, completedTrades: 156,
    price: 65432.21, limits: { min: 100, max: 10000 },
    paymentMethods: ['Bank Transfer', 'PayPal', 'Wise'], available: 2.5 },
  { id: 2, user: 'QuantumTrader',  rating: 4.8, completedTrades: 89,
    price: 65450.00, limits: { min: 500, max: 5000 },
    paymentMethods: ['Bank Transfer', 'Wise'], available: 1.8 },
  { id: 3, user: 'CryptoMaster',   rating: 4.7, completedTrades: 234,
    price: 65400.00, limits: { min: 200, max: 20000 },
    paymentMethods: ['Bank Transfer', 'PayPal', 'Wise', 'Revolut'], available: 3.2 },
];

const TOP_TRADERS = [
  { id: 1, username: 'CryptoKing',     avatar: '👑', totalTrades: 1205, successRate: 99.8, volume: 15250000, monthlyTrades: 145, verifiedSince: '2021-05', specialization: ['BTC', 'ETH', 'USDT'], recentTrades: [{ type: 'buy', amount: '2.5 BTC', time: '2h ago' }, { type: 'sell', amount: '45 ETH', time: '5h ago' }, { type: 'buy', amount: '12000 USDT', time: '8h ago' }] },
  { id: 2, username: 'BlockchainPro',  avatar: '⭐', totalTrades: 856,  successRate: 99.5, volume: 8750000,  monthlyTrades: 98,  verifiedSince: '2022-01', specialization: ['BTC', 'SOL', 'BNB'],  recentTrades: [{ type: 'sell', amount: '1.8 BTC', time: '1h ago' }, { type: 'buy', amount: '150 SOL', time: '4h ago' }, { type: 'sell', amount: '25 BNB', time: '6h ago' }] },
  { id: 3, username: 'CryptoWhale',    avatar: '🐋', totalTrades: 2150, successRate: 99.9, volume: 25500000, monthlyTrades: 180, verifiedSince: '2020-12', specialization: ['BTC', 'ETH', 'SOL'],  recentTrades: [{ type: 'buy', amount: '5.2 BTC', time: '30m ago' }, { type: 'sell', amount: '180 ETH', time: '3h ago' }, { type: 'buy', amount: '1000 SOL', time: '7h ago' }] },
  { id: 4, username: 'P2PMaster',      avatar: '🌟', totalTrades: 1580, successRate: 99.7, volume: 12800000, monthlyTrades: 135, verifiedSince: '2021-08', specialization: ['ETH', 'BNB', 'ADA'],  recentTrades: [{ type: 'sell', amount: '75 ETH', time: '45m ago' }, { type: 'buy', amount: '120 BNB', time: '2h ago' }, { type: 'sell', amount: '5000 ADA', time: '5h ago' }] },
  { id: 5, username: 'TradeLegend',    avatar: '🏆', totalTrades: 1890, successRate: 99.6, volume: 18900000, monthlyTrades: 165, verifiedSince: '2021-03', specialization: ['BTC', 'DOGE', 'XRP'], recentTrades: [{ type: 'buy', amount: '3.1 BTC', time: '1h ago' }, { type: 'sell', amount: '100000 DOGE', time: '4h ago' }, { type: 'buy', amount: '15000 XRP', time: '9h ago' }] },
];

const TradeModal = ({ isOpen, onClose, listing, type, selectedCoin, selectedFiat }) => {
  const [step, setStep] = useState(1);
  const [tradeAmount, setTradeAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [status, setStatus] = useState('pending');
  const [timer, setTimer] = useState(900);
  const [tradeCurrency, setTradeCurrency] = useState(selectedFiat);
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    setExchangeRate(EXCHANGE_RATES[tradeCurrency] / EXCHANGE_RATES[selectedFiat]);
  }, [tradeCurrency, selectedFiat]);

  useEffect(() => {
    if (!isOpen || step !== 2) return undefined;
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, step]);

  const formatTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setStatus('completed');
    setTimeout(() => {
      onClose();
      setStep(1); setTradeAmount(''); setSelectedPayment(''); setStatus('pending'); setTimer(900);
    }, 1500);
  };

  if (!isOpen) return null;

  const convertedPrice = listing.price * exchangeRate;
  const totalAmount = parseFloat(tradeAmount || 0) * convertedPrice;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog" aria-modal="true" onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, rgba(36,40,58,0.95), rgba(20,22,32,0.95))' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold qc-title-gradient">
            {type === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
          </h2>
          <button type="button" className="text-slate-400 hover:text-white text-2xl leading-none" onClick={onClose}>×</button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Trading Currency</span>
              <select
                className="qc-input" value={tradeCurrency}
                onChange={(e) => setTradeCurrency(e.target.value)}
              >
                {Object.keys(EXCHANGE_RATES).map((c) => (
                  <option key={c} value={c}>{c} — {CURRENCY_NAMES[c]}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400">
                1 {selectedCoin} = {convertedPrice.toFixed(2)} {tradeCurrency}
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Amount ({selectedCoin})</span>
              <div className="flex">
                <input
                  type="number" required step="0.00000001"
                  min={listing.limits.min / convertedPrice}
                  max={Math.min(listing.available, listing.limits.max / convertedPrice)}
                  className="qc-input font-mono rounded-r-none flex-1"
                  placeholder="Enter amount"
                  value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)}
                />
                <span className="px-3 py-2.5 bg-white/5 border border-l-0 border-white/10 rounded-r-lg text-slate-300 text-sm">
                  {selectedCoin}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Limits: {(listing.limits.min / convertedPrice).toFixed(8)} – {(listing.limits.max / convertedPrice).toFixed(8)} {selectedCoin}
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Total ({tradeCurrency})</span>
              <div className="flex">
                <input
                  type="text" readOnly
                  className="qc-input font-mono rounded-r-none flex-1 opacity-70"
                  value={totalAmount ? totalAmount.toFixed(2) : ''}
                />
                <span className="px-3 py-2.5 bg-white/5 border border-l-0 border-white/10 rounded-r-lg text-slate-300 text-sm">
                  {tradeCurrency}
                </span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Payment Method</span>
              <select
                className="qc-input" required
                value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}
              >
                <option value="">Select payment method</option>
                {listing.paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>

            <button type="submit" className="qc-btn qc-btn-primary mt-2">Confirm Order</button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center text-2xl font-bold py-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300">
              Time remaining: {formatTime(timer)}
            </div>

            <div className="flex flex-col gap-1 bg-black/30 rounded-lg p-3 text-sm">
              {[
                ['Amount',         `${tradeAmount} ${selectedCoin}`],
                ['Price',          `${convertedPrice.toFixed(2)} ${tradeCurrency}`],
                ['Total',          `${totalAmount.toFixed(2)} ${tradeCurrency}`],
                ['Payment Method', selectedPayment],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-white/[0.06] last:border-b-0">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-mono text-slate-100">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-cyan-300/6 border border-cyan-300/20 rounded-lg p-3 text-sm leading-relaxed">
              <h3 className="text-cyan-300 font-semibold mb-2">Payment Instructions</h3>
              <ol className="list-decimal list-inside text-slate-300 space-y-1 mb-3">
                <li>Send {totalAmount.toFixed(2)} {tradeCurrency} using {selectedPayment}.</li>
                <li>Use the reference number in your payment description.</li>
                <li>Click &quot;Payment Sent&quot; after completing the transfer.</li>
              </ol>
              <div className="flex flex-col gap-1 bg-black/30 rounded p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Name</span>
                  <span className="font-mono">{listing.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference</span>
                  <span className="font-mono">P2P-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {status === 'pending' ? (
              <button type="button" onClick={handleSubmit} className="qc-btn qc-btn-primary">Payment Sent</button>
            ) : (
              <div className="text-center py-3 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-semibold">
                Trade completed successfully!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TopTraders = () => (
  <article className="qc-card">
    <header className="flex justify-between items-start gap-4 mb-4 flex-wrap">
      <div>
        <h2 className="text-xl font-bold">Top P2P Traders</h2>
        <p className="text-sm text-slate-400 mt-1">Trusted traders with highest volume and success rate.</p>
      </div>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {TOP_TRADERS.map((t) => (
        <div key={t.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">{t.avatar}</div>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 font-bold truncate">{t.username}</h3>
              <span className="text-xs text-slate-400">Verified {t.verifiedSince}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-300/15 text-cyan-300 text-[0.65rem] font-bold uppercase tracking-wider shrink-0">
              Top {t.id}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Total Trades',   t.totalTrades.toLocaleString()],
              ['Success Rate',   `${t.successRate}%`, 'text-emerald-400'],
              ['Monthly Trades', t.monthlyTrades],
              ['Volume',         `$${t.volume.toLocaleString()}`],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex flex-col gap-0.5 bg-black/20 rounded p-2">
                <span className="text-slate-400 text-[0.65rem] uppercase tracking-wider">{label}</span>
                <span className={`font-semibold ${cls || 'text-slate-100'}`}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <span className="qc-label-up">Specializes in</span>
            <div className="flex gap-1 flex-wrap mt-1.5">
              {t.specialization.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">{c}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="qc-label-up">Recent trades</span>
            <div className="flex flex-col gap-1 mt-1.5">
              {t.recentTrades.map((tr, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[0.6rem] tracking-wider ${
                    tr.type === 'buy' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                  }`}>
                    {tr.type.toUpperCase()}
                  </span>
                  <span className="font-mono text-slate-300 flex-1">{tr.amount}</span>
                  <span className="text-slate-500">{tr.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </article>
);

const P2P = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [selectedFiat, setSelectedFiat] = useState('USD');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const handleTrade = (listing) => {
    setSelectedListing(listing);
    setModalOpen(true);
  };

  const filtered = MOCK_LISTINGS.filter((listing) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      listing.user.toLowerCase().includes(term) ||
      listing.paymentMethods.some((m) => m.toLowerCase().includes(term));
    const matchesPrice =
      (!priceRange.min || listing.price >= parseFloat(priceRange.min)) &&
      (!priceRange.max || listing.price <= parseFloat(priceRange.max));
    return matchesSearch && matchesPrice;
  });

  return (
    <div className="max-w-[1280px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header>
        <h1 className="text-3xl font-bold qc-title-gradient">P2P Trading</h1>
        <p className="mt-2 text-slate-300 leading-relaxed">
          Direct peer-to-peer trades with escrow + payment-method matching. Illustrative listings.
        </p>
      </header>

      <article className="qc-card">
        <div className="flex flex-col gap-4">
          <div className="inline-flex bg-black/25 rounded-lg p-[3px] border border-white/10 self-start">
            {['buy', 'sell'].map((t) => (
              <button
                key={t}
                type="button"
                className={`px-5 py-2 rounded-md text-sm font-medium transition capitalize ${
                  activeTab === t ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300'
                }`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Coin</span>
              <select className="qc-input" value={selectedCoin} onChange={(e) => setSelectedCoin(e.target.value)}>
                {COINS.map((c) => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Fiat</span>
              <select className="qc-input" value={selectedFiat} onChange={(e) => setSelectedFiat(e.target.value)}>
                {FIATS.map((f) => <option key={f.symbol} value={f.symbol}>{f.symbol} — {f.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Search</span>
              <input
                className="qc-input"
                type="text" placeholder="Trader or payment method"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="qc-label-up">Price Range ({selectedFiat})</span>
              <div className="flex items-center gap-2">
                <input
                  className="qc-input flex-1" type="number" placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                />
                <span className="text-slate-500">–</span>
                <input
                  className="qc-input flex-1" type="number" placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                />
              </div>
            </label>
          </div>
        </div>
      </article>

      <article className="qc-card">
        <div className="overflow-x-auto rounded-xl bg-black/20 border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Trader', 'Price', 'Limits', 'Payment', 'Available', ''].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[0.72rem] font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => (
                <tr key={listing.id} className="border-t border-white/[0.06]">
                  <td className="px-3.5 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">{listing.user}</span>
                      <span className="text-xs text-amber-300">★ {listing.rating} <span className="text-slate-400">({listing.completedTrades} trades)</span></span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-mono">{listing.price.toLocaleString()} {selectedFiat}</td>
                  <td className="px-3.5 py-3 text-slate-300 whitespace-nowrap">
                    {listing.limits.min.toLocaleString()} – {listing.limits.max.toLocaleString()} {selectedFiat}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {listing.paymentMethods.map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-slate-300">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-mono">{listing.available} {selectedCoin}</td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                        activeTab === 'buy'
                          ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                          : 'bg-rose-500 text-slate-900 hover:bg-rose-400'
                      }`}
                      onClick={() => handleTrade(listing)}
                    >
                      {activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <TopTraders />

      {modalOpen && selectedListing && (
        <TradeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          listing={selectedListing}
          type={activeTab}
          selectedCoin={selectedCoin}
          selectedFiat={selectedFiat}
        />
      )}
    </div>
  );
};

export default P2P;
