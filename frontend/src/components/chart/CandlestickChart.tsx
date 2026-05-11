import { memo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatAxisLabel, formatCurrency, formatTimestamp } from "../../lib/formatters";
import type { ChartMouseState, ChartPoint, CrosshairOverlayProps } from "../../types/chart";
import type { HistoryInterval } from "../../types";

interface CandlestickChartProps {
  data: ChartPoint[];
  interval: HistoryInterval;
  onHover: (index: number | null) => void;
  yAxisDomain: [number, number];
}

interface CandleBodyProps {
  height?: number;
  payload?: ChartPoint;
  width?: number;
  x?: number;
  y?: number;
}

const MIN_CANDLE_BODY_HEIGHT = 2;

const CandleBody = ({ height = 0, payload, width = 0, x = 0, y = 0 }: CandleBodyProps) => {
  if (!payload) {
    return null;
  }

  const fill = payload.isBullish ? "#22c55e" : "#ef4444";
  const stroke = payload.isBullish ? "#4ade80" : "#fb7185";
  const candleWidth = Math.max(4, Math.min(width * 0.7, 16));
  const candleX = x + (width - candleWidth) / 2;
  const bodyHeight = Math.max(height, MIN_CANDLE_BODY_HEIGHT);
  const bodyY = height >= MIN_CANDLE_BODY_HEIGHT ? y : y - (MIN_CANDLE_BODY_HEIGHT - height) / 2;

  return (
    <rect
      x={candleX}
      y={bodyY}
      width={candleWidth}
      height={bodyHeight}
      rx={2}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
    />
  );
};

const CrosshairOverlay = ({
  height = 0,
  left = 0,
  points,
  top = 0,
  width = 0
}: CrosshairOverlayProps) => {
  const activePoint = points?.[0];
  if (!activePoint) {
    return null;
  }

  return (
    <g pointerEvents="none">
      <line
        x1={activePoint.x}
        x2={activePoint.x}
        y1={top}
        y2={top + height}
        stroke="#64748b"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <line
        x1={left}
        x2={left + width}
        y1={activePoint.y}
        y2={activePoint.y}
        stroke="#64748b"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
    </g>
  );
};

const CandlestickTooltip = ({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) => {
  const candle = payload?.[0]?.payload;
  if (!active || !candle) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0f1724]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur">
      <p className="text-slate-200">{formatTimestamp(candle.timestamp)}</p>
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-slate-100">
        <span>Open {formatCurrency(candle.open)}</span>
        <span>High {formatCurrency(candle.high)}</span>
        <span>Low {formatCurrency(candle.low)}</span>
        <span>Close {formatCurrency(candle.close)}</span>
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

const CandlestickChartComponent = ({
  data,
  interval,
  onHover,
  yAxisDomain
}: CandlestickChartProps) => {
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
        <ComposedChart
          data={data}
          barCategoryGap="28%"
          margin={{ top: 14, right: 14, bottom: 8, left: 0 }}
          onMouseMove={(state) => onHover(getTooltipIndex(state))}
          onMouseLeave={() => onHover(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#253044" opacity={0.62} />
          <XAxis
            dataKey="timestamp"
            minTickGap={28}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={{ stroke: "#334155" }}
            axisLine={{ stroke: "#334155" }}
            tickFormatter={(value: string) => formatAxisLabel(value, interval)}
          />
          <YAxis
            domain={yAxisDomain}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={{ stroke: "#334155" }}
            axisLine={{ stroke: "#334155" }}
            tickFormatter={(value: number) => formatCurrency(value)}
            width={82}
          />
          <Tooltip content={<CandlestickTooltip />} cursor={<CrosshairOverlay />} />
          <Bar dataKey="body" isAnimationActive={false} shape={<CandleBody />} radius={[3, 3, 3, 3]}>
            <ErrorBar
              dataKey="wick"
              stroke="#cbd5e1"
              strokeWidth={1.1}
              width={0}
              isAnimationActive={false}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CandlestickChart = memo(CandlestickChartComponent);
