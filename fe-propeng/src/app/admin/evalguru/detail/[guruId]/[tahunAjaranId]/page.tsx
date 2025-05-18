
'use client';

import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export default function DetailEvaluasiGuruPage() {
    const router = useRouter();
    const params = useParams();
    const guruId = params.guruId as string;
    const tahunAjaranId = params.tahunAjaranId as string;

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
                router.push('/login'); 
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
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [guruId, tahunAjaranId, router]);
}