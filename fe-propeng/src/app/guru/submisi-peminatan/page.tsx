"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-submisi-minat/data-table";
import { submisiMinatColumns } from "@/components/ui/dt-lihat-submisi-minat/columns";
import { useRouter } from "next/navigation";
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
  const [eventId, setEventId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          router.push("/login");
          return;
        }

        const userRes = await fetch("/api/auth/detail", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userJson = await userRes.json();
        const userAngkatan = userJson?.data_user?.angkatan;

        const eventRes = await fetch("/api/linimasa", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventJson = await eventRes.json();
        const matchingEvent = eventJson.data.find(
          (event: any) => event.angkatan === userAngkatan
        );

        if (!matchingEvent) {
          setError("Tidak ditemukan pendaftaran untuk kelas Anda.");
          setLoading(false);
          return;
        }

        const resolvedEventId = matchingEvent.id.toString();
        setEventId(resolvedEventId);
        fetchSubmisi(resolvedEventId, token);
      } catch (err: any) {
        console.error("Gagal mengambil data:", err);
        setError("Gagal memuat data awal.");
        setLoading(false);
      }
    };

    fetchInitial();
  }, []);

  const fetchSubmisi = async (eventId: string, token: string) => {
    try {
      const response = await fetch("/api/linimasa/submisi/detail", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} Id ${eventId}`,
        },
      });

      if (!response.ok) throw new Error("Gagal fetch submisi");

      const result = await response.json();

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

        setData(formatted);
      } else {
        throw new Error(result.message || "Gagal mengambil data submisi");
      }
    } catch (error: any) {
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
            Submisi Pendaftaran Mata Pelajaran Peminatan Siswa
          </h2>
          <p className="text-muted-foreground">Wali Kelas dapat mengubah status penerimaan mata pelajaran peminatan siswa.</p>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && eventId && (
        <div className="relative">
          <DataTable columns={submisiMinatColumns(eventId)} data={data} />
        </div>
      )}
    </div>
  );
}
