"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrashIcon, Plus } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface RowData {
  id: string;
  isActive: string;
  role: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
  mataPelajaran: String;
  reloadTrigger: number;
  triggerReload: () => void;
  title: String;
}

export function DataTableToolbar({
  table,
  mataPelajaran,
  reloadTrigger,
  triggerReload,
  title,
}: DataTableToolbarProps) {
  const router = useRouter();
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRowsCount = selectedRows.length;

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [namaKomponen, setNamaKomponen] = useState("");
  const [bobotKomponen, setBobotKomponen] = useState("");
  const [tipeKomponen, setTipeKomponen] = useState(
    title === "Pengetahuan" ? "Pengetahuan" : "Keterampilan"
  );  
  const [komponenList, setKomponenList] = useState<any[]>([]);

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

  useEffect(() => {
    setAccessToken(
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
  }, []);

  const handleDeleteConfirm = async () => {
    if (!accessToken) {
      customToast.error("Gagal menghapus Komponen Penilaian", "Token tidak ditemukan")
      router.push("/login");
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      let failed = 0;
      for (let i = 0; i < selectedRows.length; i++) {
        const row = selectedRows[i];

        const response = await fetch(`/api/komponen/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ id: row.original.id }),
        });

        if (!response.ok) {
          failed++;
        }

        setProgress(((i + 1) / selectedRows.length) * 100);
      }

      if (failed > 0) {
        customToast.error(`Gagal menghapus Komponen Penilaian`, `${failed} Komponen Penilaian gagal dihapus karena telah memiliki nilai`);
      } 
      
      if (selectedRows.length - failed > 0) {
        customToast.success(`Berhasil menghapus Komponen Penilaian`, `${selectedRows.length - failed} dari ${selectedRows} Komponen Penilaian berhasil dihapus`);
      }

      triggerReload();
      table.resetRowSelection();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting komponen:", error);
      customToast.error(`Gagal menghapus Komponen Penilaian`, error instanceof Error ? error.message : `Gagal menghapus Komponen Penilaian`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleAddKomponen = async () => {
    if (!accessToken) {
      customToast.error("Gagal menambahkan Komponen Penilaian", "Token tidak ditemukan")
      router.push("/login");
      return;
    }

    if (!namaKomponen.trim()) {
      customToast.error("Gagal menambahkan Komponen Penilaian", "Nama Komponen Penilaian tidak boleh kosong")
      return;
    }

    if (namaKomponen.length > 50) {
      customToast.error("Gagal menambahkan Komponen Penilaian", "Nama Komponen Penilaian maksimal memiliki panjang 50 karakter")
      return;
    }

    if (!bobotKomponen || isNaN(Number(bobotKomponen))) {
      customToast.error("Gagal menambahkan Komponen Penilaian", "Bobot komponen harus berupa angka")
      return;
    }

    if (Number(bobotKomponen) < 1 || Number(bobotKomponen) > 100) {
      customToast.error("Gagal menambahkan Komponen Penilaian", "Bobot Komponen Penilaian harus bernilai di antara 1 hingga 100")
      return;
    }

    try {
      const response = await fetch("/api/komponen/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          namaKomponen,
          bobotKomponen,
          mataPelajaran: mataPelajaran,
          tipeKomponen,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menambahkan komponen");
      }

      const result = await response.json();

      const newKomponen = {
        id: result.data?.id || komponenList.length + 1,
        nama: namaKomponen.trim(),
        bobot: bobotKomponen,
      };

      setKomponenList((prev) => [...prev, newKomponen]);
      setAddDialogOpen(false);
      setNamaKomponen("");
      setBobotKomponen("");
      setTipeKomponen("Pengetahuan");
      toast.success("Komponen berhasil ditambahkan");
      triggerReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex flex-wrap items-center justify-between">
        <h2 className="text-xl font-semibold">Komponen {title}</h2>

        <div className="flex items-center gap-2">
          {/* Hapus */}
          {selectedRowsCount > 0 && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <TrashIcon className="mr-2 size-4" />
                  Hapus ({selectedRowsCount})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Hapus Komponen Penilaian {title}?</DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin ingin menghapus {selectedRowsCount} Komponen Penilaian {title} ini?
                  </DialogDescription>
                </DialogHeader>
                {loading && <Progress value={progress} className="mt-4" />}
                <DialogFooter className="sm:justify-end">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={handleDeleteConfirm}
                      variant="secondary"
                      disabled={loading}
                    >
                      {loading ? "Menghapus..." : "Ya, Hapus"}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" disabled={loading}>
                        Batal
                      </Button>
                    </DialogClose>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Tambah */}
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 size-4" />
                Tambah Komponen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Komponen Penilaian {title}</DialogTitle>
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
                    onValueChange={setTipeKomponen}
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
                  <Button variant="secondary">Kembali</Button>
                </DialogClose>
                <Button onClick={handleAddKomponen}>
                  <Plus className="h-5 w-5 ml-2" />
                  Tambah Komponen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}