"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-matpel/data-table";
import { mataPelajaranColumns } from "@/components/ui/dt-lihat-matpel/columns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MataPelajaran {
  tahunAjaran: number;
  id: number;
  kode: string;
  nama: string;
  status: string;
  teacher: { id: number; name: string } | null; 
  jumlah_siswa: number;
}

interface FormattedMataPelajaran {
  id: number;
  name: string;
  kode: string;
  status: string;
  teacher: string;
  tahunAjaran: number | string;
  students: number;
}

export default function MataPelajaranPage() {
  const [data, setData] = useState<FormattedMataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); 

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
        if (!token) {
          setError("Unauthorized: Token tidak ditemukan.");
          setLoading(false);
          router.push("/login");
          return;
        }

        const response = await fetch("/api/mata-pelajaran/view-all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const mataPelajaranResponse = await response.json();
      
        if (!mataPelajaranResponse.data || !Array.isArray(mataPelajaranResponse.data)) {
          console.error("Error: Response bukan array!", mataPelajaranResponse);
          setError("Data tidak valid dari server.");
          setLoading(false);
          return;
        }

        const mataPelajaran: MataPelajaran[] = mataPelajaranResponse.data;

        const formattedData: FormattedMataPelajaran[] = mataPelajaran.map((matpel) => ({
          id: matpel.id,
          name: matpel.nama || "", 
          kode: matpel.kode || "",
          status: matpel.status || "Unknown",
          teacher: matpel.teacher?.name || "Unknown",
          tahunAjaran: matpel.tahunAjaran || "-", 
          students: matpel.jumlah_siswa || 0, 
      }));

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Gagal mengambil data mata pelajaran. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Manajemen Mata Pelajaran
          </h2>
          <p className="text-muted-foreground">
            Kelola semua mata pelajaran yang tersedia
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => router.push("/admin/mata-pelajaran/tambah")}
        >
          <Plus className="h-5 w-5 ml-2" />
          Tambah Mata Pelajaran
        </Button>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="relative">
          <DataTable columns={mataPelajaranColumns} data={data} />
        </div>
      )}
    </div>
  );
}
