import { TICKERS } from "../constants/tickers";
import { LiveTicker, TickerDefinition, TickerSymbol } from "../types";

const clampMinPrice = (value: number): number => Math.max(0.01, value);
const round2 = (value: number): number => Math.round(value * 100) / 100;

export class PriceEngine {
  private readonly definitions: TickerDefinition[];
  private readonly prices = new Map<TickerSymbol, number>();

  constructor(definitions: TickerDefinition[] = TICKERS) {
    this.definitions = definitions;
    for (const ticker of definitions) {
      this.prices.set(ticker.symbol, ticker.basePrice);
    }
  }

  getSnapshot(): LiveTicker[] {
    return this.definitions.map((ticker) => {
      const currentPrice = this.prices.get(ticker.symbol) ?? ticker.basePrice;
      const changePercent = ((currentPrice - ticker.basePrice) / ticker.basePrice) * 100;

      return {
        symbol: ticker.symbol,
        name: ticker.name,
        assetClass: ticker.assetClass,
        price: round2(currentPrice),
        changePercent: round2(changePercent),
        updatedAt: new Date().toISOString()
      };
    });
  }

  tick(random: () => number = Math.random): LiveTicker[] {
    for (const ticker of this.definitions) {
      const currentPrice = this.prices.get(ticker.symbol) ?? ticker.basePrice;
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
