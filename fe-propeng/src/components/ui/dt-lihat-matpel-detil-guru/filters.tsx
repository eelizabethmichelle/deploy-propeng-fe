// components/ui/data-table-class-components/filters.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/ui/data-table-class-components/actions-menu";
import { TrashIcon, Check } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner"

interface RowData {
  tahunAjaran: string,
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-wrap items-center justify-between">
      <Toaster />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama, username, nisn..."
          value={table.getState().globalFilter ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* Tahun Ajaran filter has been removed */}
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
