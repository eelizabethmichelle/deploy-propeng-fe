"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
    router.push(`/admin/mata-pelajaran/ubah?matpelId=${id}`);
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
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Detail Mata Pelajaran</DialogTitle>
    </DialogHeader>

    {loading ? (
      <p>Loading...</p>
    ) : error ? (
      <p className="text-red-500">{error}</p>
    ) : mataPelajaran ? (
      <Card>
        <CardHeader>
          <CardTitle>{mataPelajaran.nama || "Nama Tidak Diketahui"}</CardTitle>
          <CardDescription>Kode: {mataPelajaran.kode || "Tidak Ada"}</CardDescription>
        </CardHeader>
        <CardContent>
          <p><strong>Kategori:</strong> {mataPelajaran.kategoriMatpel || "Tidak Ada"}</p>
          <p><strong>Angkatan:</strong> {mataPelajaran.angkatan || "Tidak Ada"}</p>
          <p><strong>Tahun Ajaran:</strong> {mataPelajaran.tahunAjaran || "Tidak Ada"}</p>
          <p><strong>Jumlah Siswa:</strong> {mataPelajaran.jumlah_siswa || 0}</p>
          <p><strong>Guru:</strong> {mataPelajaran.teacher.name || "Tidak Ada"}</p>

          {/* Daftar Siswa */}
          <p className="mt-2 font-semibold">Daftar Siswa:</p>
          {mataPelajaran.students .length > 0 ? (
            <ul className="list-disc pl-5">
              {mataPelajaran.students.map((siswa) => (
                <li key={siswa.id}>
                  {siswa.name} ({siswa.username})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Tidak ada siswa terdaftar</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
            Tutup
          </Button>
        </CardFooter>
      </Card>
    ) : null}
  </DialogContent>
</Dialog>

    </>
  );
}
