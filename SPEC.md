# QuantumChain AI — Product Spec

## 1. Mission

A cryptocurrency trading platform that lets users **bring their own Binance
API keys** and trade through our UI, augmented by an **AI layer** that:

1. **Predicts** next-period price action with a numeric model (LSTM).
2. **Explains** that prediction in plain English with an LLM (Claude),
   including risk factors a human trader should monitor.
3. **Auto-trades** within strict user-defined safety bounds (opt-in,
   off by default, dry-run by default, kill switch always one click away).

## 2. Why this stack (decision log)

| Concern | Choice | Rationale |
|---|---|---|
| Price forecast | **LSTM** (Keras, 1h OHLC) | LLMs are not reliable numeric forecasters. A small recurrent / transformer-for-TS model is the correct tool for tabular candlestick data. |
| Trade rationale | **Claude (Anthropic)** | LLMs excel at narrative reasoning over heterogeneous signals (numeric forecast + sentiment + technicals). Used for *explanation*, not *forecasting*. |
| Python web layer | **FastAPI** | Async, Pydantic validation, OpenAPI docs out of the box. Replaces Flask. |
| Node web layer | **Express + Sequelize + MySQL** | Already in place; not worth migrating. |
| Client | **React 18 (JS today, TS staged)** | Full TS migration is a separate effort. New service files target TS-ready shape. |
| Trade execution | **User-supplied Binance API keys** | Avoids us holding custody / order-routing liability. Keys never leave the user's browser → backend over TLS. |

## 3. Architecture

```
┌─────────────┐      HTTPS      ┌──────────────────────┐
│ React SPA   │ ─────────────▶  │ Node API (Express)   │
│ (Binance    │                 │  • auth, profile     │
│ keys held   │                 │  • auto-trade config │
│ in user     │                 │  • trade ledger      │
│ session)    │                 └──────────┬───────────┘
└──────┬──────┘                            │ MySQL (Sequelize)
       │                                   ▼
       │                            ┌────────────────┐
       │  /predict, /rationale      │ MySQL          │
       └──────────────────────────▶ └────────────────┘
                                            ▲
       ┌────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Python ML Service (FastAPI)      │
│  • /predict  → LSTM OHLC         │
│  • /train    → fit model         │
│  • /rationale→ Claude API        │
│  • /accuracy → eval metrics      │
└──────────────────────────────────┘
       ▲
       │ python-binance (klines), anthropic SDK
       ▼
   Binance public API   ·   Anthropic API
```

## 4. Feature roadmap

### Phase 1 — AI Predictions (this turn)
- [x] FastAPI `/predict` (LSTM next-hour OHLC).
- [x] FastAPI `/rationale` (Claude trade rationale + risk factors).
- [x] Redesigned Predictions page consuming both.
- [x] AI Auto-Trade safety panel UI (localStorage, dry-run, kill switch).

### Phase 2 — AI Auto-Trade engine
- [x] Sequelize `AutoTradeConfig` model: `userId`, `enabled`, `mode`,
  `maxPositionUsd`, `dailyLossLimitUsd`, `stopLossPct`, `takeProfitPct`,
  `minConfidence`, `allowedSymbols[]`, `killSwitchTriggered`/`At`/`Reason`.
  Server-side `HARD_LIMITS` enforce ceilings via Sequelize validators.
- [x] Sequelize `TradeLedger` model: append-only log of every engine action
  (`dry-run`, `submitted`, `filled`, `cancelled`, `skipped`, `failed`).
