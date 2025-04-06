"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-lihat-komponen/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-lihat-komponen/sort";
import { DataTableRowActions } from "@/components/ui/dt-lihat-komponen/actions";
import { Checkbox } from "@/components/ui/checkbox";

export const komponenColumns: ColumnDef<Schema>[] = [
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
    accessorKey: "namaKomponen",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Komponen" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium capitalize">
            {row.getValue("namaKomponen")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "bobotKomponen",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bobot Komponen (dalam %)" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium capitalize">
            {row.getValue("bobotKomponen")}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
