export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 10_000 ? 0 : 2
  }).format(value);

export const formatPercent = (value: number): string =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export const formatAxisLabel = (timestamp: string, interval: string): string => {
  const date = new Date(timestamp);
  if (interval.endsWith("h")) {
    return date.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit"
    });
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

export const formatCompactTime = (value: string | null): string =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : "Waiting for market feed";
