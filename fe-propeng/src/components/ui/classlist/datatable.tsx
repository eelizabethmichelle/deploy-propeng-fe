"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classListColumns } from "./columns";
// import { DataTableColumnToggle } from "./action-menu"; // Use your new classlist's action-menu
// import { DataTableColumnToggle } from "./action-menu"; // Optional: make your own column visibility toggle
import { DataTableColumnHeader } from "./sort"; // Optional: make your own column header with sorting
import { DataTablePagination } from "./pagination";      // Optional: make your own filter/search bar
import { useState } from "react";
import { StudentClass } from "./schema";               // Your class schema

interface ClassListTableProps {
  data: StudentClass[];
}

export function ClassListTable({ data }: ClassListTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns: classListColumns as ColumnDef<StudentClass, any>[],
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar: If you want a search/filter */}
      {/* <DataTableToolbar table={table} /> */}

      {/* Table controls: Column visibility toggle, etc.
      <div className="flex items-center justify-end py-2 px-2">
        <DataTableColumnToggle table={table} />
      </div> */}

      <div className="rounded-md border bg-white">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="t"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={classListColumns.length}
                  className="h-24 text-center text-lg text-gray-500"
                >
                  Tidak ada kelas ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {/* If you want TanStack-style pagination, include this: */}
      {/* <DataTablePagination table={table} /> */}
    </div>
  );
}
