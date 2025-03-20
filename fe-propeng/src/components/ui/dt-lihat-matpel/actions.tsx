"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { X as XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RowData {
  id?: number;
  kode?: string;
  nama?: string;
}

interface Student {
  id: number;
  name: string;
  username: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface MataPelajaranDetail {
  id: number;
  nama: string;
  kode: string;
  kategoriMatpel: string;
  angkatan: string;
  tahunAjaran: string;
  teacher: Teacher;
  jumlah_siswa: number;
  students: Student[];
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData extends RowData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaranDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { id, kode, nama } = row.original;

  const handleEdit = () => {
    if (!id) {
      console.error("No ID found for this row");
      return;
    }
    router.push(`/admin/mata-pelajaran/ubah/${id}`);
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);

    if (!id) {
      toast.error("Gagal menghapus! ID tidak ditemukan.");
      return;
    }

    let token: string | null =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (!token) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    }

    if (!token) {
      toast.error("Gagal menghapus! Token autentikasi tidak ditemukan.");
      return;
    }

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
        throw new Error(`Gagal menghapus mata pelajaran: ${res.statusText}`);
      }

      toast.success(`Mata pelajaran ${nama || "tanpa nama"} berhasil dihapus!`);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus mata pelajaran. Coba lagi nanti.");
    }
  };

  const handleFetchDetail = async () => {
    if (!id) {
      toast.error("Gagal mengambil detail! ID tidak ditemukan.");
      return;
    }
  
    setLoading(true);
    setError(null);
    setMataPelajaran(null);
  
    let token: string | null =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  
    if (!token) {
      toast.error("Gagal mengambil detail! Token autentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }
  
    try {
      const res = await fetch(`/api/mata-pelajaran/detail/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} Id ${id}`,
        },
      });
  
      if (!res.ok) {
        throw new Error(`Gagal mengambil detail: ${res.statusText}`);
      }
  
      const response = await res.json();
      const data = response.data;

      const tahunAjaranFormatted = data.tahunAjaran
      ? `TA ${data.tahunAjaran}/${parseInt(data.tahunAjaran) + 1}`
      : "Tidak Ada";
      
      // 🛠 Pastikan semua data ada sebelum diset ke state
      const mataPelajaranData: MataPelajaranDetail = {
        id: data.id || 0,
        nama: data.nama || "Tidak Diketahui",
        kode: data.kode || "Tidak Ada",
        kategoriMatpel: data.kategoriMatpel,
        angkatan: data.angkatan || "Tidak Ada",
        tahunAjaran: tahunAjaranFormatted || "Tidak Ada",
        teacher: data.teacher || { id: 0, name: "Tidak Ada" },
        jumlah_siswa: data.jumlah_siswa || 0,
        students: Array.isArray(data.siswa_terdaftar) ? data.siswa_terdaftar : [],
      };
      
  
      setMataPelajaran(mataPelajaranData);
    } catch (error) {
      console.error("Error fetching mata pelajaran detail:", error);
      setError("Gagal mengambil data. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDeleteDialogOpen && id) {
      handleFetchDetail();
    }
  }, [isDeleteDialogOpen, id]);
  
  return (
    <>
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => { setDetailDialogOpen(true); handleFetchDetail(); }}>
            Lihat Detail
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>Ubah</DropdownMenuItem>

          {/* <DropdownMenuSeparator /> */}
          {/* <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            Hapus
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Modal for Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Mata Pelajaran?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus mata pelajaran <strong>{mataPelajaran?.nama || "tanpa nama"}</strong> ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <div className="flex gap-4">
              <Button type="button" onClick={handleDelete} variant="secondary">
                Ya, Hapus
              </Button>
              <DialogClose asChild>
                <Button type="button">Batal</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal for Viewing Class Details */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button>svg]:h-6 [&>button>svg]:w-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Detail Mata Pelajaran</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : mataPelajaran ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-primary">{mataPelajaran.nama || "Nama Tidak Diketahui"}</h3>
                <p className="text-muted-foreground">Kode: {mataPelajaran.kode || "Tidak Ada"}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Kategori</p>
                    <p className="font-medium">{mataPelajaran.kategoriMatpel || "Tidak Ada"}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Angkatan</p>
                    <p className="font-medium">{mataPelajaran.angkatan || "Tidak Ada"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                    <p className="font-medium">{mataPelajaran.tahunAjaran || "Tidak Ada"}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Jumlah Siswa</p>
                    <p className="font-medium">{mataPelajaran.jumlah_siswa || 0}</p>
                  </div>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Guru Pengajar</p>
                <p className="font-medium">{mataPelajaran.teacher.name || "Tidak Ada"}</p>
              </div>

              {/* Students List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Daftar Siswa</h4>
                {mataPelajaran.students.length > 0 ? (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {mataPelajaran.students.map((siswa) => (
                        <div key={siswa.id} className="flex items-center space-x-2 p-2 bg-background rounded-md">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {siswa.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{siswa.name}</p>
                            <p className="text-sm text-muted-foreground">{siswa.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
                    Tidak ada siswa terdaftar
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

    </>
  );
}
