import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatTimestamp } from "../lib/formatters";
import type { PriceAlertRule, TickerSymbol } from "../types";

interface AlertBellProps {
  compact?: boolean;
  currentPrice: number | null;
  onArmAlert: (symbol: TickerSymbol) => Promise<void> | void;
  onClearAlert: (symbol: TickerSymbol) => void;
  onThresholdChange: (symbol: TickerSymbol, threshold: string) => void;
  rule: PriceAlertRule;
  symbol: TickerSymbol;
}

const BellIcon = () => (
  <svg
    aria-hidden="true"
    className="block h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17.75H9m6 0H18a1.25 1.25 0 0 0 1.03-1.96l-1.03-1.52V10a6 6 0 1 0-12 0v4.27l-1.03 1.52A1.25 1.25 0 0 0 6 17.75h3m6 0a3 3 0 0 1-6 0"
    />
  </svg>
);

const getAlertStatus = (
  rule: PriceAlertRule,
  hasValidThreshold: boolean
): { detail: string; label: string } | null => {
  if (rule.enabled && hasValidThreshold) {
    return {
      detail: `Watching for ${formatCurrency(Number(rule.threshold))}.`,
      label: "Watching"
    };
  }

  if (rule.triggeredAt) {
    return {
      detail: `Last triggered ${formatTimestamp(rule.triggeredAt)}.`,
      label: "Triggered"
    };
  }

  if (hasValidThreshold) {
    return {
      detail: "Save the alert to start watching this price.",
      label: "Ready to save"
    };
  }

  return null;
};

export const AlertBell = ({
  compact = false,
  currentPrice,
  onArmAlert,
  onClearAlert,
  onThresholdChange,
  rule,
  symbol
}: AlertBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const parsedThreshold = Number(rule.threshold);
  const hasValidThreshold = Number.isFinite(parsedThreshold) && parsedThreshold > 0;
  const isWatching = rule.enabled && hasValidThreshold;
  const distanceToAlert =
    currentPrice !== null && hasValidThreshold ? Math.max(parsedThreshold - currentPrice, 0) : null;
  const alertStatus = getAlertStatus(rule, hasValidThreshold);
  const canSave = hasValidThreshold && !isWatching;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="relative z-20" ref={containerRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Manage price alert for ${symbol}`}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        className={`relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35 ${
          isOpen
            ? "bg-slate-800/80 text-white"
            : isWatching
              ? "text-cyan-300 hover:bg-cyan-400/10"
              : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
        }`}
      >
        <BellIcon />
        {isWatching ? (
          <span
            className={`absolute rounded-full bg-cyan-300 ${
              compact ? "right-1 top-1 h-1.5 w-1.5" : "right-1.5 top-1.5 h-2 w-2"
            }`}
          />
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={`absolute z-50 w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-700/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,13,24,0.98))] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl ${
            compact
              ? "right-0 top-[calc(100%+0.5rem)] sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
              : "left-1/2 top-12 -translate-x-1/2"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-[10px] uppercase tracking-[0.26em] text-(--accent-muted)">
            Price Alert
          </p>
          <h3 className="mt-1.5 text-base font-semibold text-white">{symbol}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Notify when live price reaches your level.
          </p>

          {alertStatus ? (
            <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-950/45 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {alertStatus.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-200">{alertStatus.detail}</p>
            </div>
          ) : null}

          <label
            className="mt-4 block text-xs font-medium uppercase tracking-[0.18em] text-slate-300"
            htmlFor={`alert-price-${symbol}`}
          >
            Trigger price
          </label>
          <input
            id={`alert-price-${symbol}`}
            type="number"
            min="0"
            step="0.01"
            value={rule.threshold}
            onChange={(event) => onThresholdChange(symbol, event.target.value)}
            placeholder={currentPrice !== null ? `e.g. ${currentPrice.toFixed(2)}` : "Enter a price"}
            className="mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white outline-none ring-cyan-400/35 transition focus:ring-2"
          />

          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              disabled={!canSave}
              onClick={async () => {
                await onArmAlert(symbol);
                setIsOpen(false);
              }}
              className="flex-1 rounded-xl bg-cyan-400 px-3.5 py-2.5 text-sm font-medium text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save alert
            </button>
            <button
              type="button"
              disabled={!hasValidThreshold && !rule.triggeredAt && !isWatching}
              onClick={() => {
                onClearAlert(symbol);
                setIsOpen(false);
              }}
              className="rounded-xl border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-200 transition hover:border-cyan-400/35 hover:bg-slate-900/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-950/45 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Live price</p>
            <p className="mt-1.5 text-base font-semibold text-white">
              {currentPrice !== null ? formatCurrency(currentPrice) : "Waiting for live price"}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              {distanceToAlert === null
                ? "Enter a trigger price to start watching."
                : distanceToAlert === 0
                  ? "Threshold reached."
                  : `${formatCurrency(distanceToAlert)} to trigger.`}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
