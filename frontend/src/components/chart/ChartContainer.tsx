import type { ReactNode } from "react";
import type { VisibleRange } from "../../types/chart";

interface ChartContainerProps {
  children: (visibleRange: VisibleRange) => ReactNode;
  dataLength: number;
}

export const ChartContainer = ({ children, dataLength }: ChartContainerProps) => (
  <div className="rounded-[28px] border border-slate-800/90 bg-[#0a1020]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
    <div className="relative h-80 w-full overflow-hidden rounded-2xl sm:h-96 lg:h-100">
      {children({
        start: 0,
        end: dataLength
      })}
    </div>
  </div>
);
