import { memo, useCallback, useMemo, useState } from "react";
import { HISTORY_INTERVAL_OPTIONS } from "../constants";
import { formatCurrency, formatPercent } from "../lib/formatters";
import type { ChartPoint, ChartType, VisibleRange } from "../types/chart";
import type { HistoryCandle, HistoryInterval, LiveTicker } from "../types";
import { AreaChart } from "./chart/AreaChart";
import { CandlestickChart } from "./chart/CandlestickChart";
import { ChartContainer } from "./chart/ChartContainer";
import { ChartTypeToggle } from "./chart/ChartTypeToggle";

interface PriceChartCardProps {
  history: HistoryCandle[];
  interval: HistoryInterval;
  onIntervalChange: (interval: HistoryInterval) => void;
  ticker: LiveTicker | undefined;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

const buildChartPoints = (history: HistoryCandle[]): ChartPoint[] =>
  history.map((candle) => {
    const bodyLow = Math.min(candle.open, candle.close);
    const bodyHigh = Math.max(candle.open, candle.close);

    return {
      ...candle,
      body: [bodyLow, bodyHigh],
      isBullish: candle.close >= candle.open,
      price: candle.close,
      wick: [round2(bodyHigh - candle.low), round2(candle.high - bodyHigh)]
    };
  });

const getYAxisDomain = (
  prices: number[],
  latestPrice: number
): [number, number] => {
  if (prices.length === 0) {
    return [0, 1];
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const safeLatestPrice = latestPrice > 0 ? latestPrice : prices[prices.length - 1];
  const baseRange = Math.max(maxPrice - minPrice, safeLatestPrice * 0.0025, 0.5);
  const padding = Math.max(baseRange * 0.12, safeLatestPrice * 0.001, 0.25);

  return [round2(Math.max(0, minPrice - padding)), round2(maxPrice + padding)];
};

const getVisiblePrices = (
  data: ChartPoint[],
  chartType: ChartType,
  latestPrice: number
): number[] => {
  if (data.length === 0) {
    return [latestPrice];
  }

  return data.flatMap((point) =>
    chartType === "candles" ? [point.open, point.high, point.low, point.close] : [point.price]
  );
};

const PriceChartCard = ({
  history,
  interval,
  onIntervalChange,
  ticker
}: PriceChartCardProps) => {
  const symbol = ticker?.symbol ?? "AAPL";
  const chartData = useMemo(() => buildChartPoints(history), [history]);
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  const latestPoint = chartData.at(-1);
  const activePoint = hoveredPoint && chartData.includes(hoveredPoint) ? hoveredPoint : latestPoint;
  const latestPrice = latestPoint?.close ?? 0;
  const seriesLatestPrice = latestPoint?.close ?? latestPrice;
  const fullSeriesPrices =
    chartData.length > 0
      ? chartData.flatMap((point) => [point.open, point.high, point.low, point.close])
      : [seriesLatestPrice];
  const high = fullSeriesPrices.length > 0 ? Math.max(...fullSeriesPrices) : 0;
  const low = fullSeriesPrices.length > 0 ? Math.min(...fullSeriesPrices) : 0;
  const seriesOpeningPrice = chartData[0]?.open ?? seriesLatestPrice;
  const seriesChange =
    seriesOpeningPrice > 0
      ? ((seriesLatestPrice - seriesOpeningPrice) / seriesOpeningPrice) * 100
      : 0;

  const handleChartTypeChange = useCallback((nextChartType: ChartType) => {
    setHoveredPoint(null);
    setChartType(nextChartType);
  }, []);

  const handleIntervalChange = useCallback(
    (nextInterval: HistoryInterval) => {
      setHoveredPoint(null);
      onIntervalChange(nextInterval);
    },
    [onIntervalChange]
  );

  const renderChart = useCallback(
    (visibleRange: VisibleRange) => {
      const visibleChartData = chartData.slice(visibleRange.start, visibleRange.end);
      const visiblePrices = getVisiblePrices(visibleChartData, chartType, latestPrice);
      const yAxisDomain = getYAxisDomain(visiblePrices, latestPrice);
      const handleHover = (index: number | null) => {
        setHoveredPoint(index === null ? null : (visibleChartData[index] ?? null));
      };

      if (chartType === "area") {
        return (
          <AreaChart
            data={visibleChartData}
            interval={interval}
            onHover={handleHover}
            yAxisDomain={yAxisDomain}
          />
        );
      }

      return (
        <CandlestickChart
          data={visibleChartData}
          interval={interval}
          onHover={handleHover}
          yAxisDomain={yAxisDomain}
        />
      );
    },
    [chartData, chartType, interval, latestPrice]
  );

  return (
    <article className="relative overflow-hidden rounded-[32px] border border-slate-800/90 bg-[linear-gradient(180deg,rgba(15,23,36,0.98),rgba(9,13,21,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_68%)] blur-2xl" />
      <div className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:gap-8 lg:pb-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {ticker ? ticker.name : `${symbol} Market View`}
          </h2>
          {activePoint ? (
            <p className="mt-4 text-sm text-slate-200 sm:text-base">
              O {formatCurrency(activePoint.open)}{" "}
              <span className="text-(--positive)">H {formatCurrency(activePoint.high)}</span>{" "}
              <span className="text-(--negative)">L {formatCurrency(activePoint.low)}</span>{" "}
              C {formatCurrency(activePoint.close)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-2.5">
            {HISTORY_INTERVAL_OPTIONS.map((option) => {
              const isActive = option.value === interval;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleIntervalChange(option.value)}
                  className={`rounded-full px-4 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                      : "border border-slate-700/80 bg-slate-950/45 text-slate-300 hover:border-cyan-400/35 hover:bg-slate-900/80"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:mt-8 lg:gap-5">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Session High</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(high)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Session Low</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(low)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Period Change</p>
          <p
            className={`mt-2 text-lg font-semibold ${
              seriesChange >= 0 ? "text-(--positive)" : "text-(--negative)"
            }`}
          >
            {formatPercent(seriesChange)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-start rounded-[28px] border border-slate-800/90 bg-slate-950/35 p-4 lg:mt-8">
        <ChartTypeToggle chartType={chartType} onChange={handleChartTypeChange} />
      </div>

      <div className="mt-5 lg:mt-6">
        <ChartContainer dataLength={chartData.length}>
          {renderChart}
        </ChartContainer>
      </div>
    </article>
  );
};

export default memo(PriceChartCard);
