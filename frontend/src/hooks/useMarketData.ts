import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import { DEFAULT_TICKER_SYMBOLS } from "../constants";
import type {
  HistoryCandle,
  HistoryInterval,
  HistoryResponse,
  LiveTicker,
  MarketEvent,
  SubscribeMessage,
  TickerSymbol,
  TickersResponse
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

const DEFAULT_SYMBOL: TickerSymbol = "AAPL";
const MAX_HISTORY_POINTS = 120;
const HISTORY_POINTS = 90;
const MINUTES_MS = 60_000;

type WsStatus = "connecting" | "connected" | "disconnected";

interface UseMarketDataOptions {
  onUnauthorized?: (message?: string) => void;
}

interface CachedHistorySnapshot {
  cached: boolean;
  data: HistoryCandle[];
  expiresAt: number;
  fetchedAt: number;
  generatedAt: string;
}

const historyCache = new Map<string, CachedHistorySnapshot>();

const getIntervalMs = (interval: HistoryInterval): number => {
  switch (interval) {
    case "5m":
      return 5 * MINUTES_MS;
    case "15m":
      return 15 * MINUTES_MS;
    case "1h":
      return 60 * MINUTES_MS;
    case "1m":
    default:
      return MINUTES_MS;
  }
};

const getHistoryCacheExpiry = (timestampMs: number, interval: HistoryInterval): number => {
  const intervalMs = getIntervalMs(interval);
  return Math.floor(timestampMs / intervalMs) * intervalMs + intervalMs;
};

const getHistoryCacheKey = (symbol: TickerSymbol, interval: HistoryInterval): string =>
  `${symbol}:${interval}:${HISTORY_POINTS}`;

const toIntervalBucketTimestamp = (timestamp: string, interval: string): string => {
  const date = new Date(timestamp);
  const intervalAmount = Number.parseInt(interval, 10);

  if (interval.endsWith("m")) {
    const nextMinuteBucket = Math.floor(date.getUTCMinutes() / intervalAmount) * intervalAmount;
    date.setUTCMinutes(nextMinuteBucket, 0, 0);
    return date.toISOString();
  }
  if (interval.endsWith("h")) {
    const nextHourBucket = Math.floor(date.getUTCHours() / intervalAmount) * intervalAmount;
    date.setUTCHours(nextHourBucket, 0, 0, 0);
    return date.toISOString();
  }
  return timestamp;
};

const createCandleFromPrice = (timestamp: string, price: number): HistoryCandle => ({
  timestamp,
  open: price,
  high: price,
  low: price,
  close: price
});

const replaceOrAppendCandle = (
  previous: HistoryCandle[],
  candle: HistoryCandle
): HistoryCandle[] => {
  if (previous.length === 0) {
    return [candle];
  }

  const nextHistory = [...previous];
  const existingIndex = nextHistory.findIndex((point) => point.timestamp === candle.timestamp);

  if (existingIndex >= 0) {
    nextHistory[existingIndex] = candle;
    return nextHistory;
  }

  nextHistory.push(candle);
  return nextHistory.slice(-MAX_HISTORY_POINTS);
};

const fetchWithSession = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, {
    ...init,
    credentials: "include"
  });

