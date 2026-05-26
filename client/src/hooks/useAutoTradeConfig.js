import { useCallback, useEffect, useState } from 'react';
import autoTradeService from '../services/autoTradeService';

const STORAGE_KEY = 'qc.autotrade.config.v1';

export const DEFAULT_AUTOTRADE = {
  enabled: false,
  mode: 'dry-run',
  maxPositionUsd: 500,
  dailyLossLimitUsd: 100,
  stopLossPct: 2.0,
  takeProfitPct: 4.0,
  minConfidence: 'high',
  allowedSymbols: ['BTC', 'ETH'],
  killSwitchTriggered: false,
};

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUTOTRADE;
    return { ...DEFAULT_AUTOTRADE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUTOTRADE;
  }
};

/**
 * Auto-trade config storage that prefers the server when the user is authed
 * and gracefully falls back to localStorage otherwise. The same surface
 * (config + update / engageKill / clearKill) is exposed to the page regardless.
 */
export default function useAutoTradeConfig() {
  const [config, setConfig] = useState(loadLocal);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    autoTradeService
      .getConfig()
      .then((data) => {
        if (!alive || !data) return;
        setConfig((prev) => ({ ...prev, ...data }));
        setSynced(true);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const update = useCallback(
    async (patch) => {
      setConfig((prev) => ({ ...prev, ...patch }));
      if (!synced) return;
      setSaving(true);
      try {
        const updated = await autoTradeService.updateConfig(patch);
        if (updated) setConfig((prev) => ({ ...prev, ...updated }));
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    },
    [synced]
  );

  const engageKill = useCallback(
    async (reason) => {
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

  /**
   * Acknowledge live trading with the user's password, then atomically flip
   * mode to 'live'. Returns the updated config or throws with the server's
   * structured error code (LIVE_DISABLED_BY_SERVER / API_KEYS_MISSING / …).
   */
  const acknowledgeLiveAndEnable = useCallback(async (password) => {
    const acked = await autoTradeService.acknowledgeLive(password);
    if (acked) setConfig((prev) => ({ ...prev, ...acked }));
    const updated = await autoTradeService.updateConfig({ mode: 'live' });
    if (updated) setConfig((prev) => ({ ...prev, ...updated }));
    return updated;
  }, []);

  return {
    config,
    synced,
    saving,
    error,
    update,
    engageKill,
    clearKill,
    acknowledgeLiveAndEnable,
  };
}
