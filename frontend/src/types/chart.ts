import type { HistoryCandle } from "../types";

export type ChartType = "candles" | "area";

export interface ChartPoint extends HistoryCandle {
  body: [number, number];
  isBullish: boolean;
  price: number;
  wick: [number, number];
}

export interface VisibleRange {
  end: number;
  start: number;
}

export interface ChartMouseState {
  activeTooltipIndex?: number | string | null;
  isTooltipActive?: boolean;
}

export interface CrosshairOverlayProps {
  height?: number;
  left?: number;
  points?: Array<{ x: number; y: number }>;
  top?: number;
  width?: number;
}