export const useMarketData = ({ onUnauthorized }: UseMarketDataOptions = {}) => {
  const [tickers, setTickers] = useState<LiveTicker[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<TickerSymbol>(DEFAULT_SYMBOL);
  const [history, setHistory] = useState<HistoryCandle[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<HistoryInterval>("1m");
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const [lastTickAt, setLastTickAt] = useState<string | null>(null);
  const [isHistoryCached, setIsHistoryCached] = useState(false);
  const [historyGeneratedAt, setHistoryGeneratedAt] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const selectedSymbolRef = useRef(selectedSymbol);
  const selectedIntervalRef = useRef(selectedInterval);
  const pendingCandleRef = useRef<HistoryCandle | null>(null);
  const tickersRef = useRef<LiveTicker[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
  }, [selectedSymbol]);

  useEffect(() => {
    selectedIntervalRef.current = selectedInterval;
  }, [selectedInterval]);

  useEffect(() => {
    pendingCandleRef.current = null;
  }, [selectedInterval, selectedSymbol]);

  const handleUnauthorized = useEffectEvent(
    (message = "Your demo session expired. Please sign in again.") => {
      setApiError(message);
      onUnauthorized?.(message);
    }
  );

  const applyHistorySnapshot = useEffectEvent((snapshot: CachedHistorySnapshot | HistoryResponse) => {
    setHistory(snapshot.data);
    pendingCandleRef.current = snapshot.data.at(-1)
      ? { ...snapshot.data[snapshot.data.length - 1] }
      : null;
    setIsHistoryCached(snapshot.cached);
    setHistoryGeneratedAt(snapshot.generatedAt);
    setApiError(null);
  });

  const sendSubscription = useEffectEvent((symbols: TickerSymbol[]) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload: SubscribeMessage = {
      type: "subscribe",
      symbols
    };

    socketRef.current.send(JSON.stringify(payload));
  });

  const applyTickUpdate = useEffectEvent((nextTickers: LiveTicker[], generatedAt: string) => {
    tickersRef.current = nextTickers;
    startTransition(() => {
      setTickers(nextTickers);
    });
    setLastTickAt(generatedAt);

    const selectedTicker = nextTickers.find(
      (ticker) => ticker.symbol === selectedSymbolRef.current
    );
    if (!selectedTicker) {
      return;
    }

    setHistory((previous) => {
      const activeInterval = selectedIntervalRef.current;
      const bucketTimestamp = toIntervalBucketTimestamp(selectedTicker.updatedAt, activeInterval);
      const nextPrice = selectedTicker.price;
      const pendingCandle = pendingCandleRef.current;

      if (!pendingCandle) {
        const lastVisibleCandle = previous.at(-1);

        if (lastVisibleCandle && lastVisibleCandle.timestamp === bucketTimestamp) {
          pendingCandleRef.current = {
            ...lastVisibleCandle,
            high: Math.max(lastVisibleCandle.high, nextPrice),
            low: Math.min(lastVisibleCandle.low, nextPrice),
            close: nextPrice
          };
          return previous;
        }

        const nextPendingCandle = createCandleFromPrice(bucketTimestamp, nextPrice);
        pendingCandleRef.current = nextPendingCandle;
        return previous.length === 0 ? [nextPendingCandle] : previous;
      }

      if (pendingCandle.timestamp === bucketTimestamp) {
        pendingCandleRef.current = {
          ...pendingCandle,
          high: Math.max(pendingCandle.high, nextPrice),
          low: Math.min(pendingCandle.low, nextPrice),
          close: nextPrice
        };
        return previous;
      }

      const finalizedCandle = pendingCandle;
      const nextPendingCandle = createCandleFromPrice(bucketTimestamp, nextPrice);
      pendingCandleRef.current = nextPendingCandle;

      const withFinalizedCandle = replaceOrAppendCandle(previous, finalizedCandle);
      return replaceOrAppendCandle(withFinalizedCandle, nextPendingCandle);
    });
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrapMarket = async () => {
      try {
        const response = await fetchWithSession(`${API_BASE}/tickers`);
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch tickers.");
        }

        const payload = (await response.json()) as TickersResponse;
        if (cancelled) {
          return;
        }

        tickersRef.current = payload.data;
        startTransition(() => {
          setTickers(payload.data);
        });
        setLastTickAt(payload.data[0]?.updatedAt ?? null);
        setApiError(null);
        setSelectedSymbol((currentSymbol) =>
          payload.data.some((ticker) => ticker.symbol === currentSymbol)
            ? currentSymbol
            : (payload.data[0]?.symbol ?? currentSymbol)
        );
        sendSubscription(payload.data.map((ticker) => ticker.symbol) as TickerSymbol[]);
      } catch (requestError) {
        if (!cancelled) {
          setApiError(requestError instanceof Error ? requestError.message : "Unknown error");
        }
      }
    };

    void bootstrapMarket();

    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const cacheKey = getHistoryCacheKey(selectedSymbol, selectedInterval);
    const cachedSnapshot = historyCache.get(cacheKey);

    if (cachedSnapshot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      applyHistorySnapshot({
        ...cachedSnapshot,
        cached: true
      });
    }

    if (cachedSnapshot && cachedSnapshot.expiresAt > Date.now()) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const loadHistory = async () => {
      try {
        const response = await fetchWithSession(
          `${API_BASE}/tickers/${selectedSymbol}/history?points=${HISTORY_POINTS}&interval=${selectedInterval}`,
          {
            signal: controller.signal
          }
        );

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch historical data.");
        }

        const payload = (await response.json()) as HistoryResponse;
        if (cancelled) {
          return;
        }

        historyCache.set(cacheKey, {
          cached: payload.cached,
          data: payload.data.map((point) => ({ ...point })),
          expiresAt: getHistoryCacheExpiry(Date.now(), selectedInterval),
          fetchedAt: Date.now(),
          generatedAt: payload.generatedAt
        });

        applyHistorySnapshot(payload);
      } catch (requestError) {
        if (!cancelled && !controller.signal.aborted) {
          setApiError(requestError instanceof Error ? requestError.message : "Unknown error");
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedInterval, selectedSymbol]);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) {
        return;
      }

      setWsStatus("connecting");
      const socket = new WebSocket(new URL(WS_URL, window.location.origin).toString());
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          return;
        }

        setWsStatus("connected");
        setWsError(null);
        sendSubscription(
          (tickersRef.current.length > 0
            ? tickersRef.current.map((ticker) => ticker.symbol)
            : DEFAULT_TICKER_SYMBOLS) as TickerSymbol[]
        );
      };

      socket.onclose = (event) => {
        if (cancelled) {
          return;
        }

        socketRef.current = null;

        if (event.code === 4401) {
          setWsStatus("disconnected");
          setWsError("The live stream session expired.");
          handleUnauthorized();
          return;
        }

        setWsStatus("disconnected");
        setWsError("Live stream disconnected. Retrying...");
        reconnectTimer = setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        if (cancelled) {
          return;
        }

        setWsError("Live stream connection failed. Retrying...");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as MarketEvent;

          if (payload.type === "tick") {
            applyTickUpdate(payload.data, payload.meta.generatedAt);
            return;
          }

          if (payload.type === "welcome") {
            sendSubscription(
              (tickersRef.current.length > 0
                ? tickersRef.current.map((ticker) => ticker.symbol)
                : payload.data.availableSymbols) as TickerSymbol[]
            );
            return;
          }

          if (payload.type === "error") {
            setWsError(payload.error);
          }
        } catch {
          setWsError("Received malformed live stream payload.");
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  return {
    tickers,
    history,
    selectedInterval,
    setSelectedInterval,
    historyGeneratedAt,
    isHistoryCached,
    selectedSymbol,
    setSelectedSymbol,
    lastTickAt,
    wsStatus,
    error: apiError ?? wsError
  };
};
