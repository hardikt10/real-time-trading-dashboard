import { TICKERS } from "../constants/tickers";
import { LiveTicker, TickerDefinition, TickerSymbol } from "../types";

const clampMinPrice = (value: number): number => Math.max(0.01, value);
const round2 = (value: number): number => Math.round(value * 100) / 100;
const getUtcDayKey = (timestampMs: number): string => new Date(timestampMs).toISOString().slice(0, 10);

export class PriceEngine {
  private readonly definitions: TickerDefinition[];
  private readonly nowProvider: () => number;
  private readonly prices = new Map<TickerSymbol, number>();
  private readonly dailyReferencePrices = new Map<TickerSymbol, number>();
  private readonly dailyReferenceDayKeys = new Map<TickerSymbol, string>();

  constructor(definitions: TickerDefinition[] = TICKERS, nowProvider: () => number = Date.now) {
    this.definitions = definitions;
    this.nowProvider = nowProvider;
    const initialDayKey = getUtcDayKey(this.nowProvider());

    for (const ticker of definitions) {
      this.prices.set(ticker.symbol, ticker.basePrice);

      if (ticker.assetClass === "crypto") {
        this.dailyReferencePrices.set(ticker.symbol, ticker.basePrice);
        this.dailyReferenceDayKeys.set(ticker.symbol, initialDayKey);
      }
    }
  }

  private syncCryptoDailyReference(
    ticker: TickerDefinition,
    currentPrice: number,
    nowMs: number
  ): number {
    const currentDayKey = getUtcDayKey(nowMs);
    const trackedDayKey = this.dailyReferenceDayKeys.get(ticker.symbol);

    if (trackedDayKey !== currentDayKey) {
      this.dailyReferenceDayKeys.set(ticker.symbol, currentDayKey);
      this.dailyReferencePrices.set(ticker.symbol, currentPrice);
    }

    return this.dailyReferencePrices.get(ticker.symbol) ?? currentPrice;
  }

  private getChangeReference(
    ticker: TickerDefinition,
    currentPrice: number,
    nowMs: number
  ): { label: "previous_close" | "utc_midnight"; price: number } {
    if (ticker.assetClass !== "crypto") {
      return {
        label: "previous_close",
        price: ticker.previousClose
      };
    }

    return {
      label: "utc_midnight",
      price: this.syncCryptoDailyReference(ticker, currentPrice, nowMs)
    };
  }

  getSnapshot(): LiveTicker[] {
    const nowMs = this.nowProvider();

    return this.definitions.map((ticker) => {
      const currentPrice = this.prices.get(ticker.symbol) ?? ticker.basePrice;
      const changeReference = this.getChangeReference(ticker, currentPrice, nowMs);
      const changeAmount = currentPrice - changeReference.price;
      const changePercent =
        changeReference.price > 0 ? (changeAmount / changeReference.price) * 100 : 0;

      return {
        symbol: ticker.symbol,
        name: ticker.name,
        assetClass: ticker.assetClass,
        price: round2(currentPrice),
        changeReferencePrice: round2(changeReference.price),
        changeReferenceLabel: changeReference.label,
        changeAmount: round2(changeAmount),
        changePercent: round2(changePercent),
        updatedAt: new Date(nowMs).toISOString()
      };
    });
  }

  tick(random: () => number = Math.random): LiveTicker[] {
    const nowMs = this.nowProvider();

    for (const ticker of this.definitions) {
      const currentPrice = this.prices.get(ticker.symbol) ?? ticker.basePrice;

      if (ticker.assetClass === "crypto") {
        this.syncCryptoDailyReference(ticker, currentPrice, nowMs);
      }

      const amplitude = ticker.volatilityBps / 10_000;
      const movementFactor = (random() - 0.5) * 2 * amplitude;
      const nextPrice = clampMinPrice(currentPrice * (1 + movementFactor));
      this.prices.set(ticker.symbol, nextPrice);
    }

    return this.getSnapshot();
  }

  getCurrentPrice(symbol: TickerSymbol): number {
    const definition = this.definitions.find((ticker) => ticker.symbol === symbol);
    if (!definition) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }
    return this.prices.get(symbol) ?? definition.basePrice;
  }
}
