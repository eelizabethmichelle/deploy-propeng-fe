// Contoh file: @/components/ui/subject-list/subject-list-data-table.tsx

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel, // Pastikan filter model diimpor
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
import { Button } from "@/components/ui/button";
// Impor schema untuk tipe data dan FilterOption
import { SubjectSummary } from "./schema";
import { subjectListColumns } from "./subject-list-columns"; // Impor definisi kolom
import { SubjectListToolbar } from './subject-list-table-toolbar';

// Tipe FilterOption (bisa diimpor dari schema atau didefinisikan di sini/atas)
interface FilterOption { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; }

// ---- 👇 INTERFACE PROPS YANG PERLU DIUPDATE 👇 ----
interface SubjectListDataTableProps {
  data: SubjectSummary[];
  // Tambahkan dua properti ini agar komponen bisa menerimanya:
  uniqueComponentOptions: FilterOption[];
  uniqueAcademicYearOptions: FilterOption[];
}

export function SubjectListDataTable({
  data,
  uniqueComponentOptions,      // <-- Terima prop di sini
  uniqueAcademicYearOptions, // <-- Terima prop di sini
}: SubjectListDataTableProps) { // Gunakan interface yang sudah diupdate

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns: subjectListColumns, // Gunakan kolom yang sudah didefinisikan
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(), // Aktifkan model filter
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
      {/* ---- 👇 TERUSKAN PROPS KE TOOLBAR 👇 ---- */}
      <SubjectListToolbar
        table={table}
        uniqueComponentOptions={uniqueComponentOptions}      // <-- Teruskan ke Toolbar
        uniqueAcademicYearOptions={uniqueAcademicYearOptions} // <-- Teruskan ke Toolbar
      />
      <div className="rounded-md border bg-white"> {/* Tambah bg-white jika perlu */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={subjectListColumns.length} className="h-24 text-center">
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls (jika ada) */}
      {/* <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div> */}
    </div>
  );
}