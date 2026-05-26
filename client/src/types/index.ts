/**
 * Shared domain types for the QuantumChain AI client.
 *
 * Mirrors the public-facing shape of the Node API + FastAPI ML service.
 * Anything the user can see in the dashboard should have a type here so
 * the services layer stays type-safe even though the rest of the React
 * tree is still JSX.
 */

// ----- Auto-trade configuration ------------------------------------------

export type TradeMode = 'dry-run' | 'live';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type WebhookEventId =
  | 'kill_switch_engaged'
  | 'daily_loss_limit_hit'
  | 'live_order_filled'
  | 'live_order_failed'
  | 'test';

export interface HardLimits {
  MAX_POSITION_USD: number;
  MAX_DAILY_LOSS_USD: number;
  MIN_STOP_LOSS_PCT: number;
  MAX_STOP_LOSS_PCT: number;
  MIN_TAKE_PROFIT_PCT: number;
  MAX_TAKE_PROFIT_PCT: number;
  SUPPORTED_SYMBOLS: string[];
  LIVE_ACK_TTL_HOURS: number;
  LIVE_FAILURE_THRESHOLD: number;
  MIN_ORDER_NOTIONAL_USD: number;
  WEBHOOK_EVENTS: WebhookEventId[];
}

export interface AutoTradeConfig {
  enabled: boolean;
  mode: TradeMode;
  maxPositionUsd: number;
  dailyLossLimitUsd: number;
  stopLossPct: number;
  takeProfitPct: number;
  minConfidence: ConfidenceLevel;
  allowedSymbols: string[];
  killSwitchTriggered: boolean;
  killSwitchAt?: string | null;
  killSwitchReason?: string | null;
  liveAcknowledgedAt?: string | null;
  consecutiveFailures?: number;
  webhookUrl?: string | null;
  webhookEvents?: WebhookEventId[] | null;
  webhookSecret?: string;      // only present on the one-time reveal
  webhookSecretMask?: string | null;
  webhookSigned?: boolean;
  liveAckValid?: boolean;
  liveAllowedByServer?: boolean;
  hardLimits?: HardLimits;
  updatedAt?: string;
}

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<AutoTradeConfig>;
}

// ----- Predictions / ML service ------------------------------------------

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PredictionResponse {
  symbol: string;
  prediction: Candle;
  horizon_hours: number;
  model_version: string;
  demo?: boolean;
  reason?: string;
}

export interface RationaleResponse {
  rationale: string;
  confidence_label: ConfidenceLevel;
  risk_factors: string[];
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  published_on: number;
  categories: string;
  sentiment: string;
}

export interface PressureResponse {
  symbol: string;
  buy_ratio_24h: number | null;
  buy_ratio_4h: number | null;
  interpretation: string | null;
}

export interface AccuracyResponse {
  symbol: string;
  accuracy_pct: number | null;
  samples: number;
}

export interface HealthResponse {
  status: string;
  predictor_available: boolean;
  llm_enabled: boolean;
}

// ----- Trade ledger / positions / reconcile ------------------------------

export type LedgerStatus =
  | 'dry-run'
  | 'submitted'
  | 'filled'
  | 'cancelled'
  | 'skipped'
  | 'failed';

export type Side = 'buy' | 'sell';

export interface TradeLedgerRow {
  id: number;
  userId: number;
  symbol: string;
  side: Side;
  status: LedgerStatus;
  mode: TradeMode;
  reason?: string | null;
  notionalUsd: number;
  qty: number;
  entryPrice: number;
  stopLossPrice?: number | null;
  takeProfitPrice?: number | null;
  predictedClose?: number | null;
  predictedMovePct?: number | null;
  confidence?: ConfidenceLevel | null;
  exitPrice?: number | null;
  realizedPnlUsd?: number | null;
  exchangeOrderId?: string | null;
  clientOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionRow {
  symbol: string;
  netQty: number;
  buyQty: number;
  sellQty: number;
  buyNotional: number;
  sellNotional: number;
  realizedPnlUsd: number;
  fills: number;
  dryRuns: number;
  skips: number;
  failures: number;
  lastActionAt: string;
  avgEntryPrice: number;
  avgExitPrice: number;
}

export interface PositionsResponse {
  windowDays: number;
  since: string;
  totalLedgerRows: number;
  positions: PositionRow[];
}

export interface ReconcileOrder {
  orderId: string;
  clientOrderId?: string | null;
  side: Side;
  qty: number;
  quoteQty: number;
  time: number;
  avgPrice: number;
  ledgerId?: number | null;
  warning?: string;
}

export interface ReconcileLedgerOnly {
  id: number;
  side: Side;
  status: LedgerStatus;
  orderId: string;
  clientOrderId?: string | null;
  createdAt: string;
}

export interface ReconcileResponse {
  symbol: string;
  ledgerRows: number;
  binanceTradeRows: number;
  binanceUniqueOrders: number;
  engineMatched: ReconcileOrder[];
  manualOnly: ReconcileOrder[];
  ledgerOnly: ReconcileLedgerOnly[];
}

// ----- Webhook deliveries ------------------------------------------------

export interface WebhookDelivery {
  id: number;
  userId: number | null;
  event: WebhookEventId;
  url: string;
  statusCode: number | null;
  delivered: boolean;
  responseMs: number | null;
  error: string | null;
  createdAt: string;
}

// ----- API keys vault ----------------------------------------------------

export interface ApiKeysBinanceStatus {
  hasKeys: boolean;
  exchange: 'binance';
  apiKeyMask?: string;
  testedAt?: string | null;
  lastTestStatus?: 'ok' | 'invalid_key' | 'network_error' | 'decrypt_failed' | null;
  lastTestMessage?: string | null;
  updatedAt?: string;
  canTrade?: boolean;
  balanceCount?: number;
}

// ----- 2FA ---------------------------------------------------------------

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

export interface TwoFactorSetup {
  otpauthUrl: string;
  secret: string;
  issuer: string;
}

export interface TwoFactorEnableResult {
  enabled: boolean;
  backupCodes?: string[];
}

// ----- Misc auth ---------------------------------------------------------

export interface AuthUser {
  id: number | string;
  emailOrPhone?: string;
  twoFactorEnabled?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  requires2FA?: boolean;
  message?: string;
}
