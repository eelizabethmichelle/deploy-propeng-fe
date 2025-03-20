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

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);

    // Munculkan toast setelah submit
    toast("", {
      description: (
        <div className="flex items-start gap-3">
          {/* Icon di kiri */}
          <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
            <Check className="text-background w-4 h-4" />
          </div>
          <div>
            {/* Judul toast */}
            <p className="text-lg font-semibold text-foreground font-sans">Kelas Dihapus!</p>
            {/* Deskripsi toast */}
            <p className="text-sm text-muted-foreground font-sans">
              Kelas berhasil dihapus
            </p>
          </div>
        </div>
      ),
      action: {
        label: (
          <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
            Tutup
          </span>
        ),
        onClick: () => console.log("Tutup"),
      },
    });
  };

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

      <div className="flex items-center gap-2">
        {selectedRowsCount > 0 && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <TrashIcon className="mr-2 size-4" aria-hidden="true" />
                Delete ({selectedRowsCount})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Hapus Akun?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedRowsCount} kelas ini?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-end">
                <div className="flex gap-4">
                  <Button type="button" onClick={handleDeleteConfirm} variant="secondary">
                    Ya, Hapus
                  </Button>
                  <DialogClose asChild>
                    <Button type="button">Batal</Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
