import { describe, expect, it } from "vitest";
import {
  filterSnapshotBySubscription,
  parseClientMessage
} from "../src/websocket/protocol";
import { PriceEngine } from "../src/services/price-engine";

describe("websocket protocol", () => {
  it("accepts subscribe messages with valid symbols", () => {
    const result = parseClientMessage(JSON.stringify({ type: "subscribe", symbols: ["AAPL"] }));

    expect(result).toEqual({
      ok: true,
      message: { type: "subscribe", symbols: ["AAPL"] }
    });
  });

  it("rejects subscribe messages without valid symbols", () => {
    const result = parseClientMessage(
      JSON.stringify({ type: "subscribe", symbols: ["INVALID"] })
    );

    expect(result).toEqual({
      ok: false,
      error: "Subscription requires at least one valid ticker symbol."
    });
  });

  it("filters snapshots to the active subscription", () => {
    const snapshot = new PriceEngine().getSnapshot();
    const filteredSnapshot = filterSnapshotBySubscription(snapshot, new Set(["BTC-USD"]));

    expect(filteredSnapshot).toHaveLength(1);
    expect(filteredSnapshot[0]?.symbol).toBe("BTC-USD");
  });
});
