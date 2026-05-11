import { TickerDefinition } from "../types";

export const TICKERS: TickerDefinition[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    assetClass: "equity",
    basePrice: 190,
    previousClose: 182.25,
    volatilityBps: 65
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    assetClass: "equity",
    basePrice: 175,
    previousClose: 181.4,
    volatilityBps: 120
  },
  {
    symbol: "BTC-USD",
    name: "Bitcoin",
    assetClass: "crypto",
    basePrice: 62000,
    previousClose: 60850,
    volatilityBps: 180
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum",
    assetClass: "crypto",
    basePrice: 3200,
    previousClose: 3278,
    volatilityBps: 200
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    assetClass: "equity",
    basePrice: 425,
    previousClose: 418.3,
    volatilityBps: 55
  }
];
