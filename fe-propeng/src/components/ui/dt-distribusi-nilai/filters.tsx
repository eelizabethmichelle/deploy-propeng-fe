"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/dt-distribusi-nilai/filters_clear";
import { Toaster } from "@/components/ui/sonner";

interface RowData {
  id?: number;
  kode: string;
  status: string;   // "Di bawah Rata-Rata" | "Di atas Rata-Rata"
  tahunAjaran: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const allRows = table.getCoreRowModel().rows;
  const presentStatuses = new Set(allRows.map(r => r.original.status));

  const statusOptions = [
    { value: "Di bawah Rata-Rata", label: "Di bawah Rata-Rata", icon: ArrowDownIcon },
    { value: "Di atas Rata-Rata",  label: "Di atas Rata-Rata",  icon: ArrowUpIcon   },
  ].filter(o => presentStatuses.has(o.value));

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between">
      <Toaster />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama mata pelajaran, nama guru, atau kode mata pelajaran"
          value={table.getState().globalFilter ?? ""}
          onChange={e => table.setGlobalFilter(e.target.value)}
          className="h-8 w-[150px] lg:w-[500px]"
        />

        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statusOptions}
          />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
