// columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./sort";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, X } from "lucide-react";
import { DataTableActions } from "./actions";

export type Class = {
  id: string;
  namaKelas: string;
  tahunAjaran: string;
  waliKelas: string;
  totalSiswa: number;
  isActive: boolean;
};

export const columns: ColumnDef<Class>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "namaKelas",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Kelas" />
    ),
    cell: ({ row }) => (
      <div className="w-[150px] capitalize">{row.getValue("namaKelas")}</div>
    ),
  },
  {
    accessorKey: "tahunAjaran",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tahun Ajaran" />
    ),
    cell: ({ row }) => {
      const year = parseInt(row.getValue("tahunAjaran"));
      return (
        <div className="w-[100px]">
          TA {year}/{year + 1}
        </div>
      );
    },
  },
  {
    accessorKey: "waliKelas",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wali Kelas" />
    ),
    cell: ({ row }) => (
      <div className="w-[150px] capitalize">{row.getValue("waliKelas")}</div>
    ),
  },
  {
    accessorKey: "totalSiswa",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Siswa" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px]">{row.getValue("totalSiswa")}</div>
    ),
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <div className="flex w-[100px] items-center">
          {isActive ? (
            <CheckCircle size={20} className="mr-2 text-green-500" />
          ) : (
            <X size={20} className="mr-2 text-red-500" />
          )}
          <span className="capitalize">
            {isActive ? "Aktif" : "Tidak Aktif"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aksi" />
    ),
    cell: ({ row }) => <DataTableActions row={row} />,
  },
];
