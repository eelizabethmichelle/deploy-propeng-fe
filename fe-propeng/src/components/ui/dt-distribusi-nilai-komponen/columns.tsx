"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-distribusi-nilai-komponen/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-distribusi-nilai-komponen/sort";
import { GradeDistributionChartSmall } from "../grade-distribution";

export const distribusiNilaiKomponenColumns: ColumnDef<Schema>[] = [
  {
    accessorKey: "namaMataPelajaran",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Mata Pelajaran" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[200px] truncate font-medium capitalize">
          {row.getValue("namaMataPelajaran")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "rerataNilai",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rerata Nilai" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("rerataNilai") as number;
      let color = "text-green-600";
      if (value < 75) color = "text-red-600";
      else if (value < 83) color = "text-yellow-600";

      return (
        <div className="flex w-[70px] justify-center items-center text-center ">
          <span className={`font-semibold ${color}`}>{value}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "distribusiNilai",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Distribusi Nilai" />
    ),
    cell: ({ row }) => {
      const distribusi = row.getValue("distribusiNilai") as {
        a: number;
        b: number;
        c: number;
        d: number;
      };

      return (
        <div className="flex max-w-[150px] items-center">
          <GradeDistributionChartSmall a={distribusi.a} b={distribusi.b} c={distribusi.c} d={distribusi.d} />
        </div>
      );
    },
  },
];