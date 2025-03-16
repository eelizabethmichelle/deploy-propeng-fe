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
  angkatan: string;
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

  const uniqueAngkatan = [
    ...new Set(allRows.map((row) => row.original.angkatan))
  ].map((angkatan) => ({
    value: angkatan,
    label: String(angkatan),
  }));

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    
  
    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
    console.log("Selected Rows Data:", selectedRows);
  
    const selectedRowIds = selectedRows
      .map((row) => row.id || row.kode)
      .filter((id) => id !== undefined);
  
    console.log("Selected Row IDs:", selectedRowIds);
  
    if (selectedRowIds.length === 0) {
      toast.error("Gagal menghapus! Tidak ada ID yang valid.");
      return;
    }
  
    // Ambil token autentikasi dari localStorage atau sessionStorage
    // const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  
    // if (!token) {
    //   toast.error("Gagal menghapus! Token autentikasi tidak ditemukan.");
    //   console.error("Token authentication is missing.");
    //   return;
    // }
    let token: string | null = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

if (!token) {
  // Wait for a short delay to allow token to be set
  await new Promise(resolve => setTimeout(resolve, 500));
  token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"); // ✅ Just update the existing variable
}

  
    try {
      const deleteResponses = await Promise.all(
        selectedRowIds.map(async (id) => {
          const res = await fetch(`http://localhost:8000/api/matpel/delete/${id}/`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` // Tambahkan token di header
            }
          });
  
          if (!res.ok) {
            throw new Error(`Gagal menghapus ID ${id}: ${res.statusText}`);
          }

          if (res.status !== 204) {
            return res.json(); // Only parse JSON if response is not 204
          }
  
        })
      );
  
      console.log("Delete responses:", deleteResponses);
      toast.success(`Berhasil menghapus ${selectedRowIds.length} mata pelajaran!`);
      setTimeout(() => {
        window.location.reload(); // 🔄 Hard reload the page
      }, 1000);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus mata pelajaran. Coba lagi nanti.");
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
        {table.getColumn("angkatan") && (
          <DataTableFacetedFilter
            column={table.getColumn("angkatan")}
            title="Angkatan"
            options={uniqueAngkatan}
          />
        )}
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
              <Button variant="outline">
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
