# Real-Time Trading Dashboard

A full-stack mock trading dashboard with REST-backed ticker data, generated historical candles, WebSocket live ticks, mocked authentication, cached history, price alerts, Docker packaging, and Kubernetes manifests.

## What Is Included

- Backend service in `backend/`
- Frontend service in `frontend/`
- Docker Compose flow in `docker-compose.yml`
- Kubernetes manifests in `k8s/`
- Helper scripts in `scripts/`

## Key Features

- Live ticker stream for `AAPL`, `TSLA`, `BTC-USD`, `ETH-USD`, and `MSFT`
- Historical OHLC candles for `1m`, `5m`, `15m`, and `1h`
- Mocked cookie-backed authentication shared by REST and WebSocket
- Backend history caching and frontend interval-aware history caching
- Price-threshold alerts with bell popup and in-app notifications
- Backend unit tests for pricing, auth, history, and WebSocket protocol
- Production frontend served by Nginx with `/api` and `/ws` reverse-proxied to backend

## Project Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- constants/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- websocket/
|   `-- tests/
|-- frontend/
|   |-- nginx/
|   `-- src/
|-- k8s/
|-- scripts/
|-- docker-compose.yml
`-- README.md
```

## Minimum Requirements By Scenario

### 1. Code review only

- Web browser

### 2. Local app run without containers

- Node.js 20+
- npm

### 3. Docker verification

- Docker Desktop on Windows or any working Docker Engine with Compose support

### 4. Kubernetes verification

- Docker Desktop
- Kubernetes enabled inside Docker Desktop, or another working local cluster
- `kubectl`

### 5. Fresh-machine validation from GitHub

- `Git` if cloning directly
- Or a browser if downloading the repository ZIP

## Demo Credentials

```text
Email: trader@demo.dev
Password: demo1234
```

## How Reviewers Can Run It

### Option A: Run locally with Node.js

Use this if you want the simplest setup and do not need containers.

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/health`

Notes:

- Vite proxies `/api` and `/ws` to the backend during local development.
- This is the fastest way to verify the app behavior.

### Option B: Run with Docker Compose

Use this if you want the containerized setup.

```bash
docker compose up --build
```

Or on PowerShell:

```powershell
./scripts/docker-up.ps1
```

Open:

- Frontend: `http://localhost:4173`
- Backend health: `http://localhost:8080/health`

Notes:

- The frontend container is served by Nginx.
- Nginx proxies `/api` and `/ws` to the backend container.
- Browser traffic stays on one origin in the Docker flow.

### Option C: Run with Kubernetes

Use this if you want to validate the `k8s/` manifests.

First confirm Kubernetes is available:

```bash
kubectl config current-context
kubectl cluster-info
```

Then deploy:

```powershell
./scripts/k8s-deploy.ps1 -BuildImages
```

Or manually:

```bash
docker build -t trading-dashboard-backend:latest ./backend
docker build -t trading-dashboard-frontend:latest ./frontend
kubectl apply -k k8s
kubectl -n trading-dashboard set image deployment/trading-dashboard-backend backend=trading-dashboard-backend:latest
kubectl -n trading-dashboard set image deployment/trading-dashboard-frontend frontend=trading-dashboard-frontend:latest
```

Check rollout:

```bash
kubectl -n trading-dashboard get pods
kubectl -n trading-dashboard get svc
```

Expected result:

- `trading-dashboard-backend` pod becomes `1/1 Running`
- `trading-dashboard-frontend` pod becomes `1/1 Running`

#### Important Docker Desktop Kubernetes note

On the newer Docker Desktop `kind` cluster, `NodePort` may not always be directly reachable from Windows through `localhost:30000` and `localhost:30080`.

If direct browser access works, use:

- Frontend: `http://localhost:30000`
- Backend health: `http://localhost:30080/health`

If direct `NodePort` access does not work, use port-forward:

PowerShell window 1:

```bash
kubectl -n trading-dashboard port-forward svc/trading-dashboard-frontend 30000:80
```

PowerShell window 2:

```bash
kubectl -n trading-dashboard port-forward svc/trading-dashboard-backend 30080:8080
```

Then open:

- Frontend: `http://localhost:30000`
- Backend health: `http://localhost:30080/health`

This is the most reliable verification flow on Docker Desktop Kubernetes.

## Fresh Machine Setup

### If Git is installed

```bash
git clone https://github.com/hardikt10/real-time-trading-dashboard.git
cd real-time-trading-dashboard
```

### If Git is not installed

1. Download the repository as ZIP from GitHub
2. Extract it
3. Open a terminal in the extracted project root

## Verification Checklist

### Backend

```bash
cd backend
npm install
npm run build
npm test
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

### Manual app checks

- Login works with the demo credentials
- Ticker cards load
- WebSocket live prices update
- Historical chart loads for `1m`, `5m`, `15m`, and `1h`
- Bell icon opens the price alert popup
- Price alert triggers when threshold is reached

## Scripts

### Root helper scripts

- `./scripts/docker-up.ps1`
- `./scripts/k8s-deploy.ps1 -BuildImages`

### Frontend

```bash
cd frontend
npm run dev
npm run lint
npm run build
```

### Backend

```bash
cd backend
npm run dev
npm run build
npm test
```

## API Summary

### `GET /health`

Basic health endpoint for local checks and container probes.

### `POST /api/auth/login`

Creates a mocked in-memory session and sets the session cookie.

Request body:

```json
{
  "email": "trader@demo.dev",
  "password": "demo1234"
}
```

### `GET /api/auth/me`

Returns the current mocked user for a valid session cookie.

### `POST /api/auth/logout`

Clears the mocked session.

### `GET /api/tickers`

Returns the current live ticker snapshot.

### `GET /api/tickers/:symbol/history?points=90&interval=1m`

Returns mocked OHLC candle data for the selected symbol and interval.

Supported intervals:

- `1m`
- `5m`
- `15m`
- `1h`

### WebSocket endpoint

```text
ws://localhost:8080/ws
```

The frontend uses the same mocked session cookie for both REST and WebSocket flows.

## Assumptions And Trade-offs

- Market data is generated in memory and is meant for assessment/demo use, not real trading.
- The backend follows a microservices-friendly split between routes, services, middleware, and websocket handling, but is intentionally delivered as two deployable services for the exercise: frontend and backend.
- Authentication is mocked with in-memory sessions because the task asked for a mocked auth flow, not a production identity provider.
- Historical candles are generated and cached in memory instead of stored in a database.
- Equities use day change versus previous close.
- Crypto uses day change versus `00:00 UTC`, since these instruments trade continuously.
- Alert rules are stored in browser storage only.
- Kubernetes manifests target a local development cluster and are not production-hardened.

## Known Limitations

- Data resets when the backend restarts.
- No real exchange connectivity or order execution is included.
- Frontend automated tests are not included.
- On some Windows setups, `frontend/dist` can be locked by another process and cause `vite build` cleanup to fail until the lock is released.

## What Was Verified During Development

- Local Node.js run for frontend and backend
- Backend build and unit tests
- Frontend lint and type-check
- Docker Compose startup
- Kubernetes deployment on Docker Desktop Kubernetes, with port-forward verification for the frontend and backend services
