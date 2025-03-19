"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-lihat-murid/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-lihat-murid/sort";
import { DataTableRowActions } from "@/components/ui/dt-lihat-murid/actions";
import { TrendingUp, TrendingDown, CheckCircle, Cross, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Schema>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium capitalize">
            {row.getValue("name")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium capitalize">
            {row.getValue("username")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "nisn",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="NISN" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium capitalize">
            {row.getValue("nisn")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "angkatan",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Angkatan" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex w-[100px] items-center">
            <span className="capitalize"> {row.getValue("angkatan")}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
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
          <span className="capitalize"> {row.getValue("status")}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
