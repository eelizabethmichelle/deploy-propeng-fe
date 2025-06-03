"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-end space-x-2 py-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Sebelumnya
      </Button>
      <span className="text-sm">
        Halaman{" "}
        <strong>
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Selanjutnya
      </Button>
    </div>
  );
}
