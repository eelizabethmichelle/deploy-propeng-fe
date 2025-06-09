"use client";

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center py-2">
      <Input
        placeholder="Cari kelas..."
        value={table.getState().globalFilter ?? ""}
        onChange={event => table.setGlobalFilter(event.target.value)}
        className="w-[200px] mr-2"
      />
      {/* You can add more filter UI here */}
    </div>
  );
}
