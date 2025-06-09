// components/ui/classlist/columns.tsx

import { StudentClass } from "./schema";
import { DataTableColumnHeader } from "./sort";
import { ClassListRowActions } from "./actions";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";

export const classListColumns: ColumnDef<StudentClass>[] = [
  {
    accessorKey: "no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="No" />
    ),
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
    size: 48,
  },
  {
    accessorKey: "nama",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Kelas" />
    ),
    cell: ({ row }) => row.original.nama,
    enableSorting: true,
    size: 180,
  },
  {
    accessorKey: "tahun_ajaran",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tahun Ajaran" />
    ),
    cell: ({ row }) => row.original.tahun_ajaran,
    enableSorting: true,
    size: 110,
  },
  {
    accessorKey: "guru",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wali Kelas" />
    ),
    cell: ({ row }) => row.original.guru,
    enableSorting: true,
    size: 160,
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <ClassListRowActions classId={row.original.id} />
    ),
    enableSorting: false,
    size: 60,
  }
];
