import { formatCompactTime } from "../lib/formatters";
import type { PriceAlertNotification } from "../types";

interface NotificationStackProps {
  notifications: PriceAlertNotification[];
  onDismiss: (id: string) => void;
}

const TOAST_STYLES = {
  set: "border-cyan-400/25 bg-cyan-400/8",
  triggered: "border-emerald-400/25 bg-emerald-400/8"
} as const;

const TOAST_LABELS = {
  set: "Alert saved",
  triggered: "Alert triggered"
} as const;

export const NotificationStack = ({
  notifications,
  onDismiss
}: NotificationStackProps) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 flex flex-col gap-2 sm:bottom-5 sm:left-auto sm:right-5 sm:w-[min(20rem,calc(100vw-2rem))]">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto rounded-2xl border px-3.5 py-3 text-sm text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl ${TOAST_STYLES[notification.kind]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                {TOAST_LABELS[notification.kind]}
              </p>
              <p className="mt-1 font-medium text-white">{notification.symbol}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-300">{notification.message}</p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {formatCompactTime(notification.triggeredAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="shrink-0 rounded-full border border-slate-700/80 px-2 py-1 text-[11px] text-slate-200 transition hover:border-cyan-400/35 hover:bg-slate-900/80"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
