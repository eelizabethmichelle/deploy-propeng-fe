
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from '@/components/ui/card'; // Sesuaikan path jika perlu
import { OverviewTahunanDataTable } from '@/components/ui/evalguru-overview-tahunan/overview-tahunan-data-table';
import { ApiResponseOverview, FlattenedEvaluasiGuruOverview } from '@/components/ui/evalguru-overview-tahunan/schema';
import { FilterOption } from '@/components/ui/grade-entry/schema';
export default function OverviewTahunanPage() {
    const [dataPerTahun, setDataPerTahun] = useState<ApiResponseOverview['data_evaluasi_per_tahun'] | null>(null);
    const [flattenedData, setFlattenedData] = useState<FlattenedEvaluasiGuruOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            // Ambil token dari localStorage atau sessionStorage
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

            if (!accessToken) {
                setError("Akses token tidak ditemukan. Silakan login kembali.");
                setIsLoading(false);
                return;
            }

            try {
                // Panggil API Route Next.js Anda, bukan langsung ke backend Django
                const response = await fetch("/api/evalguru/admin/overview-tahunan", { 
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`, // Kirim token ke API Route Next.js
                    },
                });

                if (!response.ok) {
                    let errorData;
                    try { errorData = await response.json(); } catch {/**/}
                    throw new Error(errorData?.message || `Gagal memuat data (${response.status})`);
                }
                const result: ApiResponseOverview = await response.json();
                
                if (result.status === 200 && result.data_evaluasi_per_tahun) {
                    setDataPerTahun(result.data_evaluasi_per_tahun);
                    
                    const flatData: FlattenedEvaluasiGuruOverview[] = [];
                    Object.keys(result.data_evaluasi_per_tahun).forEach(tahun => {
                        result.data_evaluasi_per_tahun[tahun].forEach(guruEval => {
                            let skorFilterNum: number | null = null;
                            // Ambil skor rata-rata dari variabel pertama (ID "1") untuk filter rentang
                            // Pastikan skor_per_variabel["1"] ada dan formatnya "X.XX / 5.00"
                            const skorVarDefaultStr = guruEval.skor_per_variabel["1"]; 
                            if (skorVarDefaultStr && !skorVarDefaultStr.startsWith("-")) {
                                try { 
                                    skorFilterNum = parseFloat(skorVarDefaultStr.split(" / ")[0]); 
                                } catch (e) {
                                    console.warn(`Gagal parse skor: ${skorVarDefaultStr}`, e);
                                    skorFilterNum = null;
                                }
                            }

                            const mapelUnikSet = new Set<string>();
                            const tingkatanKelasUnikSet = new Set<string>();

                            if (Array.isArray(guruEval.mata_pelajaran_summary)) {
                                guruEval.mata_pelajaran_summary.forEach(summaryItem => {
                                    // Ekstrak nama mapel (sebelum "(Kelas")
                                    const mapelNameOnly = summaryItem.split(" (Kelas")[0];
                                    if (mapelNameOnly) mapelUnikSet.add(mapelNameOnly.trim());

                                    // Ekstrak tingkatan kelas (angka dari dalam "(Kelas X...)" )
                                    const matchKelasLengkap = summaryItem.match(/\(Kelas\s*([^)]+)\)/i);
                                    if (matchKelasLengkap && matchKelasLengkap[1]) {
                                        const tingkatanMatch = matchKelasLengkap[1].trim().match(/^(\d+)/);
                                        if (tingkatanMatch && tingkatanMatch[1]) {
                                            tingkatanKelasUnikSet.add(tingkatanMatch[1]);
                                        }
                                    }
                                });
                            }

                            flatData.push({
                                ...guruEval,
                                tahun_ajaran: tahun, // tahun adalah key dari data_evaluasi_per_tahun
                                row_id: `${tahun}-${guruEval.guru_id}`, // ID unik untuk baris tabel
                                skor_rata_rata_numerik: skorFilterNum,
                                mata_pelajaran_summary: Array.from(mapelUnikSet).sort(),
                            });
                        });
                    });
                    setFlattenedData(flatData);
                } else {
                    setFlattenedData([]);
                    // Tangani kasus ketika status dari API backend bukan 200 atau data_evaluasi_per_tahun kosong
                    if (result.message && result.message !== "Tidak ada data evaluasi." && result.message !== "Data evaluasi keseluruhan guru per tahun ajaran.") {
                         setError(result.message || "Format data tidak sesuai dari API backend.");
                    } else if (!result.data_evaluasi_per_tahun && result.status === 200) {
                        // Tidak ada data tapi sukses, ini sudah ditangani oleh tampilan "Tidak ada data"
                    }
                }
            } catch (err) {
                console.error("Failed to fetch overview data from Next.js API route:", err);
                setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui saat mengambil data.");
                setFlattenedData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []); // Hanya dijalankan sekali saat komponen mount

    // Opsi untuk filter Tahun Ajaran
    const tahunAjaranOptions = useMemo((): FilterOption[] => {
        if (!dataPerTahun) return [];
        // Ambil keys (tahun ajaran), urutkan descending, lalu map
        return Object.keys(dataPerTahun)
            .sort((a, b) => b.localeCompare(a)) // Urutkan tahun terbaru dulu (misal "2025" sebelum "2024")
            .map(tahun => ({
                label: tahun, // Asumsi 'tahun' adalah string yang diinginkan untuk label dan value
                value: tahun,
            }));
    }, [dataPerTahun]);

    // Opsi untuk filter Nama Guru
    const guruOptions = useMemo((): FilterOption[] => {
        if (flattenedData.length === 0) return [];
        const uniqueGurus = new Set<string>();
        flattenedData.forEach(d => { 
            if (d.nama_guru && d.nama_guru !== "N/A") uniqueGurus.add(d.nama_guru) 
        });
        return Array.from(uniqueGurus).sort().map(name => ({ label: name, value: name }));
    }, [flattenedData]);

    // Opsi untuk filter Mata Pelajaran
    const mataPelajaranOptions = useMemo((): FilterOption[] => {
        if (flattenedData.length === 0) return [];
        const uniqueMapels = new Set<string>();
        flattenedData.forEach(d => {
            if (d.mata_pelajaran_summary) { // Menggunakan field baru dari schema
                d.mata_pelajaran_summary.forEach(mapelName => uniqueMapels.add(mapelName));
            }
        });
        return Array.from(uniqueMapels).sort().map(name => ({ label: name, value: name }));
    }, [flattenedData]);
    
    return (
        <div className="container mx-auto py-10 px-4 ">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Evaluasi Guru</h1>
                <p className="text-muted-foreground">
                    Rangkuman evaluasi untuk setiap guru pada tiap tahun ajaran.
                </p>
            </div>
            
                    {isLoading && (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <span className="ml-3 text-lg">Memuat data evaluasi...</span>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="text-center text-red-600 py-10 bg-red-50 p-4 rounded-md">
                            <p className="font-semibold">Terjadi Kesalahan:</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && flattenedData.length > 0 && (
                        <OverviewTahunanDataTable
                            data={flattenedData}
                            tahunAjaranOptions={tahunAjaranOptions}
                            guruOptions={guruOptions}
                            mataPelajaranOptions={mataPelajaranOptions}
                            // rentangNilaiOptions akan diimpor dan digunakan langsung oleh Toolbar
                        />
                    )}
                    {!isLoading && !error && flattenedData.length === 0 && (
                         <div className="text-center text-muted-foreground py-20">
                            <p className="text-lg mb-2">Tidak ada data evaluasi untuk ditampilkan.</p>
                            <p>Pastikan data evaluasi sudah tersedia di sistem.</p>
                        </div>
                     )}
        </div>
    );
}