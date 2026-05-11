import { RawData } from "ws";
import { LiveTicker, TickerSymbol, WebSocketClientMessage } from "../types";
import { parseTickerSymbols } from "../utils/market";

export type ClientSubscription = Set<TickerSymbol> | null;

interface ValidClientMessage {
  ok: true;
  message: WebSocketClientMessage;
}

interface InvalidClientMessage {
  ok: false;
  error: string;
}

export type ParsedClientMessage = ValidClientMessage | InvalidClientMessage;

export const STREAM_PATH = "/ws";
export const STREAM_UPDATE_INTERVAL_MS = 1_000;
export const STREAM_HEARTBEAT_MS = 15_000;

export const parseClientMessage = (rawMessage: RawData): ParsedClientMessage => {
  try {
    const payload = JSON.parse(rawMessage.toString()) as
      | { type?: unknown; symbols?: unknown }
      | null;

    if (!payload || typeof payload !== "object") {
      return { ok: false, error: "WebSocket payload must be a JSON object." };
    }

    if (payload.type === "ping") {
      return { ok: true, message: { type: "ping" } };
    }

    if (payload.type !== "subscribe") {
      return { ok: false, error: "Unsupported WebSocket message type." };
    }

    if (payload.symbols === undefined) {
      return { ok: true, message: { type: "subscribe" } };
    }

    const symbols = parseTickerSymbols(payload.symbols);
    if (!symbols || symbols.length === 0) {
      return { ok: false, error: "Subscription requires at least one valid ticker symbol." };
    }

    return { ok: true, message: { type: "subscribe", symbols } };
  } catch {
    return { ok: false, error: "Malformed WebSocket payload." };
  }
};

export const filterSnapshotBySubscription = (
  snapshot: LiveTicker[],
  subscription: ClientSubscription
): LiveTicker[] => {
  if (!subscription || subscription.size === 0) {
    return snapshot;
  }

  return snapshot.filter(({ symbol }) => subscription.has(symbol));
};
