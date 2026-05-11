import { TICKERS } from "../constants/tickers";
import {
  HistoricalCandle,
  HistoricalSeries,
  HistoryInterval,
  TickerDefinition,
  TickerSymbol
} from "../types";
import { parseHistoryInterval, parseHistoryPoints } from "../utils/market";

const MINUTES_MS = 60_000;

const round2 = (value: number): number => Math.round(value * 100) / 100;

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

const alignTimestampToInterval = (timestampMs: number, interval: HistoryInterval): number => {
  const intervalMs = getIntervalMs(interval);
  return Math.floor(timestampMs / intervalMs) * intervalMs;
};

export class HistoryService {
  private readonly definitions: TickerDefinition[];
  private readonly nowProvider: () => number;
  private readonly cache = new Map<
    string,
    { expiresAt: number; generatedAt: string; data: HistoricalCandle[] }
  >();

  constructor(definitions: TickerDefinition[] = TICKERS, nowProvider: () => number = Date.now) {
    this.definitions = definitions;
    this.nowProvider = nowProvider;
  }

  private getCacheExpiry(timestampMs: number, interval: HistoryInterval): number {
    return alignTimestampToInterval(timestampMs, interval) + getIntervalMs(interval);
  }

  private normalizeCandle(
    timestamp: string,
    open: number,
    high: number,
    low: number,
    close: number
  ): HistoricalCandle {
    const safeOpen = round2(Math.max(0.01, open));
    const safeClose = round2(Math.max(0.01, close));
    const safeHigh = round2(Math.max(high, safeOpen, safeClose));
    const safeLow = round2(Math.max(0.01, Math.min(low, safeOpen, safeClose)));

    return {
      timestamp,
      open: safeOpen,
      high: safeHigh,
      low: safeLow,
      close: safeClose
    };
  }

  private buildHistory(
    symbol: TickerSymbol,
    currentPrice: number,
    points: number,
    interval: HistoryInterval,
    generatedAtMs: number,
    random: () => number = Math.random
  ): HistoricalCandle[] {
    const ticker = this.definitions.find((item) => item.symbol === symbol);
    if (!ticker) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    const history: HistoricalCandle[] = [];
    const amplitude = ticker.volatilityBps / 12_000;
    const intervalMs = getIntervalMs(interval);
    const alignedGeneratedAtMs = alignTimestampToInterval(generatedAtMs, interval);
    let rollingOpen = Math.max(0.01, currentPrice * (1 + (random() - 0.5) * amplitude * 10));

    for (let idx = 0; idx < points; idx += 1) {
      const timestamp = new Date(alignedGeneratedAtMs - (points - 1 - idx) * intervalMs).toISOString();
      const closeDrift = (random() - 0.5) * 2 * amplitude;
      const close = Math.max(0.01, rollingOpen * (1 + closeDrift));
      const bodyHigh = Math.max(rollingOpen, close);
      const bodyLow = Math.min(rollingOpen, close);
      const wickBase = Math.max(bodyHigh - bodyLow, rollingOpen * amplitude * 0.35, 0.05);
      const high = bodyHigh + wickBase * (0.25 + random() * 0.9);
      const low = Math.max(0.01, bodyLow - wickBase * (0.25 + random() * 0.9));

      history.push(this.normalizeCandle(timestamp, rollingOpen, high, low, close));
      rollingOpen = close;
    }

    return history;
  }

  private alignSeriesToCurrentPrice(
    series: HistoricalCandle[],
    currentPrice: number
  ): HistoricalCandle[] {
    const lastPoint = series.at(-1);
    if (!lastPoint) {
      return [];
    }

    const priceOffset = currentPrice - lastPoint.close;
    return series.map((point) =>
      this.normalizeCandle(
        point.timestamp,
        point.open + priceOffset,
        point.high + priceOffset,
        point.low + priceOffset,
        point.close + priceOffset
      )
    );
  }

  getHistory(
    symbol: TickerSymbol,
    currentPrice: number,
    points = 60,
    interval: HistoryInterval = "1m",
    random: () => number = Math.random
  ): HistoricalSeries {
    const normalizedPoints = parseHistoryPoints(points, points);
    const normalizedInterval = parseHistoryInterval(interval, interval);
    const cacheKey = `${symbol}:${normalizedPoints}:${normalizedInterval}`;
    const now = this.nowProvider();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return {
        data: cached.data.map((point) => ({ ...point })),
        cached: true,
        generatedAt: cached.generatedAt,
        interval: normalizedInterval,
        points: cached.data.length
      };
    }

    const generatedAt = new Date(now).toISOString();
    const generatedSeries = this.buildHistory(
      symbol,
      currentPrice,
      normalizedPoints,
      normalizedInterval,
      now,
      random
    );
    const alignedSeries = this.alignSeriesToCurrentPrice(generatedSeries, currentPrice);

    this.cache.set(cacheKey, {
      expiresAt: this.getCacheExpiry(now, normalizedInterval),
      generatedAt,
      data: alignedSeries.map((point) => ({ ...point }))
    });

    return {
      data: alignedSeries.map((point) => ({ ...point })),
      cached: false,
      generatedAt,
      interval: normalizedInterval,
      points: alignedSeries.length
    };
  }

  generateHistory(
    symbol: TickerSymbol,
    currentPrice: number,
    points = 60,
    interval: HistoryInterval = "1m",
    random: () => number = Math.random
  ): HistoricalCandle[] {
    return this.getHistory(symbol, currentPrice, points, interval, random).data;
  }
}
