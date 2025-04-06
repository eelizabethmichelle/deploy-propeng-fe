"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/dt-lihat-matpel-guru/filters_clear";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";

interface RowData {
  id?: number; // Bisa undefined jika API tidak mengembalikan
  kode: string; // Pastikan kode ada jika id tidak tersedia
  status: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const allRows = table.getCoreRowModel().rows;

  const uniqueStatus = [
    ...new Set(allRows.map((row) => String(row.original.status)))
  ].map((status) => ({
    value: status,
    label: status === "Active" ? "Aktif" : "Tidak Aktif",
    icon: status === "Active" ? ArrowUpIcon : ArrowDownIcon
  }));

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between">
      <Toaster />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama mata pelajaran, nama guru, atau kode mata pelajaran"
          value={table.getState().globalFilter ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[500px]"
        />
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
    </div>
  );
}
