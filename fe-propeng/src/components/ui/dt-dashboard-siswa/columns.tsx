"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-dashboard-siswa/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-dashboard-siswa/sort";
import { GradeDistributionChartSmall } from "../grade-distribution";

export const dashboardSiswaColumns: ColumnDef<Schema>[] = [
  {
    accessorKey: "namaSiswa",
    header: ({ column }) => (
      <div className="whitespace-normal text-center w-[120px]">
        <DataTableColumnHeader column={column} title="Nama Siswa" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="truncate w-[120px] font-medium capitalize">
        {row.getValue("namaSiswa")}
      </div>
    ),
    size: 140,
  },
  {
    accessorKey: "rerataNilai",
    header: ({ column }) => (
      <div className="whitespace-normal text-center w-[100px] leading-snug">
        <DataTableColumnHeader column={column} title="Rerata Nilai" />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("rerataNilai") as number;
      let color = "text-green-600";
      if (value < 75) color = "text-red-600";
      else if (value < 83) color = "text-yellow-600";

      return (
        <div className="w-[80px] text-center">
          <span className={`font-semibold ${color}`}>{value}</span>
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "nilaiPengetahuan",
    header: ({ column }) => (
      <div className="whitespace-normal text-center w-[100px] leading-snug">
        <DataTableColumnHeader column={column} title="Pengetahuan" />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("nilaiPengetahuan") as number;
      let color = "text-green-600";
      if (value < 75) color = "text-red-600";
      else if (value < 83) color = "text-yellow-600";

      return (
        <div className="w-[80px] text-center">
          <span className={`font-semibold ${color}`}>{value}</span>
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "nilaiKeterampilan",
    header: ({ column }) => (
      <div className="whitespace-normal text-center w-[100px] leading-snug">
        <DataTableColumnHeader column={column} title="Keterampilan" />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("nilaiKeterampilan") as number;
      let color = "text-green-600";
      if (value < 75) color = "text-red-600";
      else if (value < 83) color = "text-yellow-600";

      return (
        <div className="w-[80px] text-center">
          <span className={`font-semibold ${color}`}>{value}</span>
        </div>
      );
    },
    size: 100,
  },
];