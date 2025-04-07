"use client";

import { useState, useEffect } from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import router from "next/router";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  reloadTrigger: number;
  triggerReload: () => void;
}

export function DataTableRowActions<TData>({ row, reloadTrigger, triggerReload }: DataTableRowActionsProps<TData>) {
  const data = row.original as any;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [namaKomponen, setNamaKomponen] = useState(data?.namaKomponen ?? "");
  const [bobotKomponen, setBobotKomponen] = useState(
    data?.bobotKomponen?.toString() ?? ""
  );

  useEffect(() => {
    setAccessToken(
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
  }, []);

  const handleEditSave = async () => {
    if (!accessToken) {
      toast.error("Gagal mengubah komponen. Token tidak ditemukan");
      router.push("/login")
      return;
    }

    if (!namaKomponen.trim()) {
      toast.error("Nama komponen tidak boleh kosong");
      return;
    }
  
    if (namaKomponen.length > 50) {
      toast.error("Nama komponen maksimal 50 karakter");
      return;
    }
  
    if (!bobotKomponen || isNaN(Number(bobotKomponen))) {
      toast.error("Bobot komponen harus berupa angka");
      return;
    }
  
    if (Number(bobotKomponen) < 1 || (Number(bobotKomponen)) > 100) {
      toast.error("Bobot komponen harus antara 1 hingga 100");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/komponen/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: data?.id,
          namaKomponen,
          bobotKomponen: parseFloat(bobotKomponen),
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengubah data komponen penilaian.");
      }

      toast.success("Komponen penilaian berhasil diubah.");
      triggerReload();
      setEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => {
              setDropdownOpen(false);
              setEditDialogOpen(true);
            }}
          >
            Ubah
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Komponen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nama Komponen"
              value={namaKomponen}
              onChange={(e) => setNamaKomponen(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Bobot Komponen (%)"
              value={bobotKomponen}
              onChange={(e) => setBobotKomponen(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              variant="secondary"
              onClick={() => setEditDialogOpen(false)}
              disabled={loading}
            >
              Kembali
            </Button>
            <Button onClick={handleEditSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}