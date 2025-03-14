"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/dt-lihat-murid/filters_clear";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/ui/dt-lihat-murid/actions-menu";
import { TrashIcon } from "lucide-react";

interface RowData {
  status: string;
  angkatan: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const allRows = table.getCoreRowModel().rows;

  // Ambil kategori unik dari data yang ada di tabel
  const uniqueStatus = [
  ...new Set(allRows.map((row) => String(row.original.status))) // Konversi ke string
  ].map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: status === "Active" ? ArrowUpIcon : ArrowDownIcon
  }));

  // Ambil status unik dari data yang ada di tabel
  const uniqueAngkatan = [
    ...new Set(allRows.map((row) => row.original.angkatan)) // Tanpa konversi string
  ].map((angkatan) => ({
    value: angkatan,
    label: String(angkatan), // Pastikan label dalam bentuk string
  }));


  const isFiltered = table.getState().columnFilters.length > 0;

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const handleDateSelect = ({ from, to }: { from: Date; to: Date }) => {
    setDateRange({ from, to });
    table.getColumn("date")?.setFilterValue([from, to]);
  };

  return (
    <div className="flex flex-wrap items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama, username, nisn..."
          value={table.getState().globalFilter ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("angkatan") && (
          <DataTableFacetedFilter
            column={table.getColumn("angkatan")}
            title="Angkatan"
            options={uniqueAngkatan}
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={uniqueStatus}
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

      <div className="flex items-center gap-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <Button variant="outline" size="sm">
            <TrashIcon className="mr-2 size-4" aria-hidden="true" />
            Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        ) : null}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
