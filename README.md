# Real-Time Trading Dashboard

A full-stack mock trading dashboard with REST-backed ticker data, generated historical candles, and a WebSocket stream for live price updates.

The app is intentionally scoped to market-data display. It does not place orders, manage portfolios, connect wallets, or call real market APIs.

## Features

- Mock market data engine for `AAPL`, `TSLA`, `BTC-USD`, `ETH-USD`, and `MSFT`
- REST endpoint for the current ticker snapshot
- REST endpoint for mocked OHLC historical candles
- WebSocket stream for live ticker updates
- React + TypeScript dashboard with ticker switching
- Candlestick and area chart views with interval switching
- Compact dark watchlist, live price cards, loading and error states
- Mock cookie-backed login used by both REST and WebSocket requests
- Optional price-threshold alerts with local saved rules and in-app notifications
- Backend unit tests for core market, auth, history, and WebSocket protocol logic
- Dockerfiles, production frontend Nginx proxying, and `docker-compose.yml` for local container startup

## Tech Stack

- Backend: Node.js, TypeScript, Express, `ws`
- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts
- Testing: Vitest
- Tooling: ESLint, Docker, Docker Compose

## Project Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- websocket/
|   |   `-- server.ts
|   `-- tests/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- types/
|   |   `-- App.tsx
|   `-- Dockerfile
|-- docker-compose.yml
|-- k8s/
`-- README.md
```

## Local Setup

Install and run the backend:

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:8080`.

Install and run the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`. During local development, Vite proxies `/api` and `/ws` to the backend.

Demo credentials:

```text
Email: trader@demo.dev
Password: demo1234
```

## Docker Setup

Run both services:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:4173`
- Backend: `http://localhost:8080`

The frontend container now serves the built app through Nginx and proxies `/api` and `/ws` to the backend container, so the browser stays on one origin.

PowerShell helper:

```powershell
./scripts/docker-up.ps1
```

Detached mode:

```powershell
./scripts/docker-up.ps1 -Detach
```

## Kubernetes Setup

The manifests in `k8s/` run the same two images with health probes, a namespace, a Kustomize entrypoint, local NodePort services, and an optional ingress.

Build the images for a local Kubernetes cluster:

```bash
docker build -t trading-dashboard-backend:latest ./backend
docker build -t trading-dashboard-frontend:latest ./frontend
```

Apply everything with one Kubernetes command:

```bash
kubectl apply -k k8s
```

Local endpoints:

- Frontend: `http://localhost:30000`
- Backend: `http://localhost:30080`

The frontend pod serves the built app through Nginx and proxies `/api` and `/ws` to the backend service inside the cluster via `BACKEND_UPSTREAM=http://trading-dashboard-backend:8080`.

PowerShell helper:

```powershell
./scripts/k8s-deploy.ps1 -BuildImages
```

The manifests also include an optional ingress for `trading-dashboard.local` if your cluster has an ingress controller. For Docker Desktop Kubernetes, the NodePort URLs above are the shortest path.

## Test Commands

Backend:

```bash
cd backend
npm run build
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Bonus Features Implemented

- Mock authentication with cookie-backed sessions shared by REST and WebSocket requests.
- Short-lived historical candle caching in the backend and interval-aware client history caching.
- Price threshold alerts with per-instrument visual state, editable trigger prices, local persistence, and in-app notifications when alerts are saved or triggered.

## API Endpoints

### `GET /health`

Returns a basic health response.

### `POST /api/auth/login`

Creates a mocked in-memory session and sets the session cookie.

Request:

```json
{
  "email": "trader@demo.dev",
  "password": "demo1234"
}
```

### `GET /api/auth/me`

Returns the current demo user when the session cookie is valid.

### `POST /api/auth/logout`

Invalidates the current demo session.

### `GET /api/tickers`

Returns the current live ticker snapshot.

Example response:

```json
{
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "assetClass": "equity",
      "price": 191.42,
      "changePercent": 0.75,
      "updatedAt": "2026-05-05T13:00:12.000Z"
    }
  ]
}
```

### `GET /api/tickers/available`

Returns the available ticker universe and supported history intervals.

### `GET /api/tickers/:symbol/history?points=90&interval=1m`

Returns mocked OHLC candles for the selected symbol.

Supported intervals:

- `1m`
- `5m`
- `15m`
- `1h`

Example response:

```json
{
  "symbol": "AAPL",
  "interval": "1m",
  "points": 90,
  "cached": true,
  "generatedAt": "2026-05-05T13:00:00.000Z",
  "data": [
    {
      "timestamp": "2026-05-05T11:31:00.000Z",
      "open": 189.72,
      "high": 190.18,
      "low": 189.41,
      "close": 189.96
    }
  ]
}
```

Authenticated endpoints require the cookie issued by `/api/auth/login`.

## WebSocket Message Format

Socket endpoint:

```text
ws://localhost:8080/ws
```

Subscribe to specific symbols:

```json
{
  "type": "subscribe",
  "symbols": ["AAPL", "TSLA"]
}
```

Ping:

```json
{
  "type": "ping"
}
```

Welcome message:

```json
{
  "type": "welcome",
  "data": {
    "availableSymbols": ["AAPL", "TSLA", "BTC-USD", "ETH-USD", "MSFT"],
    "heartbeatMs": 15000,
    "updateIntervalMs": 1000
  }
}
```

Tick message:

```json
{
  "type": "tick",
  "meta": {
    "sequence": 12,
    "generatedAt": "2026-05-05T13:00:12.000Z"
  },
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "assetClass": "equity",
      "price": 191.42,
      "changePercent": 0.75,
      "updatedAt": "2026-05-05T13:00:12.000Z"
    }
  ]
}
```

The WebSocket uses the same mocked session cookie as the REST API.

## Assumptions and Trade-offs

- Market data is generated in memory. It is suitable for the challenge, not for production trading.
- Historical candles are mocked and cached briefly instead of being stored in a database.
- Authentication is mocked with in-memory sessions because the dashboard only needs a demo gate. Sessions use opaque tokens in `HttpOnly`, `SameSite=Lax` cookies, with `Secure` enabled in production.
- The chart uses Recharts and always renders the full loaded history window for the selected interval.
- The app keeps a bounded number of live candles on the client to avoid unnecessary memory growth.
- The backend sends basic security headers and uses health endpoints for Docker/Kubernetes probes.

## Known Limitations

- Data resets when the backend process restarts.
- No real exchange connectivity or order execution is included.
- Alert rules are persisted in browser storage only; they are not stored on the backend.
- Frontend tests are not included; backend tests cover the core data and protocol logic.
