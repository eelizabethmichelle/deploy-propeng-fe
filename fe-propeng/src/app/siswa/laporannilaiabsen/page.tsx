"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassListTable } from "@/components/ui/classlist/datatable";

interface StudentClass {
  id: number;
  nama: string;
  tahun_ajaran: number;
  guru: string;
}

export default function LaporanNilaiAbsenClassList() {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Unauthorized.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/kelas/student", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal memuat kelas.");
        setClasses(json.data || []);
      } catch (err: any) {
        setError(err.message || "Gagal memuat kelas.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error)
    return <div className="text-destructive text-center">{error}</div>;
  if (classes.length === 0)
    return <div className="text-center">Tidak ada kelas ditemukan.</div>;

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Daftar Kelas
          </h2>
          <p className="text-muted-foreground">
            Silakan pilih kelas untuk melihat laporan nilai dan presensi siswa
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Memuat data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      ) : (
        // Always render the DataTable, even with empty data
        <ClassListTable data={classes} />
      )}
    </div>
  );
}
