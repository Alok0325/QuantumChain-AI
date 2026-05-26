# QuantumChain AI — Cryptocurrency Trading Platform

A full-stack cryptocurrency trading platform combining a React frontend, an
Express + MySQL backend, and a Flask/TensorFlow microservice that trains and
serves LSTM price-prediction models.

## Project Structure

```
QuantumChain-AI/
├── client/                # React 18 SPA (CRA)
│   ├── public/
│   └── src/
│       ├── components/    # Admin, Auth, Body (Landing pages), UI, kyc
│       ├── config/        # routes.js
│       ├── context/       # React contexts
│       ├── services/      # binanceService.js, predictionService.js
│       ├── App.js
│       └── index.js
│
├── server/                # Node/Express API + MySQL (Sequelize)
│   ├── Controller/        # Auth, Profile, Files
│   ├── Middleware/        # auth, fileHandler
│   ├── Models/            # Sequelize models + setModels.js
│   ├── Routes/            # setupRoutes.js + per-feature route trees
│   ├── Utils/             # utils, fileHandler
│   ├── database/          # schema.sql
│   ├── app.js             # Server entry point
│   ├── database.js        # Sequelize instance (MySQL)
│   ├── proxy.js           # Standalone KuCoin proxy (optional)
│   └── importantInfo.js   # Shared config / JWT settings
│
└── Python-Server/         # FastAPI ML microservice
    ├── main.py            # FastAPI app: /predict /train /rationale /accuracy /health
    ├── schemas.py         # Pydantic request/response models
    ├── services/
    │   ├── predictor.py   # Wraps LSTM trainer, degrades gracefully
    │   └── llm_rationale.py # Claude-powered trade rationale (with prompt caching)
    ├── model_trainer.py   # LSTM over Binance klines
    ├── models/            # Per-symbol trained .h5 weights (gitignored)
    └── requirements.txt
```

See **[SPEC.md](./SPEC.md)** for the product vision, decision log, and roadmap.

## Key Features

- **Authentication** — JWT-based login/registration, role-based token TTLs.
- **Trading UI** — Spot, P2P, Portfolio, Market, Predictions, Profile pages.
- **AI predictions** — Per-symbol LSTM trained on 1-hour Binance candles
  (Open/High/Low/Close), exposed via the FastAPI service.
- **AI rationale** — Claude (Anthropic) consumes the numeric forecast and
  produces a hedged plain-English rationale + risk factors via `/rationale`.
- **AI Auto-Trade (configuration)** — Safety panel on the Predictions page:
  max position, daily loss limit, stop-loss / take-profit %, min AI
  confidence, allowed symbols, dry-run mode, one-click kill switch.
- **Admin dashboard** — User and transaction overview.
- **Activity logging** — IP, user-agent, and geolocation captured on every
  request (`server/app.js`).

## Technology Stack

- **Frontend:** React 18, React Router 6, Chart.js + react-chartjs-2,
  lightweight-charts, axios, crypto-js, styled-components, react-toastify.
- **Backend (API):** Node.js, Express, Sequelize, **MySQL**, body-parser,
  express-useragent, geoip-lite.
- **ML service:** Python 3.12+, **FastAPI**, Pydantic, **XGBoost** (default
  forecaster) or TensorFlow/Keras (legacy LSTM via `requirements-lstm.txt`),
  scikit-learn, python-binance, pandas, **Anthropic SDK** (Claude rationale).
- **Optional:** `server/proxy.js` — a standalone Express proxy in front of
  KuCoin public endpoints.

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Alok0325/QuantumChain-AI.git
cd QuantumChain-AI
```

### 2. Configure environment files

Copy each `.env.example` to `.env` and fill in real values:

```bash
cp server/.env.example         server/.env
cp client/.env.example         client/.env
cp Python-Server/.env.example  Python-Server/.env
```

The server expects a reachable MySQL instance using `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, and `DB_HOST`. The Python service requires Binance API
credentials.

### 3. Install dependencies

```bash
# Client
cd client && npm install && cd ..

# Server
cd server && npm install && cd ..

# Python ML service — default backend is XGBoost, runs on Python 3.12+.
cd Python-Server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Optional: legacy LSTM backend (adds TensorFlow, ~4GB, Python ≤3.12 only):
#   pip install -r requirements-lstm.txt && export MODEL_BACKEND=lstm
cd ..
```

