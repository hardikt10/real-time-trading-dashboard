import type { HistoryInterval, TickerSymbol } from "./types";

export const HISTORY_INTERVAL_OPTIONS: Array<{ label: string; value: HistoryInterval }> = [
  { label: "1 Minute", value: "1m" },
  { label: "5 Minutes", value: "5m" },
  { label: "15 Minutes", value: "15m" },
  { label: "1 Hour", value: "1h" }
];

export const DEFAULT_TICKER_SYMBOLS: TickerSymbol[] = [
  "AAPL",
  "TSLA",
  "BTC-USD",
  "ETH-USD",
  "MSFT"
];
