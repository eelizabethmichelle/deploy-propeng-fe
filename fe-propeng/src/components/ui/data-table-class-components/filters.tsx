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

// Define a base interface for your data that includes the id property
interface BaseData {
  id: string;
}

// Update the DataTableToolbarProps to constrain TData to extend BaseData
interface DataTableToolbarProps<TData extends BaseData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData extends BaseData>({
  table
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);

      // Get selected row IDs
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const selectedIds = selectedRows.map(row => row.original.id);

      // Get auth token
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

      // Make API request to delete multiple classes using the Next.js API route
      const response = await fetch("/api/kelas/delete-kelas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ class_ids: selectedIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errorMessage || `Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      // Close dialog
      setDeleteDialogOpen(false);

      // Show success toast
      toast("", {
        description: (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
              <Check className="text-background w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground font-sans">Kelas Dihapus!</p>
              <p className="text-sm text-muted-foreground font-sans">
                {selectedIds.length} kelas berhasil dihapus
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

      // Set flag to refresh data
      localStorage.setItem('kelas_data_refresh', 'true');

      // Clear selection
      table.resetRowSelection();

    } catch (error: any) {
      console.error("Error deleting classes:", error);

      // Show error toast
      toast.error("Gagal menghapus kelas", {
        description: error.message || "Terjadi kesalahan saat menghapus kelas"
      });
    } finally {
      setIsDeleting(false);
    }
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
                <DialogTitle>Hapus Kelas?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedRowsCount} kelas ini?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-end">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={handleDeleteConfirm}
                    variant="secondary"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" disabled={isDeleting}>Batal</Button>
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
