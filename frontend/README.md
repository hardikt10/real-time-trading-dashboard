# Frontend

React + TypeScript client for the real-time trading dashboard.

## Highlights

- mocked session restore and login screen
- REST bootstrap for tickers and historical candles
- reconnecting WebSocket market stream
- compact ticker cards with selected-symbol state
- Recharts candlestick and area chart views with interval switching
- local price alerts with per-instrument state and in-app notifications
- responsive dark dashboard layout

## Scripts

```bash
npm run build:css
npm run dev
npm run lint
npm run build
```

## Structure

```text
src/
|-- components/
|-- hooks/
|-- lib/
|-- types/
|-- constants.ts
|-- App.tsx
`-- index.css
```

## Notes

- `useMarketData` owns REST loading, WebSocket setup, reconnect cleanup, and live candle updates.
- `PriceChartCard` coordinates chart state while chart rendering lives in `components/chart`.
- `usePriceAlerts` owns local alert rules, saved/triggered notifications, and browser persistence.
- `useAuth` owns mocked session restore, login, and logout behavior.
- CSS is precompiled into `src/generated.css` before `dev` and `build`.
- Vite proxies `/api` and `/ws` to the backend during local development.
