// components/ui/evalguru-overview-tahunan/overview-tahunan-data-table.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FlattenedEvaluasiGuruOverview, FilterOption } from "./schema"; // Sesuaikan path
import { OverviewTahunanToolbar } from './overview-tahunan-table-toolbar';
import { DataTablePagination } from './pagination';
import { overviewTahunanColumns } from './overview-tahunan-columns';

interface OverviewTahunanDataTableProps {
  data: FlattenedEvaluasiGuruOverview[];
  tahunAjaranOptions: FilterOption[];
  guruOptions: FilterOption[]; // Tambahkan
  mataPelajaranOptions: FilterOption[]; // Tambahkan
}
export function OverviewTahunanDataTable({ 
    data, 
    tahunAjaranOptions,
    guruOptions,
    mataPelajaranOptions,
}: OverviewTahunanDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns: overviewTahunanColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <OverviewTahunanToolbar 
        table={table} 
        tahunAjaranOptions={tahunAjaranOptions}
        guruOptions={guruOptions}
        mataPelajaranOptions={mataPelajaranOptions}
      />
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() !== 150 ? `${header.column.getSize()}px` : undefined }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={overviewTahunanColumns.length} className="h-24 text-center">
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}