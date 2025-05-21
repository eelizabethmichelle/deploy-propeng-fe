"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-matpel-guru/data-table";
import { mataPelajaranColumns } from "@/components/ui/dt-lihat-matpel-guru/columns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { kelasColumns } from "@/components/ui/dt-lihat-kelas-guru/columns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircledIcon } from "@radix-ui/react-icons";

interface Kelas {
  id: number;
  namaKelas: string;
  tahunAjaran: number;
  waliKelas: string;
  totalSiswa: number;
  isActive: boolean;
  expiredAt: string;
}

interface FormattedKelas {
  id: number;
  namaKelas: string;
  tahunAjaran: number | string;
  totalSiswa: number;
  status: string;
}

export default function KelasPage() {
  const [data, setData] = useState<FormattedKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClass, setNoClass] = useState(false); // <-- NEW STATE
  const router = useRouter(); 

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setNoClass(false); // reset

        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
        if (!token) {
          setError("Unauthorized: Token tidak ditemukan.");
          setLoading(false);
          router.push("/login");
          return;
        }

        const response = await fetch("/api/kelas/semua-kelas-saya", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const kelasResponse = await response.json();

        // If teacher has no class
        if (
          kelasResponse.message === "Anda tidak menjadi wali kelas untuk kelas aktif manapun saat ini." ||
          (kelasResponse.data && Array.isArray(kelasResponse.data) && kelasResponse.data.length === 0)
        ) {
          setNoClass(true);
          setData([]);
          setLoading(false);
          return;
        }

        if (!kelasResponse.data || !Array.isArray(kelasResponse.data)) {
          console.error("Error: Response bukan array!", kelasResponse);
          setError("Data tidak valid dari server.");
          setLoading(false);
          return;
        }

        const kelas: Kelas[] = kelasResponse.data;

        const formattedData: FormattedKelas[] = kelas.map((kelas) => ({
          id: kelas.id,
          namaKelas: kelas.namaKelas || "-",
          tahunAjaran: kelas.tahunAjaran || "-",
          totalSiswa: kelas.totalSiswa || 0,
          status: kelas.isActive ? "Aktif" : "Tidak Aktif",
        }));

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Gagal mengambil data Kelas. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle dashboard button clicks
  useEffect(() => {
    const handleDashboardClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.dashboard-button') as HTMLElement;
      
      if (button) {
        const id = button.dataset.id;
        if (id) {
          router.push(`/guru/kelas/dashboard/${id}`);
        }
      }
    };

    document.addEventListener('click', handleDashboardClick);
    
    return () => {
      document.removeEventListener('click', handleDashboardClick);
    };
  }, [router]);

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Semua Kelas Saya
          </h2>
          <p className="text-muted-foreground">
            Kelola semua kelas kamu
          </p>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {noClass && !loading && !error && (
        <div className="mt-8 flex justify-center">
          <Card className="border border-yellow-200 bg-yellow-50 max-w-xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircledIcon className="h-5 w-5 text-green-600" />
                <CardTitle>Tidak Ada Kelas</CardTitle>
              </div>
              <CardDescription>
                Anda belum memiliki kelas apapun saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Silakan hubungi admin untuk mendapatkan akses ke kelas Anda.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-md"
              >
                Muat Ulang
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !error && !noClass && (
        <div className="relative">
          <DataTable columns={kelasColumns} data={data} />
        </div>
      )}
    </div>
  );
}
