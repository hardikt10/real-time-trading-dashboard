import { lazy, Suspense } from "react";
import { LoginCard } from "./components/LoginCard";
import { NotificationStack } from "./components/NotificationStack";
import { TickerGrid } from "./components/TickerGrid";
import { useAuth } from "./hooks/useAuth";
import { useMarketData } from "./hooks/useMarketData";
import { usePriceAlerts } from "./hooks/usePriceAlerts";
import { formatTimestamp } from "./lib/formatters";

const PriceChartCard = lazy(() => import("./components/PriceChartCard"));

interface DashboardProps {
  authError: string | null;
  expiresAt: string;
  onLogout: () => Promise<void>;
  onSessionExpired: (message?: string) => void;
  userName: string;
}

function Dashboard({ authError, expiresAt, onLogout, onSessionExpired, userName }: DashboardProps) {
  const {
    tickers,
    history,
    selectedInterval,
    setSelectedInterval,
    selectedSymbol,
    setSelectedSymbol,
    error
  } = useMarketData({ onUnauthorized: onSessionExpired });
  const {
    armAlert,
    clearAlert,
    dismissNotification,
    getRule,
    notifications,
    setThreshold
  } = usePriceAlerts(tickers);

  const selectedTicker = tickers.find((ticker) => ticker.symbol === selectedSymbol);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-368 flex-col gap-6 px-4 py-6 sm:gap-7 sm:px-6 md:gap-8 md:px-8 md:py-10 lg:px-10">
      <header className="relative overflow-hidden rounded-[32px] border border-slate-800/90 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(3,7,18,0.99))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.44)] sm:p-7 md:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_58%)]" />
        <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_72%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Real-Time Trading Dashboard
            </h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                Signed in as {userName}
              </span>
              <span className="rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                Session expires {formatTimestamp(expiresAt)}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-start lg:items-end">
            <button
              type="button"
              onClick={() => {
                void onLogout();
              }}
              className="rounded-full border border-slate-700/80 bg-slate-950/50 px-5 py-2.5 text-sm text-slate-100 transition hover:border-cyan-400/35 hover:bg-slate-900/80 sm:min-w-32"
            >
              Sign Out
            </button>
          </div>
        </div>
        {error || authError ? (
          <p className="relative mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error ?? authError}
          </p>
        ) : null}
      </header>

      <TickerGrid
        getAlertRule={getRule}
        onArmAlert={armAlert}
        onClearAlert={clearAlert}
        onSelect={setSelectedSymbol}
        onThresholdChange={setThreshold}
        selectedSymbol={selectedSymbol}
        tickers={tickers}
      />

      <section>
        <Suspense
          fallback={
            <div className="rounded-[32px] border border-slate-800/90 bg-slate-950/50 p-6 text-sm text-slate-300 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
              Loading chart module...
            </div>
          }
        >
          <PriceChartCard
            history={history}
            interval={selectedInterval}
            onIntervalChange={setSelectedInterval}
            ticker={selectedTicker}
          />
        </Suspense>
      </section>

      <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    </main>
  );
}

function App() {
  const {
    user,
    expiresAt,
    error: authError,
    isLoading,
    isSubmitting,
    login,
    logout,
    clearSession
  } =
    useAuth();

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 md:px-8">
        <div className="rounded-[32px] border border-slate-800/90 bg-slate-950/50 px-6 py-5 text-sm text-slate-200 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          Restoring demo session...
        </div>
      </main>
    );
  }

  if (!user || !expiresAt) {
    return <LoginCard error={authError} isSubmitting={isSubmitting} onLogin={login} />;
  }

  return (
    <Dashboard
      authError={authError}
      expiresAt={expiresAt}
      onLogout={logout}
      onSessionExpired={clearSession}
      userName={user.name}
    />
  );
}

export default App;