### 4. Run the three services

In three terminals:

```bash
# Terminal 1 — Node API (defaults to :5001, configurable via APP_PORT)
cd server && npm run dev    # or: node app.js

# Terminal 2 — FastAPI ML service (port 5000)
cd Python-Server && source .venv/bin/activate && python main.py
#   → interactive API docs at http://localhost:5000/docs

# Terminal 3 — React client (port 3000)
cd client && npm start
```

## Ports at a glance

| Service             | Default port | Env var                          |
|---------------------|--------------|----------------------------------|
| React client        | 3000         | (CRA `PORT`)                     |
| FastAPI ML service  | 5000         | `PORT` in `Python-Server/.env`   |
| Node API            | 5001         | `APP_PORT`                       |

The Node API's allowed CORS origin is configurable via `CLIENT_ORIGIN`
(defaults to `http://localhost:3000`). The FastAPI service also accepts a
comma-separated `CLIENT_ORIGIN`. The React client reads
`REACT_APP_PREDICTION_API_URL` for the FastAPI base URL.

### AI rationale (Claude)
Set `ANTHROPIC_API_KEY` in `Python-Server/.env` to enable the `/rationale`
endpoint. Without it, the endpoint returns a deterministic offline fallback
(numeric bias only — no LLM call). `CLAUDE_MODEL` defaults to
`claude-sonnet-4-6`. The rationale automatically pulls 5 recent crypto
headlines (CryptoCompare, 15-min cached) and feeds them to Claude so the
narrative can cite real news. Headlines are also available standalone via
`GET /news?symbol=BTC`.

### Position reconciliation (Phase 7)
`GET /trading/reconcile?symbol=BTC` (auth-gated) compares the local
`TradeLedger` against the user's actual Binance trade history:
- `engineMatched` — orders we placed (matched by `orderId` first,
  `clientOrderId` second). Includes orders whose `clientOrderId` starts
  with `qc-` but have no ledger row (server-crash debris) — flagged.
- `manualOnly` — Binance trades the engine didn't place.
- `ledgerOnly` — ledger rows with no corresponding fill on Binance.

Every engine order is tagged with a `qc-{kind}-{userId}-{ts}-{rnd}`
`clientOrderId` so attribution survives even if `orderId` matching fails.

### Encrypted Binance keys (vault)
Phase 3 added a per-user encrypted key vault. Generate a 32-byte master key
and add it to `server/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then set `KEY_VAULT_MASTER_KEY=<the hex>`. Users add their Binance API key
+ secret on `/settings/api-keys`; the server stores them as AES-256-GCM
ciphertext and only decrypts in memory to test or place orders. Rotating
the master key invalidates existing blobs — plan a migration.

### Two-factor authentication (Phase 5, hardened in Phase 6)
TOTP via `speakeasy`. Users enable from `/settings/2fa` by scanning the
generated QR with any authenticator app, then entering a code. Once on,
login requires the 6-digit code (or a single-use backup code) in addition
to the password. Login responses distinguish the two failure modes with
structured error codes (`2FA_REQUIRED`, `2FA_INVALID`) so the client knows
when to show the code field. Disabling requires both password and a code.

**Backup codes:** 10 single-use codes in `ABCD-EF12` format generated at
enable (and via `POST /user/2fa/backup-codes` after password re-auth).
Plaintext is shown exactly once. Used codes are atomically removed.
Backup codes work on both login and disable flows.

**Rate-limit:** login is limited to 5 failed attempts per 15 minutes per
(IP, identifier); 2FA endpoints to 10 per 15 minutes. Successful requests
do not consume the budget. Configurable via `express-rate-limit`.

### Master-key rotation (Phase 5)
The crypto helper accepts an explicit key, so you can rotate
`KEY_VAULT_MASTER_KEY` without downtime:

```bash
# 1. Generate the new key
NEW=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# 2. Re-encrypt every UserApiKeys row
KEY_VAULT_OLD_KEY=$OLD KEY_VAULT_NEW_KEY=$NEW npm run rotate-keys
# 3. Swap KEY_VAULT_MASTER_KEY in server/.env to $NEW and restart
```

The script is transactional per row, idempotent (rows already on the new
key are skipped), and refuses to claim success if any row failed.

### Backtest UI + webhook alerts (Phase 13, signed in Phase 14)
`/settings/accuracy` consumes `GET /accuracy?symbol=X&lookback_days=N` in
parallel for every supported symbol and renders a per-symbol bar chart
with a 50% baseline tick. Each row has a one-click "Train" button.

**Webhooks**: set an `https://` URL in the auto-trade panel and the engine
will POST `{ event, userId, timestamp, data }` on kill-switch trips,
daily-loss-limit hits, and live order fills. Compatible with Discord /
Slack / Zapier incoming webhooks. The dispatcher is fire-and-forget with
a 5 s timeout and a per-(user, url) circuit breaker (5 failures →
30 min cooldown) so a flapping endpoint can't impact engine ticks.

