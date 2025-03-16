"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-matpel/data-table";
import { mataPelajaranColumns } from "@/components/ui/dt-lihat-matpel/columns";

interface MataPelajaran {
  id: number;
  kode: string;
  namaMatpel: string;
  is_archived: boolean;
  teacher: number; // ID Guru dari API
  siswa_terdaftar: number[]; // Array ID siswa
}

// 🔹 Tambahkan Interface Baru untuk Data yang Sudah Diformat
interface FormattedMataPelajaran {
  kode: string;
  name: string;
  status: string;
  teacher: string;
  students: number;
}

export default function MataPelajaranPage() {
  const [data, setData] = useState<FormattedMataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // ✅ Ambil token dari localStorage
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Unauthorized: Token tidak ditemukan.");
          setLoading(false);
          return;
        }

        // ✅ Fetch Data Mata Pelajaran
        const response = await fetch("http://localhost:8000/api/matpel/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const mataPelajaran: MataPelajaran[] = await response.json();

        // ✅ Fetch Data Guru untuk Mendapatkan Nama
        const teacherResponse = await fetch("http://localhost:8000/api/auth/list_teacher/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!teacherResponse.ok) throw new Error(`HTTP error! Status: ${teacherResponse.status}`);

        const teacherData = await teacherResponse.json();
        const teacherMap = teacherData.data.reduce((acc: Record<number, string>, guru: any) => {
          acc[guru.id] = guru.name;
          return acc;
        }, {});

        // ✅ Format Data untuk Table
        const formattedData: FormattedMataPelajaran[] = mataPelajaran.map((matpel) => ({
        
            id: matpel.id,  // ✅ Keep ID as number
            name: matpel.namaMatpel || "", // ✅ Rename namaMatpel to name
            kode: matpel.kode || "", // ✅ Keep kode
            status: matpel.is_archived ? "Inactive" : "Active", // ✅ Convert is_archived
            teacher: teacherMap[matpel.teacher] , // ✅ Konversi ID guru ke nama
            students: matpel.siswa_terdaftar.length, // ✅ Count siswa_terdaftar
 
        }));

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Gagal mengambil data mata pelajaran. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-4">Manajemen Mata Pelajaran</h1>

      {/* 📊 Status Loading atau Error */}
      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* 📊 Table */}
      {!loading && !error && (
        <div className="relative">
          {data.length > 0 ? (
            <DataTable columns={mataPelajaranColumns} data={data} />
          ) : (
            <p className="text-gray-500">Tidak ada data mata pelajaran.</p>
          )}
        </div>
      )}
    </div>
  );
}
