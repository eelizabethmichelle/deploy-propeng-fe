// src/components/ui/data-table-detail-class-components/data-table.tsx
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
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
import { useState, useEffect, useRef } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowSelectionChange?: (selectedRows: string[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Use a ref to track previous selection state to prevent infinite loops
  const prevRowSelectionRef = useRef<string>("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  // Pass selected row IDs to parent component when selection changes
  useEffect(() => {
    if (!onRowSelectionChange) return;
    
    const selectedRows = table.getSelectedRowModel().rows.map(row => {
      // Log the row data to see its structure
      console.log("Selected row data:", row.original);
      
      // Try to extract the ID safely
      const rowData = row.original as any;
      let id: string;
      
      // Check different possible ID fields
      if (rowData.id !== undefined) {
        id = rowData.id.toString();
      } else if (rowData.user_id !== undefined) {
        id = rowData.user_id.toString();
      } else if (rowData.user && rowData.user.id !== undefined) {
        id = rowData.user.id.toString();
      } else {
        console.error("Could not find ID in row data:", rowData);
        return null;
      }
      
      console.log("Extracted ID:", id);
      return id;
    }).filter(id => id !== null) as string[];
    
    console.log("Final selected IDs:", selectedRows);
    
    // Convert to string for comparison to avoid reference equality issues
    const selectionString = JSON.stringify(selectedRows);
    
    // Only update if selection has changed
    if (prevRowSelectionRef.current !== selectionString) {
      prevRowSelectionRef.current = selectionString;
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onRowSelectionChange]);

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Belum ada Siswa yang terdaftar pada Mata Pelajaran ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-y-4 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} dari{" "}
          {table.getFilteredRowModel().rows.length} baris terpilih.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Kembali
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Lanjut
          </Button>
        </div>
      </div>
    </div>
  );
}