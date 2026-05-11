import { TICKERS } from "../constants/tickers";
import { HistoryInterval, TickerSymbol } from "../types";

const knownSymbols = new Set<TickerSymbol>(TICKERS.map(({ symbol }) => symbol));
const historyIntervals = new Set<HistoryInterval>(["1m", "5m", "15m", "1h"]);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const parseTickerSymbol = (value: unknown): TickerSymbol | null => {
  if (typeof value !== "string") {
    return null;
  }

  return knownSymbols.has(value as TickerSymbol) ? (value as TickerSymbol) : null;
};

export const parseTickerSymbols = (values: unknown): TickerSymbol[] | null => {
  if (!Array.isArray(values)) {
    return null;
  }

  const parsedSymbols = values
    .map((value) => parseTickerSymbol(value))
    .filter((value): value is TickerSymbol => value !== null);

  return [...new Set(parsedSymbols)];
};

export const parseHistoryInterval = (
  value: unknown,
  fallback: HistoryInterval = "1m"
): HistoryInterval => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim() as HistoryInterval;
  return historyIntervals.has(normalizedValue) ? normalizedValue : fallback;
};

export const parseHistoryPoints = (value: unknown, fallback = 90): number => {
  const numericValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clamp(Math.trunc(numericValue), 5, 500);
};
