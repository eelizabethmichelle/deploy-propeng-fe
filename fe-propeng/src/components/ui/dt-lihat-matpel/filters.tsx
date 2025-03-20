"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/dt-lihat-matpel/filters_clear";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/ui/dt-lihat-matpel/actions-menu";
import { TrashIcon, Check } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
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
  const router = useRouter();
  const allRows = table.getCoreRowModel().rows;

  const uniqueStatus = [
    ...new Set(allRows.map((row) => String(row.original.status)))
  ].map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: status === "Active" ? ArrowUpIcon : ArrowDownIcon
  }));


  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
  
    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
    const selectedRowIds = selectedRows
      .map((row) => row.id || row.kode)
      .filter((id) => id !== undefined);
  
    if (selectedRowIds.length === 0) {
      toast.error("Gagal menghapus! Tidak ada ID yang valid.");
      return;
    }
  
    let token: string | null = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  
    if (!token) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    }
  
    if (!token) {
      toast.error("Gagal menghapus! Token autentikasi tidak ditemukan.");
      return;
    }
  
    try {
      const deleteRequests = selectedRowIds.map(async (id) => {
        try {
          const res = await fetch(`/api/mata-pelajaran/hapus/`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id }),
          });

          if (!res.ok) {
            throw new Error(`Failed to delete mata pelajaran with ID ${id}`);
          }

          return "Deleted";
        } catch (error) {
          console.error(`Delete error for ID ${id}:`, error);
          return `Error deleting ID ${id}`;
        }
      });
  
      const deleteResponses = await Promise.all(deleteRequests);
      const successCount = deleteResponses.filter((res) => res === "Deleted").length;
  
      if (successCount > 0) {
        toast.success(`Berhasil menghapus ${successCount} mata pelajaran!`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Gagal menghapus mata pelajaran. Coba lagi nanti.");
      }
    } catch (error) {
      console.error("Batch delete error:", error);
      toast.error("Gagal menghapus beberapa mata pelajaran.");
    }
  };
      
  
  
  

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
                <DialogTitle>Hapus Mata Pelajaran?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedRowsCount} mata pelajaran ini?
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
