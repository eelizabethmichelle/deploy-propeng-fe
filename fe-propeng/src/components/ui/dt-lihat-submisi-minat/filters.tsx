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
    label: status === "Active" ? "Aktif" : "Tidak Aktif",
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

          const errorData = await res.json();

          if (!res.ok) {
            if (errorData.error === "Has associated grades") {
              return { status: "has_grades", id };
            }
            return { status: "error", id, message: errorData.message };
          }

          return { status: "success", id };
        } catch (error) {
          console.error(`Delete error for ID ${id}:`, error);
          return { status: "error", id, message: `Error deleting ID ${id}` };
        }
      });
  
      const deleteResponses = await Promise.all(deleteRequests);
      
      // Check for different response types
      const hasGradesResponses = deleteResponses.filter(res => res.status === "has_grades");
      const successResponses = deleteResponses.filter(res => res.status === "success");
      const errorResponses = deleteResponses.filter(res => res.status === "error");

      // Handle cases with associated grades
      if (hasGradesResponses.length > 0) {
        if (hasGradesResponses.length === deleteResponses.length) {
          // All selected items have grades
          toast.error("Tidak dapat menghapus mata pelajaran karena masih memiliki nilai terkait. Harap hapus nilai terlebih dahulu.");
        } else {
          // Some items have grades, some don't
          toast.error(`${hasGradesResponses.length} mata pelajaran tidak dapat dihapus karena masih memiliki nilai terkait.`);
        }
      }

      // Handle successful deletions
      if (successResponses.length > 0) {
        toast.success(`Berhasil menghapus ${successResponses.length} mata pelajaran!`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      // Handle other errors
      if (errorResponses.length > 0) {
        console.error("Errors during deletion:", errorResponses);
        toast.error(`Gagal menghapus ${errorResponses.length} mata pelajaran. Coba lagi nanti.`);
      }

    } catch (error) {
      console.error("Batch delete error:", error);
      toast.error("Gagal menghapus mata pelajaran. Coba lagi nanti.");
    }
  };  

  return (
    <div className="flex flex-wrap items-center justify-between">
      <Toaster />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama siswa"
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
    </div>
  );
}
