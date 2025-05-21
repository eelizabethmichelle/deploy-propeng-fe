import React from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

type GradeDistributionChartProps = {
  a: number;
  b: number;
  c: number;
  d: number;
};

const segmentsMeta = [
  { label: "A", color: "bg-green-300", text: "text-green-900" },
  { label: "B", color: "bg-green-200", text: "text-green-900" },
  { label: "C", color: "bg-yellow-200", text: "text-yellow-900" },
  { label: "D", color: "bg-red-200", text: "text-red-900" },
];

export function GradeDistributionChart({ a, b, c, d }: GradeDistributionChartProps) {
  const total = a + b + c + d;

  const calculatePercentage = (count: number) =>
    total === 0 ? 0 : (count / total) * 100;

  const segments = segmentsMeta.map((seg) => {
    const count = { A: a, B: b, C: c, D: d }[seg.label as "A" | "B" | "C" | "D"];
    const percent =
      total === 0 ? 100 / segmentsMeta.length : (count / total) * 100;
    return { ...seg, count, percent };
  });

  return (
    <div className="flex w-full h-16 rounded overflow-hidden text-black">
      {segments.map((seg) => {
        const percent = calculatePercentage(seg.count);
        return (
          <HoverCard key={seg.label}>
            <HoverCardTrigger asChild>
              <div
                className={`${seg.color} ${seg.text} flex flex-col items-center justify-center cursor-default`}
                style={{ width: `${percent}%`, minWidth: "20px" }}
              >
                <span className="font-bold">{seg.label}</span>
                <span className="text-xs font-normal">{Math.round(percent)}%</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-40 p-3 rounded-lg border bg-white dark:bg-gray-900 shadow text-black">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-lg ${seg.color}`} />
                <span className="font-semibold text-sm">{seg.label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Jumlah Siswa</span>
                <span className="font-medium">{seg.count}</span>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}

export function GradeDistributionChartSmall({ a, b, c, d }: GradeDistributionChartProps) {
  const total = a + b + c + d;

  const calculatePercentage = (count: number) =>
    total === 0 ? 0 : (count / total) * 100;

  const segments = segmentsMeta.map((seg) => {
    const count = { A: a, B: b, C: c, D: d }[seg.label as "A" | "B" | "C" | "D"];
    const percent =
      total === 0 ? 100 / segmentsMeta.length : (count / total) * 100;
    return { ...seg, count, percent };
  });

  return (
    <div className="flex w-full h-6 rounded overflow-hidden text-black">
      {segments.map((seg) => {
        const percent = calculatePercentage(seg.count);
        return (
          <HoverCard key={seg.label}>
            <HoverCardTrigger asChild>
              <div
                className={`${seg.color} ${seg.text} flex flex-col items-center justify-center cursor-default`}
                style={{ width: `${percent}%`, minWidth: "16px" }}
              >
                <span className="text-[10px] leading-none font-semibold">{seg.label}</span>
                <span className="text-[9px] leading-none font-normal">{Math.round(percent)}%</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-40 p-3 rounded-lg border bg-white dark:bg-gray-900 shadow text-black">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-lg ${seg.color}`} />
                <span className="font-semibold text-sm">{seg.label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Jumlah Siswa</span>
                <span className="font-medium">{seg.count}</span>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
