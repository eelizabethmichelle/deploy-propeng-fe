'use client';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DashboardIcon } from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { BookDown, ChevronDown, Download, Mail } from "lucide-react"; 
import { useParams, useRouter } from "next/navigation"; 
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export default function DetailEvaluasiGuruPage() {
    const params = useParams();
    const router = useRouter(); 
    const guruId = params.guruId as string;
    const tahunAjaranId = params.tahunAjaranId as string;
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetailEvaluasi = useCallback(async () => {
        if (!guruId || !tahunAjaranId) {
            setError("ID Guru atau Tahun Ajaran tidak valid.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) {
                setError("Token otentikasi tidak ditemukan. Silakan login kembali.");
                setIsLoading(false);
                toast.error("Sesi tidak valid.");
                return;
            }
            const fetchUrl = `/api/evalguru/admin/detail-tahunan?guru_id=${guruId}&tahun_ajaran_id=${tahunAjaranId}`;
            const response = await fetch(fetchUrl, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` },
                cache: 'no-store'
            });
            const rawData = await response.json();
            if (!response.ok) {
                throw new Error(rawData.message || `Gagal memuat data evaluasi (Status: ${response.status})`);
            }
            if (rawData.status !== 200 || !rawData.info_konteks || !Array.isArray(rawData.evaluasi_per_matapelajaran)) {
                throw new Error(rawData.message || "Format data dari server tidak sesuai harapan.");
            }
            setData(rawData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [guruId, tahunAjaranId, router]); 

    useEffect(() => {
        fetchDetailEvaluasi();
    }, [fetchDetailEvaluasi]);

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Memuat data evaluasi...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
    }

    if (!data) {
        return <div className="container mx-auto p-4 text-center">Data tidak ditemukan.</div>;
    }

    const tahunAjaranDisplay = data?.info_konteks?.tahun_ajaran;
    const parsedTahunAjaran = tahunAjaranDisplay ? parseInt(tahunAjaranDisplay) : NaN;
    const nextTahunAjaranDisplay = !isNaN(parsedTahunAjaran) ? (parsedTahunAjaran + 1).toString() : 'N/A';
    
    const mataPelajaranOptions = data?.evaluasi_per_matapelajaran.map((item: any) => ({
        label: item.nama_matapelajaran, 
        value: item.matapelajaran_id,   
    })) || [];
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-x-6 gap-y-3">
                <div className='space-y-1'>
                    <h2 className="text-xl font-semibold">Data Evaluasi Guru</h2>
                    {data?.info_konteks ? (
                        <div className="pt-4">
                            <p className="text-sm pb-2">{data.info_konteks.nama_guru || "Nama guru tidak tersedia"}</p>
                            <p className="text-sm text-muted-foreground pb-2">
                                {data.info_konteks.nisp || "NISP tidak tersedia"}
                            </p>
                            {data.info_konteks.daftar_matapelajaran_diajar && data.info_konteks.daftar_matapelajaran_diajar.length > 0 ? (
                                <p className="text-sm text-muted-foreground pb-2">
                                    Mata Pelajaran Diajar: {data.info_konteks.daftar_matapelajaran_diajar.join(', ')}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground pb-2">
                                    Informasi mata pelajaran diajar tidak tersedia.
                                </p>
                            )}
                            <p className="text-sm pb-2 text-muted-foreground">
                                Tahun Ajaran {tahunAjaranDisplay !== undefined ? tahunAjaranDisplay : 'N/A'} / {nextTahunAjaranDisplay}
                            </p>

                        </div>
                    ) : (
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground">Sedang memuat informasi guru...</p>
                        </div>
                    )}
                </div>
                <div className='flex items-center gap-2 flex-shrink-0 self-start pt-1'>
                    <Button className="w-full" variant={"secondary"} onClick={() => toast.info("Fungsi unduh PDF belum diimplementasikan.")}>
                        <Download className="mr-2 h-4 w-4" /> Unduh PDF
                    </Button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 mb-4 w-full">
            <Tabs defaultValue="ringkasan" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-8 bg-white">
                    <TabsTrigger
                        value="ringkasan"
                        className={cn(
                            "flex items-center justify-center rounded-md border-2 border-muted p-3", 
                            "hover:bg-white hover:text-accent-foreground", 
                            "data-[state=active]:border-primary data-[state=active]:text-accent-foreground",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "text-sm font-medium bg-white"
                        )}
                    >
                        <DashboardIcon className="mr-2 h-4 w-4 text-primary" /> Ringkasan Evaluasi
                    </TabsTrigger>

                    <TabsTrigger
                        value="detailevaluasi"
                        className={cn(
                            "flex items-center justify-center rounded-md border-2 border-muted p-3", 
                            "hover:bg-white hover:text-accent-foreground",
                            "data-[state=active]:border-primary  data-[state=active]:text-accent-foreground", 
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "text-sm font-medium bg-white" 
                        )}
                    >
                        <BookDown className="mr-2 h-4 w-4 text-primary" /> Detail Evaluasi
                    </TabsTrigger>
                        
                    <TabsTrigger
                        value="kritikdansaran"
                        className={cn(
                            "flex items-center justify-center rounded-md border-2 border-muted p-3", 
                            "hover:bg-white hover:text-accent-foreground",
                            "data-[state=active]:border-primary  data-[state=active]:text-accent-foreground", 
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "text-sm font-medium bg-white" 
                        )}
                    >
                        <Mail className="mr-2 h-4 w-4 text-primary" /> Kritik dan Saran
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ringkasan">
                    <div className="bg-card p-0">
                        <RingkasanEvaluasiGuru dataKeseluruhan={data?.evaluasi_keseluruhan_rerata} />
                    </div>
                </TabsContent>
                <TabsContent value="detailevaluasi">
                    <div className="bg-card p-0">
                            <DetailEvaluasiGuru mataPelajaranOptions={mataPelajaranOptions} evaluasiData={data?.evaluasi_per_matapelajaran} />
                    </div>
                </TabsContent>
                <TabsContent value="kritikdansaran">
                    <div className="bg-card p-0">
                        <KritikDanSaranGuru mataPelajaranOptions={mataPelajaranOptions} evaluasiData={data?.evaluasi_per_matapelajaran} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </div>
    );
}


function RingkasanEvaluasiGuru({ dataKeseluruhan }: { dataKeseluruhan: any }) {
    if (!dataKeseluruhan || dataKeseluruhan === null) {
        return (
            <div className="container mx-auto">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <DashboardIcon className="mr-2 h-4 w-4 text-primary" /> Ringkasan Evaluasi Gabungan
                </h4>
                <p className="text-sm text-muted-foreground">Data ringkasan evaluasi gabungan tidak tersedia atau tidak ada evaluasi yang ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
                <DashboardIcon className="mr-2 h-4 w-4 text-primary" /> Ringkasan Evaluasi Gabungan (Semua Mata Pelajaran)
            </h4>
            <div className="p-4 border rounded-md bg-background shadow">
                <p className="text-sm"><strong>Total Pengisi Evaluasi:</strong> {dataKeseluruhan.jumlah_form_evaluasi_terisi ?? 'N/A'}</p>
                <p className="text-sm"><strong>Total Siswa di Mapel Terevaluasi:</strong> {dataKeseluruhan.total_siswa_diajar_di_matapelajaran_terevaluasi ?? 'N/A'}</p>
                <p className="text-sm mb-2"><strong>Kelas yang Mengevaluasi:</strong> {dataKeseluruhan.daftar_kelas_evaluasi_unik_gabungan || 'N/A'}</p>
                {/* {dataKeseluruhan.skor_grand_total_dari_variabel_gabungan && (
                    <p className="text-sm font-medium mb-2"><strong>Skor Rata-Rata dari Variabel Gabungan:</strong> {dataKeseluruhan.skor_grand_total_dari_variabel_gabungan}</p>
                )} */}


                {dataKeseluruhan.ringkasan_skor_rata_rata_per_variabel_gabungan && Object.keys(dataKeseluruhan.ringkasan_skor_rata_rata_per_variabel_gabungan).length > 0 ? (
                    <div className="mt-3">
                        <h6 className="font-medium text-sm mb-1">Ringkasan Skor Rata-Rata per Variabel (Gabungan):</h6>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            {Object.entries(dataKeseluruhan.ringkasan_skor_rata_rata_per_variabel_gabungan).map(([key, value]) => (
                                <li key={key}>Variabel {key}: {String(value)}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground mt-3">Ringkasan skor rata-rata per variabel tidak tersedia.</p>
                )}

                {dataKeseluruhan.detail_skor_rata_rata_per_indikator_gabungan && dataKeseluruhan.detail_skor_rata_rata_per_indikator_gabungan.length > 0 ? (
                    <div className="mt-3">
                        <h6 className="font-medium text-sm mb-1">Detail Skor Rata-Rata per Indikator (Gabungan):</h6>
                        {dataKeseluruhan.detail_skor_rata_rata_per_indikator_gabungan.map((item: any, index: number) => (
                            <div key={index}>
                                <p className="font-medium text-sm mb-1">Variabel {item.variabel_id}:</p>
                                <ul className="list-disc pl-5 text-sm space-y-0.5">
                                    {Object.entries(item).filter(([key]) => key !== "variabel_id").map(([key, value]) => (
                                        <li key={key}>{key.replace("Indikator ", "Indikator ")}: {String(value)}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="text-sm text-muted-foreground mt-3">Detail skor rata-rata per indikator tidak tersedia.</p>
                )}
            </div>
        </div>
    );
}


function DetailEvaluasiGuru({ 
    mataPelajaranOptions,
    evaluasiData 
}: { 
    mataPelajaranOptions: Array<{ label: string, value: string }>,
    evaluasiData: any[] 
}) {
    const [selectedMapelValue, setSelectedMapelValue] = useState(mataPelajaranOptions?.[0]?.value || "");

    const currentSelectedLabel = mataPelajaranOptions?.find(opt => opt.value === selectedMapelValue)?.label || "Pilih Mata Pelajaran";

    const selectedMapelDetails = evaluasiData?.find(item => item.matapelajaran_id === selectedMapelValue);


    if (!mataPelajaranOptions || mataPelajaranOptions.length === 0) {
        return (
            <div className="container mx-auto">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <BookDown className="mr-2 h-4 w-4 text-primary" /> Detail Evaluasi
                </h4>
                <p className="text-muted-foreground">Tidak ada mata pelajaran tersedia untuk dipilih.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h4 className="text-lg font-semibold flex items-center shrink-0">
                    <BookDown className="mr-2 h-4 w-4 text-primary" /> Detail Evaluasi per Mata Pelajaran
                </h4>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="flex h-9 w-full sm:w-auto min-w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                        <span className="truncate">{currentSelectedLabel}</span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                        {mataPelajaranOptions.map((mapel) => (
                            <DropdownMenuItem
                                key={mapel.value}
                                onSelect={() => {
                                    setSelectedMapelValue(mapel.value);
                                }}
                            >
                                {mapel.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {selectedMapelValue && selectedMapelDetails ? (
                <div className="mt-4 p-4 border rounded-md bg-background shadow">
                    <h5 className="font-semibold text-md mb-3">Detail untuk: {selectedMapelDetails.nama_matapelajaran || currentSelectedLabel}</h5>
                    
                    <p className="text-sm"><strong>Total Pengisi Evaluasi:</strong> {selectedMapelDetails.total_pengisi_evaluasi ?? 'N/A'}</p>
                    <p className="text-sm"><strong>Total Siswa di Mata Pelajaran:</strong> {selectedMapelDetails.total_siswa_di_matapelajaran ?? 'N/A'}</p>
                    <p className="text-sm mb-2"><strong>Kelas yang Mengevaluasi:</strong> {selectedMapelDetails.daftar_kelas_evaluasi || 'N/A'}</p>

                    {selectedMapelDetails.ringkasan_skor_per_variabel && (
                        <div className="mt-3">
                            <h6 className="font-medium text-sm mb-1">Ringkasan Skor per Variabel:</h6>
                            <ul className="list-disc pl-5 text-sm">
                                {Object.entries(selectedMapelDetails.ringkasan_skor_per_variabel).map(([key, value]) => (
                                    <li key={key}>Variabel {key}: {String(value)}</li>
                                ))}
                            </ul>
                        </div>
                    )}


                    {selectedMapelDetails.detail_skor_per_indikator && (
                        <div className="mt-3">
                            <h6 className="font-medium text-sm mb-1">Detail Skor Per Indikator:</h6>
                            {selectedMapelDetails.detail_skor_per_indikator.map((item: any, index: number) => (
                                <div key={index} className="mb-2">
                                    <h6 className="font-medium text-sm mb-1">Variabel {item.variabel_id}:</h6>
                                    <ul className="list-disc pl-5 text-sm">
                                        {Object.entries(item).filter(([key]) => key !== "variabel_id").map(([key, value]) => (
                                            <li key={key}>{key}: {String(value)}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : selectedMapelValue ? (
                <p className="mt-4 text-muted-foreground">Detail evaluasi untuk mata pelajaran terpilih tidak ditemukan.</p>
            ) : null}
        </div>
    );
}


function KritikDanSaranGuru({ 
    mataPelajaranOptions,
    evaluasiData 
}: { 
    mataPelajaranOptions: Array<{ label: string, value: string }>,
    evaluasiData: any[] 
}) {
    const [selectedMapelValue, setSelectedMapelValue] = useState(mataPelajaranOptions?.[0]?.value || "");

    const currentSelectedLabel = mataPelajaranOptions?.find(opt => opt.value === selectedMapelValue)?.label || "Pilih Mata Pelajaran";

    const selectedMapelDetails = evaluasiData?.find(item => item.matapelajaran_id === selectedMapelValue);


    if (!mataPelajaranOptions || mataPelajaranOptions.length === 0) {
        return (
            <div className="container mx-auto">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-primary" /> Kritik dan Saran
                </h4>
                <p className="text-sm text-muted-foreground">Data kritik dan saran akan ditampilkan di sini.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h4 className="text-lg font-semibold flex items-center shrink-0">
                    <BookDown className="mr-2 h-4 w-4 text-primary" /> Detail Evaluasi per Mata Pelajaran
                </h4>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="flex h-9 w-full sm:w-auto min-w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                        <span className="truncate">{currentSelectedLabel}</span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                        {mataPelajaranOptions.map((mapel) => (
                            <DropdownMenuItem
                                key={mapel.value}
                                onSelect={() => {
                                    setSelectedMapelValue(mapel.value);
                                }}
                            >
                                {mapel.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {selectedMapelValue && selectedMapelDetails ? (
                <div className="mt-4 p-4 border rounded-md bg-background shadow">
                    <h5 className="font-semibold text-md mb-3">Detail untuk: {selectedMapelDetails.nama_matapelajaran || currentSelectedLabel}</h5>
                    {selectedMapelDetails.daftar_kritik_saran && (
                        <div className="mt-3">
                            {selectedMapelDetails.daftar_kritik_saran.map((item: any, index: number) => (
                                <div key={index} className="mb-2">
                                    <p className="text-sm">{item}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : selectedMapelValue ? (
                <p className="mt-4 text-muted-foreground">Detail evaluasi untuk mata pelajaran terpilih tidak ditemukan.</p>
            ) : null}
        </div>
    );
}