import { describe, expect, it } from "vitest";
import { PriceEngine } from "../src/services/price-engine";
import type { TickerDefinition } from "../src/types";

describe("PriceEngine", () => {
  it("produces non-negative prices for all symbols", () => {
    const engine = new PriceEngine();

    for (let i = 0; i < 100; i += 1) {
      const snapshot = engine.tick(() => 0.99);
      for (const ticker of snapshot) {
        expect(ticker.price).toBeGreaterThan(0);
      }
    }
  });

  it("changes prices when ticks are applied", () => {
    const engine = new PriceEngine();
    const before = engine.getSnapshot().map((ticker) => ticker.price);
    const after = engine.tick(() => 0.9).map((ticker) => ticker.price);

    expect(after).not.toEqual(before);
  });

  it("computes day change from previous close", () => {
    const definitions: TickerDefinition[] = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        assetClass: "equity",
        basePrice: 110,
        previousClose: 100,
        volatilityBps: 100
      }
    ];
    const engine = new PriceEngine(definitions);
    const [ticker] = engine.getSnapshot();

    expect(ticker.price).toBe(110);
    expect(ticker.changeReferenceLabel).toBe("previous_close");
    expect(ticker.changeReferencePrice).toBe(100);
    expect(ticker.changeAmount).toBe(10);
    expect(ticker.changePercent).toBe(10);
  });

  it("uses the UTC-midnight reference for crypto and resets on a new UTC day", () => {
    const definitions: TickerDefinition[] = [
      {
        symbol: "BTC-USD",
        name: "Bitcoin",
        assetClass: "crypto",
        basePrice: 62000,
        previousClose: 60850,
        volatilityBps: 100
      }
    ];
    let now = Date.UTC(2026, 4, 11, 10, 30, 0);
    const engine = new PriceEngine(definitions, () => now);

    const [firstTicker] = engine.getSnapshot();
    expect(firstTicker.changeReferenceLabel).toBe("utc_midnight");
    expect(firstTicker.changeReferencePrice).toBe(62000);
    expect(firstTicker.changePercent).toBe(0);

    const [secondTicker] = engine.tick(() => 0.75);
    expect(secondTicker.changeReferencePrice).toBe(62000);
    expect(secondTicker.changePercent).toBeGreaterThan(0);

    now = Date.UTC(2026, 4, 12, 0, 5, 0);
    const [rolledTicker] = engine.tick(() => 0.75);
    expect(rolledTicker.changeReferenceLabel).toBe("utc_midnight");
    expect(rolledTicker.changeReferencePrice).toBe(secondTicker.price);
    expect(rolledTicker.changeAmount).toBeGreaterThan(0);
    expect(rolledTicker.changePercent).toBeGreaterThan(0);
  });
});
