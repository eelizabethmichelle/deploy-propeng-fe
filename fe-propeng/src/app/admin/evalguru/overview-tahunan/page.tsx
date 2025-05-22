'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { OverviewTahunanDataTable } from '@/components/ui/evalguru-overview-tahunan/overview-tahunan-data-table';
import { 
    ApiResponseOverview, 
    EvaluasiGuruDataPerTA, // Pastikan ini diimpor
    FlattenedEvaluasiGuruOverview, 
    FilterOption 
} from '@/components/ui/evalguru-overview-tahunan/schema';

export default function OverviewTahunanPage() {
    const [dataPerTahun, setDataPerTahun] = useState<ApiResponseOverview['data_evaluasi_per_tahun'] | null>(null);
    const [flattenedData, setFlattenedData] = useState<FlattenedEvaluasiGuruOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

            if (!accessToken) {
                setError("Akses token tidak ditemukan. Silakan login kembali.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/evalguru/admin/overview-tahunan", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
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
                        result.data_evaluasi_per_tahun[tahun].forEach((guruEval: EvaluasiGuruDataPerTA) => { // Tipe guruEval
                            let skorFilterNum: number | null = null;
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
                            if (Array.isArray(guruEval.mata_pelajaran_summary)) {
                                guruEval.mata_pelajaran_summary.forEach(summaryItem => {
                                    mapelUnikSet.add(summaryItem.trim());
                                });
                            }

                            // === HITUNG NILAI KUMULATIF DI SINI ===
                            let jumlah_pengisi_kumulatif = 0;
                            let jumlah_siswa_kumulatif = 0;

                            if (guruEval.detail_per_mata_pelajaran && Array.isArray(guruEval.detail_per_mata_pelajaran)) {
                                guruEval.detail_per_mata_pelajaran.forEach(mapel => {
                                    jumlah_pengisi_kumulatif += parseInt(mapel.total_pengisi_evaluasi) || 0;
                                    jumlah_siswa_kumulatif += parseInt(mapel.total_siswa_mapel) || 0;
                                });
                            }
                            // === AKHIR PERHITUNGAN KUMULATIF ===

                            flatData.push({
                                guru_id: guruEval.guru_id,
                                nama_guru: guruEval.nama_guru,
                                nisp: guruEval.nisp,
                                skor_per_variabel: guruEval.skor_per_variabel,
                                // detail_per_mata_pelajaran: guruEval.detail_per_mata_pelajaran, // Opsional, jika didefinisikan di Flattened...

                                tahun_ajaran: tahun,
                                row_id: `${tahun}-${guruEval.guru_id}`,
                                skor_rata_rata_numerik: skorFilterNum,
                                mata_pelajaran_summary: Array.from(mapelUnikSet).sort(),

                                // Tambahkan field kumulatif yang baru dihitung
                                jumlah_pengisi_kumulatif: jumlah_pengisi_kumulatif,
                                jumlah_siswa_kumulatif: jumlah_siswa_kumulatif,
                            });
                        });
                    });
                    setFlattenedData(flatData);
                } else {
                    setFlattenedData([]);
                    if (result.message && result.message !== "Tidak ada data evaluasi." && result.message !== "Data evaluasi keseluruhan guru per tahun ajaran.") {
                         setError(result.message || "Format data tidak sesuai dari API backend.");
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
    }, []);

    const tahunAjaranOptions = useMemo((): FilterOption[] => {
        if (!dataPerTahun) return [];
        return Object.keys(dataPerTahun)
            .sort((a, b) => b.localeCompare(a)) // Urutkan tahun terbaru dulu
            .map(tahun => {
                const startYear = parseInt(tahun, 10);
                // Pastikan startYear adalah angka sebelum membuat label
                const label = !isNaN(startYear) ? `T.A. ${startYear}/${startYear + 1}` : tahun;
                return {
                    label: label,
                    value: tahun, // Value tetap tahun asli untuk filtering
                };
            });
    }, [dataPerTahun]);


    const guruOptions = useMemo((): FilterOption[] => {
        if (flattenedData.length === 0) return [];
        const uniqueGurus = new Set<string>();
        flattenedData.forEach(d => { if (d.nama_guru && d.nama_guru !== "N/A") uniqueGurus.add(d.nama_guru) });
        return Array.from(uniqueGurus).sort().map(name => ({ label: name, value: name }));
    }, [flattenedData]);

    const mataPelajaranOptions = useMemo((): FilterOption[] => {
        if (flattenedData.length === 0) return [];
        const uniqueMapels = new Set<string>();
        flattenedData.forEach(d => {
            if (d.mata_pelajaran_summary) {
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