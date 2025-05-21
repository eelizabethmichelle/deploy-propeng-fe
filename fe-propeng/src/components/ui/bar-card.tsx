import React from "react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

type ThreeBarStatCardProps = {
  titleColor?: string;
  title: string;
  subtitle: string;
  description: string;
  columns: {
    label: string;
    value: number;
    color?: string;
  }[];
};

export function ThreeBarStatCard({
    titleColor = "text-blue-900",
    title,
    subtitle,
    description,
    columns,
  }: ThreeBarStatCardProps) {
    const total = columns.reduce((sum, col) => sum + col.value, 0);
  
    return (
      <div className="flex flex-col w-full h-full rounded-lg border border-gray-200 p-4 bg-white dark:bg-black text-center space-y-2">
        <div className={cn("text-3xl font-semibold", titleColor)}>{title}</div>
        <div className={cn("text-lg font-medium", titleColor)}>{subtitle}</div>
        <p className="text-sm text-blue-900 whitespace-pre-line">{description}</p>
  
        <div className="flex flex-col gap-3 pt-3">
          {columns.map((col, index) => {
            const percent = total > 0 ? (col.value / total) * 100 : 0;
            const color = col.color ?? "bg-blue-900";
  
            return (
              <div key={index} className="flex items-center w-full">
                {/* LABEL */}
                <div className="w-[25%] text-left text-sm font-medium text-blue-900">
                  {col.label}
                </div>
  
                {/* BAR */}
                <div className="w-[50%] h-6 rounded bg-blue-100 relative overflow-hidden">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div
                        className={cn("h-6 rounded cursor-pointer", color)}
                        style={{
                          width: `${percent}%`
                        }}
                      />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-40 p-3 rounded-lg border bg-white dark:bg-gray-900 shadow text-black">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-lg ${color}`} />
                        <span className="font-semibold text-sm">{col.label}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Jumlah Siswa</span>
                        <span className="font-medium">{col.value}</span>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
  
                {/* PERCENTAGE */}
                <div className="w-[25%] text-right text-sm font-medium text-gray-500">
                  {Math.round(percent)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }