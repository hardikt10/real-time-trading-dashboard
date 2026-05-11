import { describe, expect, it } from "vitest";
import { PriceEngine } from "../src/services/price-engine";

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
});
