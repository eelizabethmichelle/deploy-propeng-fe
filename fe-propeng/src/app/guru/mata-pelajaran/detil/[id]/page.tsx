"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, Search } from "lucide-react";
import { DataTable } from "@/components/ui/dt-lihat-matpel-detil-guru/data-table";
import { DataTableKomponen } from "@/components/ui/dt-lihat-komponen/data-table";
import { columns } from "@/components/ui/dt-lihat-matpel-detil-guru/columns";
import { komponenColumns } from "@/components/ui/dt-lihat-komponen/columns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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
    const [isAddKomponenOpen, setIsAddKomponenOpen] = useState(false);
    const [komponenList, setKomponenList] = useState<any[]>([]);
    const [namaKomponen, setNamaKomponen] = useState("");
    const [bobotKomponen, setBobotKomponen] = useState<number | "">("");
    const [reloadTrigger, setReloadTrigger] = useState(0);

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

    const handleAddKomponen = async () => {
        if (!namaKomponen.trim()) {
            customToast.warning("Nama komponen kosong", "Isi nama komponen terlebih dahulu");
            return;
        }
        if (namaKomponen.length > 50) {
            customToast.warning("Nama terlalu panjang", "Maksimum 50 karakter");
            return;
        }
        if (bobotKomponen === "" || bobotKomponen < 1 || bobotKomponen > 100) {
            customToast.warning("Bobot tidak valid", "Masukkan angka 1-100");
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch("/api/komponen/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    namaKomponen: namaKomponen.trim(),
                    bobotKomponen,
                    mataPelajaran: parseInt(matpelId as string),
                }),
            });

            const result = await response.json();

            if (!response.ok || result.status !== 201) {
                throw new Error(result.message || "Gagal menambahkan komponen");
            }

            const newKomponen = {
                id: result.data?.id || komponenList.length + 1,
                nama: namaKomponen.trim(),
                bobot: bobotKomponen,
            };

            setKomponenList((prev) => [...prev, newKomponen]);
            setNamaKomponen("");
            setBobotKomponen("");
            setIsAddKomponenOpen(false);
            customToast.success("Berhasil", "Komponen berhasil ditambahkan");
        } catch (err: any) {
            console.error(err);
            customToast.error("Gagal", err.message || "Terjadi kesalahan saat menambahkan komponen");
        }
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
                    const komponenMapped = result.data.map((item: any) => ({
                        id: item.id,
                        namaKomponen: item.namaKomponen,
                        bobotKomponen: item.bobotKomponen,
                    }));
                    setKomponenList(komponenMapped);
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
            <div className="space-y-4">
                <DataTableKomponen 
                    data={komponenList} 
                    columns={komponenColumns} 
                    mataPelajaran={matpelId as String}
                    reloadTrigger={reloadTrigger}
                    triggerReload={triggerReload}
                />
            </div>

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