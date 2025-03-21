"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-lihat-akun/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-lihat-akun/sort";
import { DataTableRowActions } from "@/components/ui/dt-lihat-akun/actions";
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
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium capitalize">
            {row.getValue("role")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") === true;
      return (
         <div className="flex w-[100px] items-center">
          {isActive ? (
            <>
              <CheckCircle size={20} className="text-green-600" />
              <span className="font-medium">Aktif</span>
            </>
          ) : (
            <>
              <X size={20} className="text-red-500" />
              <span className="font-medium">Tidak Aktif</span>
            </>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },  
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