**Signed deliveries (Phases 14-15):** every webhook POST carries three
headers — `X-QC-Event: <name>`, `X-QC-Timestamp: <iso>`, and
`X-QC-Signature: sha256=<hex>`. The signature is HMAC-SHA256 of
`${timestamp}.${body}` using a per-user 64-char hex secret that's
auto-generated on first save and **revealed exactly once**. Including
the timestamp in the signed payload defeats replay attacks. Verify
on your side like this (Node):

```js
const ts = req.headers['x-qc-timestamp'];
// 1. Freshness: reject anything older than 5 minutes.
const ageMs = Math.abs(Date.now() - new Date(ts).getTime());
if (ageMs > 5 * 60 * 1000) return res.status(401).end();

// 2. Signature: HMAC must match.
const expected = crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(`${ts}.${rawBody}`)
  .digest('hex');
const sig = (req.headers['x-qc-signature'] || '').replace(/^sha256=/, '');
const ok = sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
if (!ok) return res.status(401).end();
```

Per-event filters are available via the toggle chips on the Predictions
page. Rotate the secret any time via the **Rotate secret** button.

**Delivery audit log (Phase 15):** every dispatch is recorded with status
code, response time, and error (if any). Visible from the Predictions
page via the "Show recent deliveries" link. Also exposed at
`GET /trading/webhook/deliveries?limit=N`.

**Retries + retention (Phase 16):** failed deliveries auto-retry up to 2
times with exponential backoff + full jitter (network errors, 429, 5xx).
4xx are non-retryable. The audit log keeps the last 1000 rows / 30 days
per user, pruned opportunistically on every insert. Tune via
`WEBHOOK_MAX_RETRIES`, `WEBHOOK_BASE_BACKOFF_MS`,
`WEBHOOK_AUDIT_KEEP_ROWS`, `WEBHOOK_AUDIT_KEEP_DAYS`.

### Flow signal + strategy presets (Phase 12)
The Claude rationale now consumes a third signal alongside the numeric
forecast and headlines: **Binance taker buy/sell ratio** over the last 24h
and 4h. Available standalone via `GET /pressure?symbol=BTC`. The system
prompt requires forecast + news + flow agreement for the model to label
its rationale `high` confidence.

**Strategy presets** at `GET /trading/presets` return three opinionated
one-click profiles (Conservative / Moderate / Aggressive). The Predictions
page renders them as buttons under the Auto-Trade card; clicking one calls
`PUT /trading/config` with the preset's settings. Limits are server-owned
so they always stay within `HARD_LIMITS`.

### Walk-forward retraining (Phase 11)
The FastAPI service runs a background task that retrains every trained
symbol every `RETRAIN_INTERVAL_HOURS` (default 24h). Disable with
`RETRAIN_ENABLED=false`. Inspect at `GET /scheduler`. Because both
backends re-read model files on each predict, no restart is needed for
the new model to be picked up.

### Positions UI (Phase 11)
`/settings/positions` consumes `GET /trading/positions?days=N` and shows
the engine's ledger-side rollup: net qty per symbol, average entry/exit
price, realised P/L, and a count of fills / dry-runs / skips / failures
over the chosen window. For exchange-of-truth view see `/settings/reconcile`.

