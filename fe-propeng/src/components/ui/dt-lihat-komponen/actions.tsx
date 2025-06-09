"use client";

import { useState, useEffect } from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  DialogClose,
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
  const [bobotKomponen, setBobotKomponen] = useState(data?.bobotKomponen?.toString() ?? "");
  const [tipeKomponen, setTipeKomponen] = useState(data?.tipeKomponen?.toString() ?? "");

  useEffect(() => {
    setAccessToken(
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
  }, []);

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

  const handleEditSave = async () => {
    if (!accessToken) {
      customToast.error("Gagal mengubah Komponen Penilaian", "Token tidak ditemukan");
      router.push("/login")
      return;
    }

    if (!namaKomponen.trim()) {
      customToast.error("Gagal mengubah Komponen Penilaian", "Nama Komponen Penilaian tidak boleh kosong");
      return;
    }
  
    if (namaKomponen.length > 50) {
      customToast.error("Gagal mengubah Komponen Penilaian", "Nama Komponen Penilaian maksimal memiliki panjang 50 karakter");
      return;
    }
  
    if (!bobotKomponen || isNaN(Number(bobotKomponen))) {
      customToast.error("Gagal mengubah Komponen Penilaian", "Bobot Komponen Penilaian harus berupa angka");
      return;
    }
  
    if (Number(bobotKomponen) < 1 || (Number(bobotKomponen)) > 100) {
      customToast.error("Gagal mengubah Komponen Penilaian", "Bobot Komponen Penilaian harus bernilai di antara 1 hingga 100");
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
      customToast.success("Berhasil mengubah Komponen Penilaian", "Berhasil mengubah Komponen Penilaian")
      triggerReload();
      setEditDialogOpen(false);
    } catch (error: any) {
      customToast.error("Gagal mengubah Komponen Penilaian", error.message || "Terjadi kesalahan saat menyimpan perubahan");
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Komponen Penilaian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="nama-komponen" className="text-sm font-medium">
                Nama Komponen
              </label>
              <Input
                id="nama-komponen"
                name="namaKomponen"
                placeholder="Contoh: Ulangan Harian 1"
                value={namaKomponen}
                onChange={(e) => {
                  const input = e.target.value;
                  const formatted = input
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                  setNamaKomponen(formatted);
                }}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="bobot-komponen" className="text-sm font-medium">
                Bobot Komponen (%)
              </label>
              <Input
                id="bobot-komponen"
                name="bobotKomponen"
                type="number"
                placeholder="Contoh: 15"
                value={bobotKomponen}
                onChange={(e) => setBobotKomponen(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2 pt-2">
              <label className="text-sm font-medium">Tipe Komponen</label>
              <RadioGroup
                name="jenisKomponen"
                value={tipeKomponen}
                className="flex space-x-4"
                disabled
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Pengetahuan" id="pengetahuan" />
                  <label htmlFor="pengetahuan" className="text-sm">
                    Pengetahuan
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Keterampilan" id="keterampilan" />
                  <label htmlFor="keterampilan" className="text-sm">
                    Keterampilan
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="secondary" disabled={loading}>
                Kembali
              </Button>
            </DialogClose>
            <Button onClick={handleEditSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}