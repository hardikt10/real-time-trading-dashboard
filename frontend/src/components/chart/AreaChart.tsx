import { memo } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatAxisLabel, formatCurrency } from "../../lib/formatters";
import type { ChartMouseState, ChartPoint, CrosshairOverlayProps } from "../../types/chart";
import type { HistoryInterval } from "../../types";

interface AreaChartProps {
  data: ChartPoint[];
  interval: HistoryInterval;
  onHover: (index: number | null) => void;
  yAxisDomain: [number, number];
}

const formatDate = (timestamp: string): string =>
  new Date(timestamp).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

const formatTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

const VerticalGuideLine = ({ height = 0, points, top = 0 }: CrosshairOverlayProps) => {
  const activePoint = points?.[0];
  if (!activePoint) {
    return null;
  }

  return (
    <line
      pointerEvents="none"
      x1={activePoint.x}
      x2={activePoint.x}
      y1={top}
      y2={top + height}
      stroke="#64748b"
      strokeDasharray="4 4"
      strokeWidth={1}
    />
  );
};

const AreaTooltip = ({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0f1724]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Close Price</p>
      <p className="mt-1 text-lg font-semibold text-cyan-100">{formatCurrency(point.price)}</p>
      <div className="mt-3 space-y-1 text-xs text-slate-300">
        <p>Date {formatDate(point.timestamp)}</p>
        <p>Time {formatTime(point.timestamp)}</p>
        {timezone ? <p>Timezone {timezone}</p> : null}
      </div>
    </div>
  );
};

const getTooltipIndex = (state: ChartMouseState): number | null => {
  if (!state.isTooltipActive || state.activeTooltipIndex == null) {
    return null;
  }

  const nextIndex =
    typeof state.activeTooltipIndex === "number"
      ? state.activeTooltipIndex
      : Number.parseInt(state.activeTooltipIndex, 10);

  return Number.isNaN(nextIndex) ? null : nextIndex;
};

const AreaChartComponent = ({
  data,
  interval,
  onHover,
  yAxisDomain
}: AreaChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 px-4 text-center text-sm text-slate-400">
        Waiting for historical candles...
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <ResponsiveContainer>
        <RechartsAreaChart
          data={data}
          margin={{ top: 16, right: 14, bottom: 8, left: 0 }}
          onMouseMove={(state) => onHover(getTooltipIndex(state))}
          onMouseLeave={() => onHover(null)}
        >
          <defs>
            <linearGradient id="closePriceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.34} />
              <stop offset="55%" stopColor="#14b8a6" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#253044" opacity={0.5} />
          <XAxis
            dataKey="timestamp"
            minTickGap={28}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
            tickFormatter={(value: string) => formatAxisLabel(value, interval)}
          />
          <YAxis
            domain={yAxisDomain}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatCurrency(value)}
            width={82}
          />
          <Tooltip content={<AreaTooltip />} cursor={<VerticalGuideLine />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#2dd4bf"
            strokeWidth={2.4}
            fill="url(#closePriceGradient)"
            activeDot={{
              r: 5,
              fill: "#ecfeff",
              stroke: "#2dd4bf",
              strokeWidth: 2
            }}
            dot={false}
            isAnimationActive={false}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AreaChart = memo(AreaChartComponent);
