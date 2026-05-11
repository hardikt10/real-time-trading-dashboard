import type { LiveTicker, TickerSymbol } from "../types";
import { formatCurrency, formatPercent } from "../lib/formatters";
import { AlertBell } from "./AlertBell";
import type { PriceAlertRule } from "../types";

interface TickerGridProps {
  getAlertRule: (symbol: TickerSymbol) => PriceAlertRule;
  onArmAlert: (symbol: TickerSymbol) => Promise<void> | void;
  onClearAlert: (symbol: TickerSymbol) => void;
  tickers: LiveTicker[];
  onThresholdChange: (symbol: TickerSymbol, threshold: string) => void;
  selectedSymbol: TickerSymbol;
  onSelect: (symbol: TickerSymbol) => void;
}

const hasActiveAlert = (rule: PriceAlertRule): boolean => {
  const threshold = Number(rule.threshold);
  return rule.enabled && Number.isFinite(threshold) && threshold > 0;
};

export const TickerGrid = ({
  getAlertRule,
  onArmAlert,
  onClearAlert,
  onSelect,
  onThresholdChange,
  selectedSymbol,
  tickers
}: TickerGridProps) => (
  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {tickers.map((ticker) => {
      const isSelected = selectedSymbol === ticker.symbol;
      const alertRule = getAlertRule(ticker.symbol);
      const isAlertSet = hasActiveAlert(alertRule);
      const isPositive = ticker.changePercent >= 0;

      return (
        <article
          key={ticker.symbol}
          aria-label={
            isAlertSet
              ? `${ticker.symbol} price alert active at ${formatCurrency(Number(alertRule.threshold))}`
              : undefined
          }
          className={`group relative overflow-visible rounded-[28px] border p-4 transition duration-200 sm:p-5 ${
            isSelected
              ? "border-cyan-400/55 bg-[linear-gradient(180deg,rgba(15,23,42,0.99),rgba(8,13,24,0.99))] shadow-[0_18px_55px_rgba(8,145,178,0.14)]"
              : isAlertSet
                ? "border-cyan-400/40 bg-[linear-gradient(180deg,rgba(14,24,40,0.96),rgba(8,16,30,0.98))] shadow-[0_16px_48px_rgba(34,211,238,0.1)] ring-1 ring-cyan-400/20"
                : "border-slate-800/90 bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(8,13,24,0.92))] hover:-translate-y-0.5 hover:border-cyan-400/24 hover:bg-[linear-gradient(180deg,rgba(18,28,47,0.94),rgba(10,16,28,0.98))]"
          } ${isAlertSet ? "pl-5 before:pointer-events-none before:absolute before:bottom-5 before:left-3 before:top-5 before:w-0.5 before:rounded-full before:bg-cyan-400/80" : ""}`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
          {isSelected ? (
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_68%)] blur-xl" />
          ) : null}
          {isAlertSet ? (
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_70%)] blur-xl" />
          ) : null}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${
                  isSelected
                    ? "bg-cyan-400/12 text-cyan-100"
                    : "bg-slate-950/55 text-slate-400"
                }`}
              >
                {ticker.assetClass}
              </span>
              {isAlertSet ? (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                  Alert on
                </span>
              ) : null}
            </div>
            <AlertBell
              compact
              currentPrice={ticker.price}
              onArmAlert={onArmAlert}
              onClearAlert={onClearAlert}
              onThresholdChange={onThresholdChange}
              rule={alertRule}
              symbol={ticker.symbol}
            />
          </div>
          <button
            type="button"
            onClick={() => onSelect(ticker.symbol)}
            className="w-full rounded-[22px] px-1 py-1 text-left outline-none ring-cyan-400/40 transition focus-visible:ring-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p
                  className={`text-xs uppercase tracking-[0.24em] ${
                    isSelected ? "text-cyan-200" : "text-slate-400"
                  }`}
                >
                  {ticker.symbol}
                </p>
                <h3 className="mt-2 truncate text-base font-semibold text-white sm:text-lg">{ticker.name}</h3>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  isPositive
                    ? "border-(--positive)/25 bg-(--positive)/10 text-(--positive)"
                    : "border-(--negative)/25 bg-(--negative)/10 text-(--negative)"
                }`}
              >
                {isPositive ? "Up" : "Down"}
              </span>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-white sm:mt-6 sm:text-[1.75rem]">
              {formatCurrency(ticker.price)}
            </p>
            <p
              className={`mt-2 text-sm font-medium ${
                isPositive ? "text-(--positive)" : "text-(--negative)"
              }`}
            >
              {formatPercent(ticker.changePercent)}
            </p>
            {isAlertSet ? (
              <p className="mt-3 text-xs text-cyan-200/90">
                Alert set at {formatCurrency(Number(alertRule.threshold))}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-slate-500 transition group-hover:text-slate-300">
              Updated {new Date(ticker.updatedAt).toLocaleTimeString()}
            </p>
          </button>
        </article>
      );
    })}
  </section>
);