### TypeScript foothold (Phase 17)
The client now compiles a mixed JS + TS tree. `client/tsconfig.json` has
`allowJs: true` so `.js` files keep working as-is. Shared domain types
live in `client/src/types/` and cover the entire public API surface
(auto-trade config, predictions, rationale, ledger, positions, reconcile,
webhooks, API keys, 2FA). The two most-touched services
(`predictionService.ts`, `autoTradeService.ts`) and the
`useAutoTradeConfig` hook are fully typed; the rest can be migrated
file-by-file without breaking the rest of the app.

### Tailwind CSS (Phase 10)
The Phase 1-9 pages (Predictions, AckLiveModal, ApiKeys, TwoFactor,
Reconcile, Login, Register) are written in Tailwind. `src/index.css` exposes
a tiny `@layer components` block (`qc-card`, `qc-btn[-primary|-ghost|-danger]`,
`qc-input`, `qc-label-up`, `qc-title-gradient`) so the JSX stays readable
without inline 200-character class strings. Older pages keep their existing
scoped CSS and coexist with Tailwind in the same build.

### Position rollup (Phase 10)
`GET /trading/positions?days=30` (auth-gated) returns each symbol's
ledger-side net position, buy/sell volume, avg entry/exit price, realised
P/L, and counts of fills / dry-runs / skips / failures over the window.
Engine-side only; the exchange-of-truth view is `/trading/reconcile`.

### Model ensemble + distributed state (Phase 9)
Set `MODEL_BACKEND=ensemble` in `Python-Server/.env` to blend the XGBoost
and LSTM forecasters. The ensemble weights each backend by its recent
rolling directional accuracy (1h-cached per symbol). If only one backend
is available the ensemble degrades to that backend automatically.

For multi-instance deploys, set `REDIS_URL` in both `server/.env` and
`Python-Server/.env`. The Node circuit breaker and the Python news cache
both move their state to Redis so the fleet shares a single view. Without
`REDIS_URL` everything stays in-process — no Redis required for solo dev.

### Observability (Phase 5)
The Node API exposes Prometheus metrics at `GET /metrics` (no auth — keep
behind a firewall in production). Key series with `qc_` prefix:
`qc_trade_decisions_total{mode,status,side,symbol}`,
`qc_trade_skips_total{symbol,reason_bucket}`,
`qc_live_orders_total{symbol,side,status}`,
`qc_engine_errors_total{stage}`, `qc_kill_switches_total{reason_bucket}`,
`qc_tick_seconds`, `qc_binance_call_seconds{endpoint,outcome}`,
`qc_binance_retries_total{endpoint,kind}`. The engine itself emits
one-line JSON logs.

### Live trading (Phase 4)
Live order placement is **off by default**. To enable, ALL of the following
must hold simultaneously:

1. **Server env:** `ALLOW_LIVE_TRADING=true` in `server/.env`.
2. **Tested keys:** the user has saved Binance keys at `/settings/api-keys`
   and clicked **Test connection** (`lastTestStatus='ok'`).
3. **Re-acknowledgement:** the user has re-entered their password via the
   live-trading modal within the last `LIVE_ACK_TTL_HOURS` (default 24).
4. **Mode flipped:** `PUT /trading/config { mode: 'live' }` (the controller
   rejects this with a structured error code if any of 1–3 is missing).

When live, the engine: market-buys `maxPositionUsd` of the symbol, then
places an OCO SELL bracket at recomputed `stopLoss` / `takeProfit` prices.
`TradeLedger.status` lifecycle: `submitted → filled` on entry; the row is
flagged if the OCO fails so the user can intervene. The kill switch
**auto-trips** after 3 consecutive engine failures or when today's realized
P/L hits the daily loss limit. Engine logs are one-line JSON for easy
aggregation.

## Security Notes

- `client/src/services/binanceService.js` reads
  `REACT_APP_BINANCE_API_KEY` / `REACT_APP_BINANCE_API_SECRET`. Anything
  prefixed `REACT_APP_` is **embedded in the production bundle and visible to
  every user**. Do not ship real Binance secrets this way — proxy signed
  requests through the Node server instead.
- Always set strong `JWT_SECRET_KEY` and `DATABASE_SERVER_JWT_SECRET_KEY`
  values in production.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes.
4. Push and open a Pull Request.

## License

MIT — see the `LICENSE` file.
