import { Router, Request, Response } from "express";
import { HistoryService } from "../services/history-service";
import { PriceEngine } from "../services/price-engine";
import { TICKERS } from "../constants/tickers";
import { parseHistoryInterval, parseHistoryPoints, parseTickerSymbol } from "../utils/market";

export const createTickerRouter = (
  priceEngine: PriceEngine,
  historyService: HistoryService
): Router => {
  const router = Router();

  router.get("/available", (_req: Request, res: Response) => {
    res.json({
      data: TICKERS.map(({ symbol, name, assetClass }) => ({ symbol, name, assetClass })),
      meta: {
        availableIntervals: ["1m", "5m", "15m", "1h"]
      }
    });
  });

  router.get("/", (_req: Request, res: Response) => {
    res.json({
      data: priceEngine.getSnapshot()
    });
  });

  router.get("/:symbol/history", (req: Request, res: Response) => {
    const rawSymbol = Array.isArray(req.params.symbol)
      ? req.params.symbol[0]
      : req.params.symbol;
    const symbol = parseTickerSymbol(rawSymbol);
    if (!symbol) {
      res.status(404).json({ error: "Ticker not found" });
      return;
    }

    const points = parseHistoryPoints(req.query.points ?? 90, 90);
    const interval = parseHistoryInterval(req.query.interval ?? "1m", "1m");
    const currentPrice = priceEngine.getCurrentPrice(symbol);
    const history = historyService.getHistory(symbol, currentPrice, points, interval);

    res.setHeader("Cache-Control", "private, max-age=15, stale-while-revalidate=45");
    res.setHeader("Vary", "Cookie");

    res.json({
      symbol,
      interval: history.interval,
      points: history.points,
      cached: history.cached,
      generatedAt: history.generatedAt,
      data: history.data
    });
  });

  return router;
};
