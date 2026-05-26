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
└── Python-Server/         # Flask ML microservice
    ├── app.py             # /predict and /train HTTP endpoints
    ├── model_trainer.py   # LSTM model over Binance klines
    ├── models/            # Per-symbol trained .h5 weights (gitignored)
    └── requirements.txt
```

## Key Features

- **Authentication** — JWT-based login/registration, role-based token TTLs.
- **Trading UI** — Spot, P2P, Portfolio, Market, Predictions, Profile pages.
- **AI predictions** — Per-symbol LSTM trained on 1-hour Binance candles
  (Open/High/Low/Close), exposed via the Flask service.
- **Admin dashboard** — User and transaction overview.
- **Activity logging** — IP, user-agent, and geolocation captured on every
  request (`server/app.js`).

## Technology Stack

- **Frontend:** React 18, React Router 6, Chart.js + react-chartjs-2,
  lightweight-charts, axios, crypto-js, styled-components, react-toastify.
- **Backend (API):** Node.js, Express, Sequelize, **MySQL**, body-parser,
  express-useragent, geoip-lite.
- **ML service:** Python 3, Flask, TensorFlow/Keras (LSTM), scikit-learn,
  python-binance, pandas.
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

# Python ML service
cd Python-Server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 4. Run the three services

In three terminals:

```bash
# Terminal 1 — Node API (defaults to :5001, configurable via APP_PORT)
cd server && npm run dev    # or: node app.js

# Terminal 2 — Flask ML service (port 5000)
cd Python-Server && python app.py

# Terminal 3 — React client (port 3000)
cd client && npm start
```

## Ports at a glance

| Service           | Default port | Env var                          |
|-------------------|--------------|----------------------------------|
| React client      | 3000         | (CRA `PORT`)                     |
| Flask ML service  | 5000         | (hard-coded in `app.py`)         |
| Node API          | 5001         | `APP_PORT`                       |

The Node API's allowed CORS origin is configurable via `CLIENT_ORIGIN`
(defaults to `http://localhost:3000`). The React client's CRA `proxy` field
in `client/package.json` forwards unknown requests to `http://localhost:5000`
(the Flask service); the prediction client also reads
`REACT_APP_PREDICTION_API_URL` if set.

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
