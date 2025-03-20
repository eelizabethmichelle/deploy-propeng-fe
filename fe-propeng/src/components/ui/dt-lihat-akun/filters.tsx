"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/dt-lihat-akun/filters_clear";
import { DataTableViewOptions } from "@/components/ui/dt-lihat-akun/actions-menu";
import { TrashIcon, Check } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface RowData {
  id: string;
  isActive: string;
  role: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const router = useRouter();
  const allRows = table.getCoreRowModel().rows;
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const uniqueStatus = [...new Set(allRows.map((row) => row.original.isActive))].map(
    (isActive) => ({
      value: (isActive),
      label: isActive ? "Aktif" : "Tidak Aktif",
    })
  );

  const uniqueRole = [...new Set(allRows.map((row) => row.original.role))].map((role) => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
  }));

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = selectedRows.length;

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  useEffect(() => {
    setAccessToken(
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
  }, []);

  const handleDeleteConfirm = async () => {
    if (!accessToken) {
      toast.error("Gagal menghapus akun. Token tidak ditemukan");
      router.push("/login")
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      for (let i = 0; i < selectedRows.length; i++) {
        const row = selectedRows[i];

        const response = await fetch(`/api/account/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ id: row.original.id }),
        });

        if (!response.ok) {
          throw new Error(`Gagal menghapus akun dengan ID: ${row.original.id}`);
        }

        setProgress(((i + 1) / selectedRows.length) * 100);
      }

      if (selectedRows.length > 1) {
        toast.success("Semua akun pengguna berhasil dihapus");
      } else {
        toast.success("Akun pengguna berhasil dihapus")
      }
      table.resetRowSelection();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting accounts:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus akun pengguna");
    } finally {
      setLoading(false);
      setProgress(0);
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
        {table.getColumn("role") && (
          <DataTableFacetedFilter column={table.getColumn("role")} title="Role" options={uniqueRole} />
        )}
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
              <Button variant="outline">
                <TrashIcon className="mr-2 size-4" aria-hidden="true" />
                Delete ({selectedRowsCount})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Hapus Akun?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedRowsCount} akun ini?
                </DialogDescription>
              </DialogHeader>

              {loading && <Progress value={progress} className="mt-4" />}

              <DialogFooter className="sm:justify-end">
                <div className="flex gap-4">
                  <Button type="button" onClick={handleDeleteConfirm} variant="secondary" disabled={loading}>
                    {loading ? "Menghapus..." : "Ya, Hapus"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" disabled={loading}>Batal</Button>
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