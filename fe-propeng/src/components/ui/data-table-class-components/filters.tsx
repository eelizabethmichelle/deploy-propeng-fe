// components/ui/data-table-class-components/filters.tsx
"use client";
import { Cross2Icon, ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/ui/data-table-class-components/actions-menu";
import { DataTableFacetedFilter } from "@/components/ui/data-table-class-components/filters-clear";
import { TrashIcon, Check } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner"

interface RowData {
  id: number;
  isActive: string;
}

// Update the DataTableToolbarProps to constrain TData to extend BaseData
interface DataTableToolbarProps<TData extends RowData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData extends RowData>({
  table
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const customToast = {
    success: (title: string, description: string) => {
      toast.success(title, {
        description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
      });
    },
    error: (title: string, description: string) => {
      toast.error(title, {
        description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
      });
    },
    warning: (title: string, description: string) => {
      toast.warning(title, {
        description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
      });
    }
  };

  const allRows = table.getCoreRowModel().rows;
  const uniqueStatus = [...new Set(allRows.map((row) => row.original.isActive))].map(
    (isActive) => ({
      value: isActive,  
      label: isActive ? "Aktif" : "Tidak Aktif",
    })
  );  

  console.log(uniqueStatus)

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);

      // Get selected row IDs
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const selectedIds = selectedRows.map(row => row.original.id);

      // Get selected row names for better error messages
      const selectedNames = selectedRows.map(row => {
        const data = row.original as any;
        return data.namaKelas || `ID: ${data.id}`;
      });

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

      const result = await response.json();

      // Close dialog
      setDeleteDialogOpen(false);

      // Check if there were any undeleted classes due to absensi
      if (result.message && result.message.includes("terkecuali kelas")) {
        // Parse the message to extract undeleted classes
        const messagePattern = /(\d+) kelas berhasil dihapus terkecuali kelas \[(.*?)\]/;
        const matches = result.message.match(messagePattern) || [];

        const deletedCount = parseInt(matches[1] || "0");
        const undeletedClassesStr = matches[2] || "";

        // Extract class names from the message
        const undeletedClasses = undeletedClassesStr
          .split(',')
          .map((cls: string) => cls.trim().replace(/'/g, ''))
          .filter(Boolean);

        const undeletedCount = undeletedClasses.length;

        if (deletedCount > 0 && undeletedCount > 0) {
          // Mixed case: Some classes were deleted, others weren't
          customToast.warning(
            "Penghapusan Sebagian Berhasil",
            `${deletedCount} kelas berhasil dihapus, ${undeletedCount} kelas tidak berhasil dihapus karena memiliki data absensi.`
          );
        } else if (deletedCount > 0) {
          // All selected classes were deleted
          customToast.success(
            "Kelas Dihapus!",
            `${deletedCount} kelas berhasil dihapus`
          );
        } else {
          // No classes were deleted
          customToast.error(
            "Gagal Menghapus Kelas",
            `${undeletedCount} kelas tidak dapat dihapus karena memiliki data absensi.`
          );
        }
      } else {
        // All classes were successfully deleted
        customToast.success(
          "Kelas Dihapus!",
          `${result.deletedCount || selectedIds.length} kelas berhasil dihapus`
        );
      }

      // Set flag to refresh data
      localStorage.setItem('kelas_data_refresh', 'true');

      // Clear selection
      table.resetRowSelection();

    } catch (error: any) {
      console.error("Error deleting classes:", error);

      // Show error toast
      customToast.error(
        "Gagal menghapus kelas",
        error.message || "Terjadi kesalahan saat menghapus kelas"
      );
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
        {table.getColumn("isActive") && (
          <DataTableFacetedFilter column={table.getColumn("isActive")} title="Status" options={uniqueStatus} />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
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
                Hapus ({selectedRowsCount})
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
                <DialogClose asChild>
                    <Button type="button" variant="neutral" disabled={isDeleting}>Batal</Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={handleDeleteConfirm}
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                  </Button>

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
