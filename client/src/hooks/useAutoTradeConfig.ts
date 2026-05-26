import { useCallback, useEffect, useState } from 'react';

import autoTradeService from '../services/autoTradeService';
import type {
  AutoTradeConfig,
  StrategyPreset,
  WebhookEventId,
} from '../types';

const LOCAL_PRESETS: StrategyPreset[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Tight stops, small positions, high-confidence-only signals.',
    config: {
      maxPositionUsd: 100, dailyLossLimitUsd: 25, stopLossPct: 1.5, takeProfitPct: 3,
      minConfidence: 'high', allowedSymbols: ['BTC', 'ETH'],
    },
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced risk and reward. Most users start here.',
    config: {
      maxPositionUsd: 500, dailyLossLimitUsd: 100, stopLossPct: 2, takeProfitPct: 4,
      minConfidence: 'medium', allowedSymbols: ['BTC', 'ETH', 'SOL', 'BNB'],
    },
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Larger positions, looser stops, takes lower-confidence signals.',
    config: {
      maxPositionUsd: 2000, dailyLossLimitUsd: 500, stopLossPct: 3, takeProfitPct: 6,
      minConfidence: 'low', allowedSymbols: ['BTC', 'ETH', 'SOL', 'BNB', 'ATOM'],
    },
  },
];

const STORAGE_KEY = 'qc.autotrade.config.v1';

export const WEBHOOK_EVENTS: { id: WebhookEventId; label: string }[] = [
  { id: 'kill_switch_engaged',  label: 'Kill switch engaged' },
  { id: 'daily_loss_limit_hit', label: 'Daily loss limit hit' },
  { id: 'live_order_filled',    label: 'Live order filled' },
  { id: 'live_order_failed',    label: 'Live order failed' },
];

export const DEFAULT_AUTOTRADE: AutoTradeConfig = {
  enabled: false,
  mode: 'dry-run',
  maxPositionUsd: 500,
  dailyLossLimitUsd: 100,
  stopLossPct: 2.0,
  takeProfitPct: 4.0,
  minConfidence: 'high',
  allowedSymbols: ['BTC', 'ETH'],
  killSwitchTriggered: false,
  webhookUrl: '',
  webhookEvents: null,
};

const loadLocal = (): AutoTradeConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUTOTRADE;
    return { ...DEFAULT_AUTOTRADE, ...(JSON.parse(raw) as Partial<AutoTradeConfig>) };
  } catch {
    return DEFAULT_AUTOTRADE;
  }
};

export interface UseAutoTradeConfig {
  config: AutoTradeConfig;
  synced: boolean;
  saving: boolean;
  error: string | null;
  presets: StrategyPreset[];
  update: (patch: Partial<AutoTradeConfig>) => Promise<void>;
  engageKill: (reason?: string) => Promise<void>;
  clearKill: () => Promise<void>;
  acknowledgeLiveAndEnable: (password: string) => Promise<AutoTradeConfig | null>;
  applyPreset: (presetId: string) => Promise<StrategyPreset | null>;
}

/**
 * Auto-trade config storage that prefers the server when the user is authed
 * and gracefully falls back to localStorage otherwise. The same surface
 * (config + update / engageKill / clearKill) is exposed to the page regardless.
 */
export default function useAutoTradeConfig(): UseAutoTradeConfig {
  const [config, setConfig] = useState<AutoTradeConfig>(loadLocal);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<StrategyPreset[]>(LOCAL_PRESETS);

  useEffect(() => {
    let alive = true;
    autoTradeService
      .getConfig()
      .then((data) => {
        if (!alive || !data) return;
        setConfig((prev) => ({ ...prev, ...data }));
        setSynced(true);
      })
      .catch((err: Error) => { if (alive) setError(err.message); });
    autoTradeService.getPresets().then((p) => {
      if (alive && Array.isArray(p) && p.length) setPresets(p);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const update = useCallback(
    async (patch: Partial<AutoTradeConfig>) => {
      setConfig((prev) => ({ ...prev, ...patch }));
      if (!synced) return;
      setSaving(true);
      try {
        const updated = await autoTradeService.updateConfig(patch);
        if (updated) setConfig((prev) => ({ ...prev, ...updated }));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [synced]
  );

  const engageKill = useCallback(
    async (reason?: string) => {
      setConfig((prev) => ({
        ...prev,
        enabled: false,
        killSwitchTriggered: true,
        killSwitchAt: new Date().toISOString(),
        killSwitchReason: reason || 'User triggered kill switch',
      }));
      if (!synced) return;
      const data = await autoTradeService.engageKillSwitch(reason);
      if (data) setConfig((prev) => ({ ...prev, ...data }));
    },
    [synced]
  );

  const clearKill = useCallback(async () => {
    setConfig((prev) => ({
      ...prev,
      killSwitchTriggered: false,
      killSwitchAt: null,
      killSwitchReason: null,
    }));
    if (!synced) return;
    const data = await autoTradeService.clearKillSwitch();
    if (data) setConfig((prev) => ({ ...prev, ...data }));
  }, [synced]);

  const acknowledgeLiveAndEnable = useCallback(async (password: string) => {
    const acked = await autoTradeService.acknowledgeLive(password);
    if (acked) setConfig((prev) => ({ ...prev, ...acked }));
    const updated = await autoTradeService.updateConfig({ mode: 'live' });
    if (updated) setConfig((prev) => ({ ...prev, ...updated }));
    return updated;
  }, []);

  const applyPreset = useCallback(
    async (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return null;
      await update(preset.config);
      return preset;
    },
    [presets, update]
  );

  return {
    config, synced, saving, error, presets,
    update, engageKill, clearKill,
    acknowledgeLiveAndEnable, applyPreset,
  };
}
