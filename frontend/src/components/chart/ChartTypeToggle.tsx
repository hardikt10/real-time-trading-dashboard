import type { ChartType } from "../../types/chart";

interface ChartTypeToggleProps {
  chartType: ChartType;
  onChange: (chartType: ChartType) => void;
}

const CHART_TYPE_OPTIONS: Array<{ label: string; value: ChartType }> = [
  { label: "Candles", value: "candles" },
  { label: "Area", value: "area" }
];

export const ChartTypeToggle = ({ chartType, onChange }: ChartTypeToggleProps) => (
  <div className="flex w-full rounded-full border border-slate-700/80 bg-slate-950/70 p-1 sm:w-auto">
    {CHART_TYPE_OPTIONS.map((option) => {
      const isActive = option.value === chartType;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-full px-4 py-2.5 text-sm transition sm:flex-none ${
            isActive
              ? "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.16)]"
              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
