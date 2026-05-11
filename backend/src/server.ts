import cors from "cors";
import express from "express";
import { createServer } from "http";
import { createAuthMiddleware } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth";
import { createTickerRouter } from "./routes/tickers";
import { AuthService } from "./services/auth-service";
import { PriceEngine } from "./services/price-engine";
import { HistoryService } from "./services/history-service";
import { attachPriceStream } from "./websocket/stream";

const app = express();
const port = Number(process.env.PORT ?? 8080);

const priceEngine = new PriceEngine();
const historyService = new HistoryService();
const authService = new AuthService();
const requireAuth = createAuthMiddleware(authService);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", createAuthRouter(authService));
app.use("/api/tickers", requireAuth, createTickerRouter(priceEngine, historyService));

const server = createServer(app);
attachPriceStream(server, priceEngine, authService);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
