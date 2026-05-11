import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { AuthService } from "../services/auth-service";
import { PriceEngine } from "../services/price-engine";
import {
  ClientSubscription,
  filterSnapshotBySubscription,
  parseClientMessage,
  STREAM_HEARTBEAT_MS,
  STREAM_PATH,
  STREAM_UPDATE_INTERVAL_MS
} from "./protocol";
import { LiveTicker, TickerSymbol } from "../types";
import { getSessionTokenFromUpgradeRequest } from "../utils/auth";

interface TickPayload {
  type: "tick";
  data: LiveTicker[];
  meta: {
    sequence: number;
    generatedAt: string;
  };
}

export const attachPriceStream = (
  server: HttpServer,
  priceEngine: PriceEngine,
  authService: AuthService
): void => {
  const wsServer = new WebSocketServer({ server, path: STREAM_PATH });
  const subscriptions = new Map<WebSocket, ClientSubscription>();
  const availableSymbols = priceEngine.getSnapshot().map(({ symbol }) => symbol);
  let sequence = 0;

  const sendTo = (socket: WebSocket, payload: object): void => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  const sendSnapshot = (
    socket: WebSocket,
    snapshot: LiveTicker[],
    subscription: ClientSubscription
  ): void => {
    const filteredSnapshot = filterSnapshotBySubscription(snapshot, subscription);
    if (filteredSnapshot.length === 0) {
      return;
    }

    const payload: TickPayload = {
      type: "tick",
      data: filteredSnapshot,
      meta: {
        sequence,
        generatedAt: new Date().toISOString()
      }
    };

    sendTo(socket, payload);
  };

  wsServer.on("connection", (socket, request) => {
    const token = getSessionTokenFromUpgradeRequest({
      headers: {
        cookie: request.headers.cookie
      },
      url: request.url
    });
    const session = token ? authService.refreshSession(token) : null;
    if (!session) {
      socket.close(4401, "Unauthorized");
      return;
    }

    subscriptions.set(socket, null);

    sendTo(socket, {
      type: "welcome",
      data: {
        user: session.user,
        availableSymbols,
        heartbeatMs: STREAM_HEARTBEAT_MS,
        updateIntervalMs: STREAM_UPDATE_INTERVAL_MS
      }
    });

    sendSnapshot(socket, priceEngine.getSnapshot(), null);

    socket.on("message", (rawMessage, isBinary) => {
      if (isBinary) {
        sendTo(socket, { type: "error", error: "Binary WebSocket frames are not supported." });
        return;
      }

      const result = parseClientMessage(rawMessage);
      if (!result.ok) {
        sendTo(socket, { type: "error", error: result.error });
        return;
      }

      if (result.message.type === "ping") {
        sendTo(socket, {
          type: "pong",
          data: {
            receivedAt: new Date().toISOString()
          }
        });
        return;
      }

      const subscription = result.message.symbols
        ? new Set<TickerSymbol>(result.message.symbols)
        : null;

      subscriptions.set(socket, subscription);
      sendTo(socket, {
        type: "subscribed",
        data: {
          symbols: result.message.symbols ?? availableSymbols
        }
      });
      sendSnapshot(socket, priceEngine.getSnapshot(), subscription);
    });

    socket.on("close", () => {
      subscriptions.delete(socket);
    });
  });

  const tickTimer = setInterval(() => {
    sequence += 1;
    const snapshot = priceEngine.tick();
    wsServer.clients.forEach((client) => {
      sendSnapshot(client, snapshot, subscriptions.get(client) ?? null);
    });
  }, STREAM_UPDATE_INTERVAL_MS);

  const heartbeatTimer = setInterval(() => {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, STREAM_HEARTBEAT_MS);

  tickTimer.unref?.();
  heartbeatTimer.unref?.();

  server.on("close", () => {
    clearInterval(tickTimer);
    clearInterval(heartbeatTimer);
    wsServer.close();
  });
};
