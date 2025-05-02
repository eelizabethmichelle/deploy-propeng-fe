"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, Search, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/ui/dt-lihat-matpel-detil-guru/data-table";
import { DataTableKomponen } from "@/components/ui/dt-lihat-komponen/data-table";
import { columns } from "@/components/ui/dt-lihat-matpel-detil-guru/columns";
import { komponenColumns } from "@/components/ui/dt-lihat-komponen/columns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const TotalBobotInfo = ({ totalBobot, tipe }: { totalBobot: number, tipe: String }) => (
    <div
      className={`mt-2 inline-flex items-start gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm border ${
        totalBobot === 100
          ? "bg-green-100 text-green-700 border-green-300"
          : "bg-yellow-100 text-yellow-800 border-yellow-300"
      }`}
    >
      {totalBobot === 100 ? (
        <Check className="h-4 w-4 mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 mt-0.5" />
      )}
      <div>
        Total Bobot Komponen Penilaian {tipe}: {totalBobot}%
        {totalBobot !== 100 && (
          <div className="text-sm font-normal italic">
            Pastikan jumlah bobot = 100%
          </div>
        )}
      </div>
    </div>
  );  

const customToast = {
    success: (title: string, description: string) => {
        toast.success(title, {
            description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>,
        });
    },
    error: (title: string, description: string) => {
        toast.error(title, {
            description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>,
        });
    },
    warning: (title: string, description: string) => {
        toast.warning(title, {
            description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>,
        });
    },
};

export default function MatpelDetailPage() {
    const params = useParams();
    const router = useRouter();
    const matpelId = params.id;
    const [matpelData, setMatpelData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [komponenPengetahuan, setKomponenPengetahuan] = useState<any[]>([]);
    const [komponenKeterampilan, setKomponenKeterampilan] = useState<any[]>([]);
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const totalBobotPengetahuan = komponenPengetahuan.reduce((sum, item) => sum + Number(item.bobotKomponen || 0), 0);
    const totalBobotKeterampilan = komponenKeterampilan.reduce((sum, item) => sum + Number(item.bobotKomponen || 0), 0);

    const triggerReload = () => {
        setReloadTrigger(prev => prev + 1);
    };

    const getAuthToken = () => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return null;
        }
        return token;
    };

    const filteredStudents = searchTerm
        ? students.filter((student) =>
              [student.name, student.nisn, student.username]
                  .filter(Boolean)
                  .some((val) => val.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : students;

    useEffect(() => {
        const fetchMatpelDetail = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();
                if (!token) return;

                const response = await fetch(`/api/mata-pelajaran/detail`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token} Id ${matpelId}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem("accessToken");
                        sessionStorage.removeItem("accessToken");
                        router.push("/login");
                        return;
                    }
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === 200) {
                    setMatpelData({
                        idMatpel: data.data.id,
                        namaMatpel: data.data.nama,
                        kategoriMatpel: data.data.kategoriMatpel,
                        kodeMatpel: data.data.kode,
                        tahunAjaran: data.data.tahunAjaran,
                        guruMatpel: data.data.teacher.name,
                        totalSiswa: data.data.jumlah_siswa,
                        statusMatpel: data.data.status,
                        angkatan: data.data.angkatan,
                        siswa_terdaftar: data.data.siswa_terdaftar,
                    });
                    setStudents(data.data.siswa_terdaftar || []);
                } else {
                    throw new Error(data.errorMessage || "Gagal mengambil detail");
                }
            } catch (err: any) {
                setError(err.message);
                customToast.error("Gagal memuat data", "Terjadi kesalahan saat mengambil data Mata Pelajaran");
            } finally {
                setLoading(false);
            }
        };

        const fetchKomponen = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                const response = await fetch(`/api/komponen/view-by-mata-pelajaran`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token} Id ${matpelId}`,
                    },
                });

                const result = await response.json();

                if (response.ok && result.status === 200) {
                    const komponenPengetahuanMapped = result.data
                        .filter((item: any) => item.tipeKomponen === "Pengetahuan")
                        .map((item: any) => ({
                            id: item.id,
                            namaKomponen: item.namaKomponen,
                            bobotKomponen: item.bobotKomponen,
                            tipeKomponen: item.tipeKomponen
                    }));
                    setKomponenPengetahuan(komponenPengetahuanMapped);

                    const komponenKeterampilanMapped = result.data
                        .filter((item: any) => item.tipeKomponen === "Keterampilan")
                        .map((item: any) => ({
                            id: item.id,
                            namaKomponen: item.namaKomponen,
                            bobotKomponen: item.bobotKomponen,
                            tipeKomponen: item.tipeKomponen
                    }));
                    setKomponenKeterampilan(komponenKeterampilanMapped);
                } else {
                    throw new Error(result.message || "Gagal mengambil komponen penilaian");
                }
            } catch (err: any) {
                console.error(err);
                customToast.error("Gagal memuat komponen", err.message || "Terjadi kesalahan saat memuat komponen");
            }
        };

        if (matpelId) {
            fetchMatpelDetail();
            fetchKomponen();
        }
    }, [reloadTrigger, matpelId]);

    if (loading) return <div className="p-8">Loading...</div>;

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">Error: {error}</div>
                <Button onClick={() => router.push("/admin/mata-pelajaran")}>
                    Kembali ke Daftar Mata Pelajaran
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex">
            <Toaster />

            <h1 className="text-2xl font-bold">Mata Pelajaran {matpelData?.namaMatpel}</h1>
            <p className="text-sm text-muted-foreground">
                Tahun Ajaran: {matpelData?.tahunAjaran}/{parseInt(matpelData?.tahunAjaran) + 1} · Angkatan:{" "}
                {matpelData?.angkatan}
            </p>

            {/* KOMPONEN PENILAIAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Table 1 */}
                <div className="space-y-4">
                    <DataTableKomponen
                    data={komponenPengetahuan} 
                    columns={komponenColumns({ reloadTrigger, triggerReload })}
                    mataPelajaran={matpelId as string}
                    reloadTrigger={reloadTrigger}
                    triggerReload={triggerReload}
                    title={"Pengetahuan"}
                    totalBobotKomponen={totalBobotPengetahuan}
                    />
                    {/* <TotalBobotInfo totalBobot={totalBobotPengetahuan} tipe={"Pengetahuan"}/> */}
                </div>

                {/* Table 2 */}
                <div className="space-y-4">
                    <DataTableKomponen 
                    data={komponenKeterampilan} 
                    columns={komponenColumns({ reloadTrigger, triggerReload })}
                    mataPelajaran={matpelId as string}
                    reloadTrigger={reloadTrigger}
                    triggerReload={triggerReload}
                    title={"Keterampilan"}
                    totalBobotKomponen={totalBobotKeterampilan}
                    />
                    {/* <TotalBobotInfo totalBobot={totalBobotKeterampilan} tipe={"Keterampilan"}/> */}
                </div>
            </div>

            <h2 className="text-xl font-semibold">Daftar Siswa</h2>
            {/* SISWA */}
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Cari nama siswa, NISN, username"
                    className="w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <DataTable columns={columns} data={filteredStudents} />
        </div>
    );
}