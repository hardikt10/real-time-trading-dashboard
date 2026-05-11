export type TickerSymbol = "AAPL" | "TSLA" | "BTC-USD" | "ETH-USD" | "MSFT";
export type HistoryInterval = "1m" | "5m" | "15m" | "1h";
export type AuthRole = "trader" | "analyst";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
}

export interface AuthResponse {
  expiresAt: string;
  user: AuthUser;
}

export interface LiveTicker {
  symbol: TickerSymbol;
  name: string;
  assetClass: "equity" | "crypto";
  price: number;
  changeReferencePrice: number;
  changeReferenceLabel: "previous_close" | "utc_midnight";
  changeAmount: number;
  changePercent: number;
  updatedAt: string;
}

export interface HistoryCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TickersResponse {
  data: LiveTicker[];
}

export interface HistoryResponse {
  symbol: TickerSymbol;
  interval: HistoryInterval;
  points: number;
  cached: boolean;
  generatedAt: string;
  data: HistoryCandle[];
}

export interface TickEvent {
  type: "tick";
  data: LiveTicker[];
  meta: {
    sequence: number;
    generatedAt: string;
  };
}

export interface WelcomeEvent {
  type: "welcome";
  data: {
    user: AuthUser;
    availableSymbols: TickerSymbol[];
    heartbeatMs: number;
    updateIntervalMs: number;
  };
}

export interface SubscribedEvent {
  type: "subscribed";
  data: {
    symbols: TickerSymbol[];
  };
}

export interface ErrorEvent {
  type: "error";
  error: string;
}

export interface PongEvent {
  type: "pong";
  data: {
    receivedAt: string;
  };
}

export type MarketEvent = TickEvent | WelcomeEvent | SubscribedEvent | ErrorEvent | PongEvent;

export interface SubscribeMessage {
  type: "subscribe";
  symbols?: TickerSymbol[];
}

export interface PriceAlertRule {
  enabled: boolean;
  threshold: string;
  triggeredAt: string | null;
}

export type PriceAlertNotificationKind = "set" | "triggered";

export interface PriceAlertNotification {
  id: string;
  kind: PriceAlertNotificationKind;
  message: string;
  symbol: TickerSymbol;
  triggeredAt: string;
}
