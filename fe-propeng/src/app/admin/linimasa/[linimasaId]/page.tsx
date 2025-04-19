"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-submisi-minat/data-table";
import { submisiMinatColumns } from "@/components/ui/dt-lihat-submisi-minat/columns";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Submisi {
  id: number;
  nama_siswa: string;
  id_siswa: number;
  tier1: boolean;
  tier2: boolean;
  tier3: boolean;
  tier4: boolean;
  statustier1: string | null;
  statustier2: string | null;
  statustier3: string | null;
  statustier4: string | null;
  submitted_at: string;
}

interface FormattedSubmisi {
  id: number;
  siswa: string;
  submittedAt: string;
  status: string;

}


export default function SubmisiMinatPage() {
  const [data, setData] = useState<FormattedSubmisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = params.linimasaId as string;

  useEffect(() => {
    fetchSubmisi();
  }, []);
  
  const fetchSubmisi = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const accessToken =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  
      if (!accessToken) {
        console.warn("No access token found. Redirecting to login.");
        router.push("/login");
        return;
      }


      const response = await fetch("/api/linimasa/submisi/detail", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} Id ${eventId}`, // <- sesuaikan ID-nya
        },
      });
      
  
      console.log("API Response Status:", response.status);
      console.log("BADUNAUDU")
      console.log(eventId)
  
      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Unauthorized. Clearing token and redirecting to login.");
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }
  
      const result = await response.json();
  
      console.log("API Response JSON:", result);
  
      if (result.status === 200) {
        const rawData: Submisi[] = result.data;
  
        const formatted: FormattedSubmisi[] = rawData.map((item) => {
          const isAllReviewed = [item.statustier1, item.statustier2, item.statustier3, item.statustier4]
            .filter((_, idx) => item[`tier${idx + 1}` as keyof Submisi])
            .every((status) => status !== null);
  
          return {
            id: item.id,
            siswa: item.nama_siswa,
            submittedAt: new Date(item.submitted_at).toLocaleString(),
            status: isAllReviewed ? "Sudah Diulas" : "Butuh Persetujuan",
          };
        });
  
        console.log("Formatted Submisi Data:", formatted);
        setData(formatted);
      } else {
        throw new Error(result.message || "Gagal mengambil data submisi");
      }
    } catch (error: any) {
      console.error("Error fetching submisi:", error);
      setError(error.message || "Gagal mengambil data submisi");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Data Submisi Minat Siswa
          </h2>
          <p className="text-muted-foreground">Tampilkan hasil submisi minat seluruh siswa</p>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="relative">
          <DataTable columns={submisiMinatColumns(eventId)} data={data} />
          
        </div>
      )}
    </div>
  );
}
