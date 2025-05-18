
'use client';
import { Button } from "@/components/ui/button";
import { GradeEntryDataTable } from "@/components/ui/grade-entry/grade-entry-data-table";
import { cn } from "@/lib/utils";
import { DashboardIcon } from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { BookDown, BookText, Download, Mail, Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export default function DetailEvaluasiGuruPage() {
    const params = useParams();
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
    }, [guruId, tahunAjaranId]);

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
    const nextTahunAjaran = parseInt(tahunAjaranDisplay) + 1;
    const nextTahunAjaranDisplay = nextTahunAjaran.toString();
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
                                    {data.info_konteks.daftar_matapelajaran_diajar.join(', ')}
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
                    {/* Add functionality to the button, e.g., an onClick handler */}
                    <Button className="w-full" variant={"secondary"} onClick={() => toast.info("Fungsi unduh PDF belum diimplementasikan.")}>
                        <Download className="mr-2 h-4 w-4" /> Unduh PDF
                    </Button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 mb-4 w-full">
            <Tabs defaultValue="ringkasan" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-2 mb-8 bg-white">
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
                        <RingkasanEvaluasiGuru/>
                    </div>
                </TabsContent>
                <TabsContent value="detailevaluasi">
                    <div className="bg-card p-0">
                        <DetailEvaluasiGuru/>
                    </div>
                </TabsContent>
                <TabsContent value="kritikdansaran">
                    <div className="bg-card p-0">
                        <KritikDanSaranGuru/>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </div>
    );
}

function RingkasanEvaluasiGuru() {
    return (
        <div className="container mx-auto">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
                <DashboardIcon className="mr-2 h-4 w-4 text-primary" /> Ringkasan Evaluasi
            </h4>
        </div>
    );
}
function DetailEvaluasiGuru() {
    return (
        <div className="container mx-auto">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
                <BookDown className="mr-2 h-4 w-4 text-primary" /> Detail Evaluasi
            </h4>
        </div>
    );
}
function KritikDanSaranGuru() {
    return (
        <div className="container mx-auto">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Mail className="mr-2 h-4 w-4 text-primary" /> Kritik dan Saran
            </h4>
        </div>
    );
}