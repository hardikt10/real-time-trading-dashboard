import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { formatCurrency } from "../lib/formatters";
import type {
  LiveTicker,
  PriceAlertNotification,
  PriceAlertRule,
  TickerSymbol
} from "../types";

const STORAGE_KEY = "trading-dashboard.price-alerts";
const TOAST_LIFETIME_MS = 5_000;
const MAX_TOASTS = 4;

const DEFAULT_RULE: PriceAlertRule = {
  enabled: false,
  threshold: "",
  triggeredAt: null
};

type AlertRuleMap = Partial<Record<TickerSymbol, PriceAlertRule>>;

const readStoredRules = (): AlertRuleMap => {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    return JSON.parse(rawValue) as AlertRuleMap;
  } catch {
    return {};
  }
};

const isValidThreshold = (value: string): boolean => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
};

const scheduleToastDismiss = (
  id: string,
  setNotifications: Dispatch<SetStateAction<PriceAlertNotification[]>>
) => {
  window.setTimeout(() => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  }, TOAST_LIFETIME_MS);
};

const pushToast = (
  setNotifications: Dispatch<SetStateAction<PriceAlertNotification[]>>,
  toast: Omit<PriceAlertNotification, "id"> & { id?: string }
) => {
  const id = toast.id ?? `${toast.symbol}:${toast.kind}:${toast.triggeredAt}`;
  const nextToast: PriceAlertNotification = { ...toast, id };

  setNotifications((previous) => [...previous, nextToast].slice(-MAX_TOASTS));
  scheduleToastDismiss(id, setNotifications);
};

export const usePriceAlerts = (tickers: LiveTicker[]) => {
  const [rulesBySymbol, setRulesBySymbol] = useState<AlertRuleMap>(() => readStoredRules());
  const [notifications, setNotifications] = useState<PriceAlertNotification[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rulesBySymbol));
  }, [rulesBySymbol]);

  const tickerMap = useMemo(
    () =>
      new Map<TickerSymbol, LiveTicker>(
        tickers.map((ticker) => [ticker.symbol, ticker] as const)
      ),
    [tickers]
  );

  useEffect(() => {
    const nextTriggeredTickers = tickers.filter((ticker) => {
      const rule = rulesBySymbol[ticker.symbol];
      if (!rule || !rule.enabled || !isValidThreshold(rule.threshold)) {
        return false;
      }

      return ticker.price >= Number(rule.threshold);
    });

    if (nextTriggeredTickers.length === 0) {
      return;
    }

    const triggeredAt = new Date().toISOString();

    const frameId = window.requestAnimationFrame(() => {
      setRulesBySymbol((previous) => {
        const nextRules = { ...previous };

        nextTriggeredTickers.forEach((ticker) => {
          const existingRule = nextRules[ticker.symbol];
          if (!existingRule) {
            return;
          }

          nextRules[ticker.symbol] = {
            ...existingRule,
            enabled: false,
            triggeredAt
          };
        });

        return nextRules;
      });

      nextTriggeredTickers.forEach((ticker) => {
        pushToast(setNotifications, {
          kind: "triggered",
          message: `${ticker.symbol} reached ${formatCurrency(ticker.price)}.`,
          symbol: ticker.symbol,
          triggeredAt
        });

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState !== "visible"
        ) {
          new Notification(`${ticker.symbol} alert triggered`, {
            body: `${ticker.symbol} is now trading at ${ticker.price.toFixed(2)}.`
          });
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [rulesBySymbol, tickers]);

  const setThreshold = (symbol: TickerSymbol, threshold: string) => {
    setRulesBySymbol((previous) => ({
      ...previous,
      [symbol]: {
        ...(previous[symbol] ?? DEFAULT_RULE),
        threshold,
        enabled: false,
        triggeredAt: null
      }
    }));
  };

  const armAlert = async (symbol: TickerSymbol) => {
    const currentRule = rulesBySymbol[symbol] ?? DEFAULT_RULE;
    if (!isValidThreshold(currentRule.threshold)) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        // In-app notifications remain available if the browser-level permission fails.
      }
    }

    const savedAt = new Date().toISOString();

    setRulesBySymbol((previous) => ({
      ...previous,
      [symbol]: {
        ...(previous[symbol] ?? DEFAULT_RULE),
        enabled: true,
        triggeredAt: null
      }
    }));

    pushToast(setNotifications, {
      kind: "set",
      message: `Watching ${symbol} at ${formatCurrency(Number(currentRule.threshold))}.`,
      symbol,
      triggeredAt: savedAt
    });
  };

  const clearAlert = (symbol: TickerSymbol) => {
    setRulesBySymbol((previous) => ({
      ...previous,
      [symbol]: DEFAULT_RULE
    }));
  };

  const dismissNotification = (id: string) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  };

  const getRule = (symbol: TickerSymbol): PriceAlertRule => rulesBySymbol[symbol] ?? DEFAULT_RULE;

  return {
    armAlert,
    clearAlert,
    dismissNotification,
    getRule,
    notifications,
    setThreshold,
    tickerMap
  };
};
