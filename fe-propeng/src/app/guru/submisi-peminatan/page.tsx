"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-submisi-minat/data-table";
import { submisiMinatColumns } from "@/components/ui/dt-lihat-submisi-minat/columns";
import { useRouter } from "next/navigation";
// import { toast } from "sonner";
import { toast, Toaster } from "sonner";


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

interface Siswa {
  id: number;
  name: string;
  isAssignedtoClass: boolean;
  nisn: string;
  username: string;
}

const customToast = {
  success: (title: string, description: string) => {
    toast.success(title, {
      description: <span style={{ color: "black", fontWeight: "500" }}>{description}</span>
    });
  },
  error: (title: string, description: string) => {
    toast.error(title, {
      description: <span style={{ color: "black", fontWeight: "500" }}>{description}</span>
    });
  },
  warning: (title: string, description: string) => {
    toast.warning(title, {
      description: <span style={{ color: "black", fontWeight: "350" }}>{description}</span>
    });
  }
};

interface Kelas {
  id: number;
  namaKelas: string;
  tahunAjaran: number;
  waliKelas: string;
  totalSiswa: number;
  absensiStats: {
    totalAlfa: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
  };
  angkatan: number;
  isActive: boolean;
  expiredAt: string;
  siswa: Siswa[];
}

export default function SubmisiMinatPage() {
  const [data, setData] = useState<FormattedSubmisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const [activeClass, setActiveClass] = useState<Kelas | null>(null);
  const [warned, setWarned] = useState(false);

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

        // Fetch classes where the user is wali kelas
        const kelasRes = await fetch("/api/kelas/saya", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const kelasJson = await kelasRes.json();
        if (kelasJson.status !== 200) {
          setError("Gagal mengambil data kelas.");
          setLoading(false);
          return;
        }
        const kelasData: Kelas[] = kelasJson.data;
        const found = kelasData.find((k) => k.isActive) || null;
        setActiveClass(found);
        if (!found) {
          customToast.warning("Tidak ada kelas", "Anda belum terdaftar sebagai wali kelas");
          setLoading(false);
          return;            // ← short-circuit if no active class
        }
        const studentIds = found.siswa.map((s) => s.id);

        // Fetch all linimasa events
        const eventRes = await fetch("/api/linimasa", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventJson = await eventRes.json();
        if (eventJson.status !== 200) {
          setError("Gagal mengambil data linimasa.");
          setLoading(false);
          return;
        }
        const events = eventJson.data;

        // Cherry-pick the event containing submissions for your class
        let chosenEventId: string | null = null;
        for (const ev of events) {
          const subRes = await fetch("/api/linimasa/submisi/detail", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token} Id ${ev.id}`,
            },
          });
          if (!subRes.ok) continue;
          const subJson = await subRes.json();
          if (subJson.status === 200 && Array.isArray(subJson.data)) {
            const submissions: Submisi[] = subJson.data;
            const hasMatch = submissions.some((item) => studentIds.includes(item.id_siswa));
            if (hasMatch) {
              chosenEventId = ev.id.toString();
              break;
            }
          }
        }
        if (!chosenEventId) {
          setEventId(null);
          setLoading(false);
        } else {
          setEventId(chosenEventId);
          fetchSubmisi(chosenEventId, token);
        }
      } catch (err: any) {
        console.error("Gagal mengambil data awal:", err);
        setError("Gagal memuat data awal.");
        setLoading(false);
      }
    };

    fetchInitial();
  }, []);

  const fetchSubmisi = async (id: string, token: string) => {
    try {
      const response = await fetch("/api/linimasa/submisi/detail", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} Id ${id}`,
        },
      });
      if (!response.ok) throw new Error("Gagal fetch submisi");

      const result = await response.json();
      if (result.status === 200) {
        const rawData: Submisi[] = result.data;
        const formatted = rawData.map((item) => {
          const isAllReviewed = [
            item.statustier1,
            item.statustier2,
            item.statustier3,
            item.statustier4,
          ]
            .filter((_, idx) => (item as any)[`tier${idx + 1}`])
            .every((status) => status != null);
          return {
            id: item.id,
            siswa: item.nama_siswa,
            submittedAt: new Date(item.submitted_at).toLocaleString(),
            status: isAllReviewed ? "Sudah Ditinjau" : "Butuh Ditinjau",
          };
        });
        setData(formatted);
      } else {
        throw new Error(result.message || "Gagal mengambil data submisi");
      }
    } catch (e: any) {
      setError(e.message || "Gagal mengambil data submisi");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && activeClass === null) {
    if (!warned) {
      customToast.warning("Tidak ada kelas", "Anda belum terdaftar sebagai wali kelas");
      setWarned(true);
    }
    return (
      <>
        <Toaster />     
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-gray-500 mb-4">
            Anda tidak menjadi wali kelas untuk kelas aktif manapun saat ini.
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Pendaftar Mata Pelajaran Peminatan Siswa
          </h2>
          <p className="text-muted-foreground">
            Wali Kelas dapat mengubah status penerimaan mata pelajaran peminatan siswa.
          </p>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="relative">
          <DataTable columns={submisiMinatColumns(eventId ?? "")} data={data} />
        </div>
      )}
    </div>
  );
}