- [x] Node API endpoints under `/trading` (all `userAuthentication`-gated):
  `GET /config`, `PUT /config`, `POST /kill-switch`, `DELETE /kill-switch`,
  `GET /ledger?limit=N`, `GET /status` (config + today's P/L + at-limit flag).
- [x] Background executor (`Services/autoTradeEngine.js`):
  1. Polls every `AUTO_TRADE_TICK_MS` (default 5 min).
  2. For each enabled config: trips kill switch if today's realized P/L
     ≤ -`dailyLossLimitUsd`.
  3. Per allowed symbol: fetches Binance spot, calls FastAPI
     `/predict` + `/rationale`, decides side based on `minConfidence` floor
     and predicted move vs `stopLossPct` band.
  4. Writes every decision (trade or skip) to `TradeLedger`.
  5. Per-user / per-symbol errors are caught and logged into the ledger
     with `status='failed'` so one bad symbol can't break the tick.
- [x] Live order routing **explicitly blocked** by the controller — `mode=live`
  is rejected at the API and the engine writes `status='dry-run'` only.
  Live execution lands in Phase 4 alongside encrypted key storage.
- [x] Client `useAutoTradeConfig` hook + `autoTradeService`: prefers server
  storage when authed, falls back to `localStorage` otherwise. Predictions
  page shows a "Synced / Local-only" pill.

### Phase 3 — Real auth + encrypted key vault
- [x] Real JWT auth wired end-to-end: client `AuthContext` calls the existing
  `/user/auth/login` + `/user/auth/signUp` endpoints, persists the token, and
  injects `Authorization` on every axios request. 401 responses auto-flush
  the local session.
- [x] Login + Register forms aligned to backend contract (`emailOrPhone`,
  `name`, 10-digit phone, ≥8 char password).
- [x] AES-256-GCM crypto helper (`server/Utils/crypto.js`) keyed by
  `KEY_VAULT_MASTER_KEY` env (32-byte hex). Authenticated encryption — bad
  ciphertext or wrong key throws on decrypt.
- [x] `UserApiKeys` Sequelize model: encrypted `apiKeyEnc`/`apiSecretEnc`,
  plaintext `apiKeyMask` for UI, `lastTestStatus` + `lastTestMessage` for
  diagnostics. Unique on `(userId, exchange)`.
- [x] `/user/api-keys/binance` routes (auth-gated): `GET`, `PUT`, `DELETE`,
  `POST /test` (signs a Binance `/api/v3/account` call to verify the keys
  without revealing balances). Plaintext secrets are **never** returned.
- [x] Client `apiKeysService` + `/settings/api-keys` page (`ApiKeys.{js,css}`)
  with set/test/replace/delete UX and a security checklist (withdrawals OFF,
  IP whitelist, spot-only).
- [x] Predictions page disclaimer links straight to `/settings/api-keys`.

### Phase 4 — Live order routing
- [x] Backtesting harness for the LSTM (rolling-window directional accuracy
  in `Python-Server/services/backtester.py`, 1h cache). Wired to
  FastAPI `/accuracy?symbol=…&lookback_days=…`.
- [x] Live executor: when `cfg.mode === 'live'` AND every gate passes, the
  engine decrypts the user's Binance keys in memory, places a MARKET BUY
  via `quoteOrderQty=maxPositionUsd`, then brackets the filled position
  with an OCO SELL at recomputed `stopLoss` / `takeProfit` prices.
  `TradeLedger.status` transitions `submitted → filled` on entry and the
  row is marked `OCO FAILED` if the bracket fails so the user can intervene.
- [x] Per-user re-auth flow: `POST /trading/acknowledge-live` re-verifies
  the bcrypt password and sets `liveAcknowledgedAt`. Ack expires after
  `LIVE_ACK_TTL_HOURS` (default 24). Client `AckLiveModal` collects the
  password before flipping mode and surfaces structured server errors
  (`LIVE_DISABLED_BY_SERVER`, `LIVE_ACK_REQUIRED`, `API_KEYS_MISSING`,
  `API_KEYS_UNTESTED`).
- [x] Independent live gates re-checked at every tick:
  `ALLOW_LIVE_TRADING=true`, `liveAcknowledgedAt` valid,
  `UserApiKeys.lastTestStatus='ok'`, daily-loss limit not breached,
  USDT balance ≥ requested notional, `consecutiveFailures < 3`. Any miss
  soft-degrades to dry-run for that tick or trips the kill switch.
- [x] Consecutive-failure auto-kill: 3 strikes in a row (decrypt fail,
  Binance auth fail, balance fetch fail, marketBuy fail, generic engine
  error) and the engine sets `killSwitchTriggered=true` with a reason.
- [x] Spot-shorting safety: SELL signals are logged as `skipped` in live
  mode (no inventory tracking yet — Phase 5).
- [x] Structured JSON logging in the engine (level, svc, msg + meta) so
  any aggregator can ingest.

### Phase 5 — Production hardening
- [x] **2FA (TOTP)** end-to-end. User model gains `twoFactorSecret` +
  `twoFactorEnabled`. New `/user/2fa` routes: `status`, `setup` (generates a
  provisional `speakeasy` secret + otpauth URI), `enable` (verify code →
  confirm), `disable` (password + code → wipe). Login flow returns
  `{ code: '2FA_REQUIRED' | '2FA_INVALID' }` when applicable. Client
  `/settings/2fa` page renders the QR (via `qrcode.react`) + manual-entry
  secret fallback; Login form shows a code field on demand.
- [x] **Master-key rotation** (`npm run rotate-keys`). Crypto helper now
  accepts an explicit key override; new `scripts/rotate-master-key.js`
  re-encrypts every `UserApiKeys` row from `KEY_VAULT_OLD_KEY` →
  `KEY_VAULT_NEW_KEY` one transaction at a time, gracefully skipping rows
  already on the new key.
- [x] **Prom metrics + `/metrics` endpoint**. `prom-client` default
  metrics + custom counters/histograms: `qc_trade_decisions_total`,
  `qc_trade_skips_total` (with bucketed reasons), `qc_live_orders_total`,
  `qc_engine_errors_total`, `qc_kill_switches_total`, `qc_tick_seconds`,
  `qc_binance_call_seconds`, `qc_binance_retries_total`.
- [x] **Binance retry + jitter**. Idempotent calls (`getAccount`,
  `getOrder`) auto-retry up to `BINANCE_MAX_RETRIES` (default 3) with
  exponential backoff + full jitter on 429 / 5xx / network errors.
  **Non-idempotent** calls (`marketBuy`, `placeOcoSell`) are deliberately
  not retried — a "did it go through?" double-tap would risk a double-fill.

### Phase 6 — Remaining hardening
- [x] **Inventory-aware SELL.** New Binance helpers `getBaseBalance`,
  `getOpenOrders`, `cancelAllOpenOrders`, `marketSell`. Live SELL path:
  cancel any existing open orders (so a prior OCO doesn't fight us), read
  free base balance, market-sell `min(balance, maxPositionUsd / spot)`,
  compute best-effort realized P/L against the most recent filled BUY
  ledger row. SELL signals with no open inventory are skipped cleanly.
- [x] **Per-user circuit breaker** keyed by `${userId}:${endpoint}`.
  Closed → 5 consecutive failures → Open (10 min cooldown) → Half-open
  trial → Closed/Open. One user's bad state can't burn shared budget for
  others. `CircuitOpenError` is converted to a skip ledger row.
- [x] **2FA backup codes.** 10 single-use codes generated at enable
  (`ABCD-EF12` format, bcrypt-hashed). Plaintext returned exactly once;
  remaining count exposed via `/2fa/status`. Used codes are atomically
  removed. Backup codes work for both **login** and **disable** flows.
  New `POST /user/2fa/backup-codes` regenerates with password re-auth.
- [x] **Rate-limit on auth endpoints.** `express-rate-limit` with
  `(IP, identifier)` key. Login: 5 failures per 15 min. 2FA enable/disable
  /backup-codes: 10 per 15 min. Successful requests do not consume budget.

### Phase 7 — News, attribution, reconciliation
- [x] **Crypto news ingestion.** `Python-Server/services/news_feed.py`
  fetches CryptoCompare's free news API per-category with a 15-min cache
  and graceful fallback to general crypto news on miss. The
  `RationaleService` injects up to 5 headlines (with source + sentiment
  tag) into the per-request user prompt; the system prompt now tells the
  model to *cite* a headline when one is clearly relevant and to lower
  the `confidence_label` when headlines disagree with the forecast.
  Failures degrade silently to "(no recent headlines)". New FastAPI
  endpoint `GET /news?symbol=X&max_items=N` exposes the same data for UI.
- [x] **clientOrderId tagging.** Every engine order carries a
  `qc-{kind}-{userId}-{ts}-{rnd}` clientOrderId (29 chars; Binance limit
  is 36). `marketBuy`, `marketSell`, `placeOcoSell` accept `userId` and
  emit ids on the entry, on the OCO list, on each OCO leg. Ledger now
  persists the `clientOrderId` returned by Binance.
- [x] **Position reconciliation endpoint.**
  `GET /trading/reconcile?symbol=X` decrypts the user's keys in memory,
  fetches `myTrades` for the symbol, dedupes Binance fills by `orderId`,
  and returns `{ engineMatched, manualOnly, ledgerOnly }`. Engine matching
  uses `orderId` first then falls back to `clientOrderId`. Orders with a
  `qc-` prefix but no ledger row (e.g. server crashed between POST and
  ledger write) are flagged but counted as `engineMatched`.

### Phase 8 — XGBoost backend + reconcile UI
- [x] **XGBoost backend**, default. `model_trainer_xgb.py` builds 13
  engineered TA features (lagged returns, EMA deviations, RSI(14), MACD +
  signal, ATR(14), volume z-score) and trains four `XGBRegressor`s — one
  per OHLC return. Targets are *fractional moves from last close* so the
  same architecture works across symbols. Native XGBoost JSON
  serialization (`xgb_{open,high,low,close}_ret.json` + `xgb_meta.json`).
- [x] **Predictor backend-switching.** `MODEL_BACKEND=xgb` (default) or
  `lstm`. The predictor delegates `accuracy()` to the trainer's own
  `backtest()` when available — XGBoost gives directional accuracy in
  milliseconds, no Keras model reload required.
- [x] **Lean default install.** `requirements.txt` no longer depends on
  TensorFlow. `requirements-lstm.txt` adds it back for users who want the
  legacy backend. Default install drops from ~4 GB to ~50 MB and runs on
  any Python 3.12+ environment.
- [x] **Reconcile UI** (`/settings/reconcile`). Symbol picker, calls
  `GET /trading/reconcile`, renders three buckets (engineMatched,
  manualOnly, ledgerOnly) as sortable-style tables. Buckets summarise
  counts. Cross-link from `/settings/api-keys`.

### Phase 9 — Ensemble + distributed state
- [x] **Model ensemble.** `MODEL_BACKEND=ensemble` loads both XGBoost and
  LSTM trainers; the predictor blends their OHLC forecasts weighted by
  recent rolling directional accuracy (XGBoost via its self-backtest;
  LSTM via the shared backtester + Keras model reload). Per-symbol weight
  cache (1h TTL) so we don't re-backtest on every predict. Equal-weight
  fallback when either backend can't be measured; single-backend fallback
  when one fails to load. Refuses to start only if **both** backends are
  unavailable.
- [x] **Distributed cache (Redis-backed).** New `Services/distributedCache.js`
  (Node, ioredis) and `services/distributed_cache.py` (Python, redis-py)
  expose a tiny `get`/`set(ttl)`/`del`/`incr` surface. The circuit breaker
  (Node) and news feed (Python) both use it. If `REDIS_URL` is set, state
  lives in Redis so a fleet of Node/Python processes shares it. If unset,
  both fall back to in-memory dicts. Connection errors silently downgrade
  to memory so a transient Redis outage never wedges the engine.

### Phase 10 — Tailwind + position rollup
- [x] **Tailwind CSS** wired into CRA. `tailwind.config.js` extends colors
  + a `font-mono` family + custom keyframes for the pulse dot and skeleton
  shimmer. `src/index.css` adds `@tailwind` directives and a small
  `@layer components` block of reusable primitives (`qc-card`,
  `qc-btn[-primary|-ghost|-danger]`, `qc-input`, `qc-label-up`,
  `qc-title-gradient`) so the JSX stays readable.
- [x] **6 Phase 1-9 pages converted to Tailwind**, separate CSS files
  deleted: Predictions, AckLiveModal, ApiKeys, TwoFactor, Reconcile,
  Login, Register. Older pages (Market, Portfolio, SpotTrade, P2P, About,
  Profile, Home, BinanceIntegration, AdminPanel, kyc) remain on their
  existing scoped CSS — they were never broken and converting them is
  mechanical busywork that deserves its own session.
- [x] **Position rollup endpoint** `GET /trading/positions?days=N`.
  Aggregates `TradeLedger` per symbol: net qty, buy/sell volume,
  avg entry/exit price, realised P/L, action counts (fills / dry-runs /
  skips / failures), last action timestamp. Engine-side view only; for
  exchange-of-truth still use `/trading/reconcile`.

### Phase 11 — Outstanding
- [ ] Convert remaining older pages to Tailwind (Market, Portfolio,
  SpotTrade, P2P, About, Profile, Home, BinanceIntegration, AdminPanel).
- [ ] Full TypeScript migration of `client/`.
- [ ] On-chain sentiment (exchange in/outflows, large-holder activity).
- [ ] Walk-forward training: schedule the engine to retrain models every
  N days against a rolling window of recent data.
- [ ] Positions UI page that consumes `/trading/positions`.

### Phase 5 — Production
- [ ] 2FA on user accounts.
- [ ] Rotate `KEY_VAULT_MASTER_KEY` with re-encryption migration.
- [ ] Full TypeScript migration of `client/`.
- [ ] Replace TF with a leaner model (XGBoost / Lightning / Keras-core) so
  the Python service installs in <500 MB on Python 3.12+ rather than ~4 GB.

## 5. Safety principles for AI Auto-Trade

Non-negotiable, enforced at the executor:

1. **Off by default.** New accounts have `enabled=false`, `dryRun=true`.
2. **Hard limits are server-side.** The client can request limits but the
   executor enforces a global ceiling (e.g. `maxPositionUsd <= $5,000`).
3. **Kill switch is one click.** Clicking it stops all open AI orders within
   one polling interval and persists `killSwitchTriggered=true` (must be
   manually cleared).
4. **Confidence floor.** No trade is placed if LLM `confidence_label != "high"`
   AND the LSTM-predicted move is below the configured threshold.
5. **Daily loss limit auto-trips kill switch.** No exceptions.
6. **All live orders carry stop-loss + take-profit** computed from
   `stopLossPct` / `takeProfitPct`. No naked market orders.
7. **Every action is logged.** No silent execution.

## 6. Non-goals (for now)

- Custodial wallet — users hold their own keys on Binance.
- Multi-exchange — Binance only in v1.
- Leveraged / margin / futures — spot only.
- Mobile native app — responsive web only.
