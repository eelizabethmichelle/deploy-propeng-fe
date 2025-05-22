"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

type SubjectData = {
  name: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  title?: string;
  data: SubjectData[];
  notes?: string[];
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;
    return (
      <div className="rounded-lg border bg-white p-3 text-sm shadow-md text-black min-w-[160px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-md" style={{ backgroundColor: color }} />
          <span className="font-semibold">{name}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Jumlah Siswa</span>
          <span className="font-medium text-black">{value}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default function DonutChart({ title, data, notes = [] }: DonutChartProps) {
  return (
    <Card className="w-full h-full min-w-[400px] mx-auto p-4 flex flex-col gap-y-4">
      {title && (
        <h2 className="font-semibold text-blue-900">{title}</h2>
      )}

      {/* Chart + Legend Row */}
      <div className="flex gap-4 flex-1">
        <div className="w-2/3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-1/3 flex flex-col justify-center space-y-2">
          {data.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-md"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-sm text-gray-700">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="flex flex-col gap-2 text-sm text-blue-900">
          {notes.map((note, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}