"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-lihat-matpel-guru/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-lihat-matpel-guru/sort";
import { DataTableRowActions } from "@/components/ui/dt-lihat-matpel-guru/actions";
import { CheckCircle, X } from "lucide-react";

export const mataPelajaranColumns: ColumnDef<Schema>[] = [
  {
    accessorKey: "tahunAjaran",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tahun Ajaran" />
    ),
    cell: ({ row }) => {
      const tahunAjaran = row.getValue("tahunAjaran") as string;
      const formattedTahunAjaran = tahunAjaran ? `TA ${tahunAjaran}/${parseInt(tahunAjaran) + 1}` : "-";
      
      return (
        <div className="flex w-[120px] items-center">
          <span>{formattedTahunAjaran}</span>
        </div>
      );
    },
  },  
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Pelajaran" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[250px] truncate font-medium capitalize">
          {row.getValue("name")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "students",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Jumlah Siswa" />
    ),
    cell: ({ row }) => (
      <div className="flex w-[80px] items-center">
        <span>{row.getValue("students")}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("status");
      return (
        <div className="flex w-[100px] items-center">
          {type === "Active" ? (
            <CheckCircle size={20} className="mr-2 text-green-500" />
          ) : (
            <X size={20} className="mr-2 text-red-500" />
          )}
          <span className="capitalize">
            {type === "Active" ? "Aktif" : "Tidak Aktif"}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aksi" />
    ),
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
