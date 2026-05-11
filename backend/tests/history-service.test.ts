import { describe, expect, it } from "vitest";
import { HistoryService } from "../src/services/history-service";

describe("HistoryService", () => {
  it("returns expected number of data points", () => {
    const service = new HistoryService();
    const history = service.generateHistory("AAPL", 190, 120, "1m", () => 0.45);

    expect(history).toHaveLength(120);
  });

  it("returns chronologically increasing timestamps", () => {
    const service = new HistoryService();
    const history = service.generateHistory("BTC-USD", 62000, 20, "5m", () => 0.51);

    for (let i = 1; i < history.length; i += 1) {
      const previous = new Date(history[i - 1].timestamp).getTime();
      const current = new Date(history[i].timestamp).getTime();
      expect(current).toBeGreaterThan(previous);
    }
  });

  it("preserves valid OHLC relationships", () => {
    const service = new HistoryService();
    const history = service.generateHistory("ETH-USD", 3200, 80, "1m", () => 0.5);

    history.forEach((candle) => {
      expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
      expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
    });
  });

  it("keeps close prices close to current price baseline", () => {
    const service = new HistoryService();
    const history = service.generateHistory("ETH-USD", 3200, 80, "1m", () => 0.5);
    const avgClose = history.reduce((sum, candle) => sum + candle.close, 0) / history.length;

    expect(Math.abs(avgClose - 3200)).toBeLessThan(200);
    expect(history.at(-1)?.close).toBe(3200);
  });

  it("returns cached history within ttl for same query", () => {
    const service = new HistoryService();
    const first = service.generateHistory("AAPL", 190, 30, "1m", () => 0.1);
    const second = service.generateHistory("AAPL", 190, 30, "1m", () => 0.9);

    expect(second).toEqual(first);
  });

  it("keeps cached history stable within the same interval bucket", () => {
    let now = Date.UTC(2026, 4, 9, 12, 1, 10);
    const service = new HistoryService(undefined, () => now);
    const initialSeries = service.getHistory("MSFT", 425, 20, "5m", () => 0.4);

    now = Date.UTC(2026, 4, 9, 12, 4, 50);
    const cachedSeries = service.getHistory("MSFT", 450, 20, "5m", () => 0.6);

    expect(cachedSeries.cached).toBe(true);
    expect(cachedSeries.data).toEqual(initialSeries.data);
  });

  it("regenerates history after the interval boundary passes", () => {
    let now = Date.UTC(2026, 4, 9, 12, 4, 50);
    const service = new HistoryService(undefined, () => now);
    const initialSeries = service.getHistory("MSFT", 425, 20, "5m", () => 0.4);

    now = Date.UTC(2026, 4, 9, 12, 5, 1);
    const refreshedSeries = service.getHistory("MSFT", 450, 20, "5m", () => 0.6);

    expect(refreshedSeries.cached).toBe(false);
    expect(refreshedSeries.data).not.toEqual(initialSeries.data);
    expect(refreshedSeries.data.at(-1)?.timestamp).not.toBe(initialSeries.data.at(-1)?.timestamp);
  });

  it("aligns generated candles to the requested interval boundaries", () => {
    const now = Date.UTC(2026, 4, 9, 12, 37, 42);
    const service = new HistoryService(undefined, () => now);
    const intervals = [
      { expectedMinutes: 1, value: "1m" as const },
      { expectedMinutes: 5, value: "5m" as const },
      { expectedMinutes: 15, value: "15m" as const },
      { expectedMinutes: 60, value: "1h" as const }
    ];

    intervals.forEach(({ expectedMinutes, value }) => {
      const series = service.getHistory("AAPL", 190, 4, value, () => 0.5);

      series.data.forEach((candle, index) => {
        const timestamp = new Date(candle.timestamp);
        expect(timestamp.getUTCSeconds()).toBe(0);
        expect(timestamp.getUTCMilliseconds()).toBe(0);

        if (expectedMinutes === 60) {
          expect(timestamp.getUTCMinutes()).toBe(0);
          return;
        }

        expect(timestamp.getUTCMinutes() % expectedMinutes).toBe(0);

        if (index > 0) {
          const previous = new Date(series.data[index - 1].timestamp).getTime();
          const current = timestamp.getTime();
          expect(current - previous).toBe(expectedMinutes * 60_000);
        }
      });
    });
  });
});
