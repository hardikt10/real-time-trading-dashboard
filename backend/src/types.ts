export type TickerSymbol = "AAPL" | "TSLA" | "BTC-USD" | "ETH-USD" | "MSFT";
export type HistoryInterval = "1m" | "5m" | "15m" | "1h";
export type AuthRole = "trader" | "analyst";

export interface TickerDefinition {
  symbol: TickerSymbol;
  name: string;
  assetClass: "equity" | "crypto";
  basePrice: number;
  previousClose: number;
  volatilityBps: number;
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

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface HistoricalSeries {
  data: HistoricalCandle[];
  cached: boolean;
  generatedAt: string;
  interval: HistoryInterval;
  points: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface WebSocketSubscribeMessage {
  type: "subscribe";
  symbols?: TickerSymbol[];
}

export interface WebSocketPingMessage {
  type: "ping";
}

export type WebSocketClientMessage = WebSocketSubscribeMessage | WebSocketPingMessage;
