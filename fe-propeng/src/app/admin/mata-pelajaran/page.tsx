"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/dt-lihat-matpel/data-table";
import { mataPelajaranColumns } from "@/components/ui/dt-lihat-matpel/columns";
import router from "next/router";

interface MataPelajaran {
  tahunAjaran: number;
  id: number;
  kode: string;
  nama: string;
  is_archived: boolean;
  teacher: { id: number; name: string } | null; // ID Guru dari API
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
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
        if (!token) {
          setError("Unauthorized: Token tidak ditemukan.");
          setLoading(false);
          router.push("/login");
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

        const mataPelajaranResponse = await response.json();

        console.log ("dududuud")
        // console.log("API Response:", mataPelajaran); // 👉 Debug di sini

        // Cek apakah `mataPelajaranResponse.data` adalah array sebelum memanggil `.map()`
if (!mataPelajaranResponse.data || !Array.isArray(mataPelajaranResponse.data)) {
  console.error("Error: Response bukan array!", mataPelajaranResponse);
  setError("Data tidak valid dari server.");
  setLoading(false);
  return;
}

// Pastikan array yang diambil adalah `data`, bukan response utama
const mataPelajaran: MataPelajaran[] = mataPelajaranResponse.data;
console.log("Final mataPelajaran array:", mataPelajaran); // Debug untuk memastikan array

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
          id: matpel.id,
          name: matpel.nama || "", 
          kode: matpel.kode || "",
          status: matpel.is_archived ? "Inactive" : "Active",
          teacher: matpel.teacher?.name || "Unknown",
          tahunAjaran: matpel.tahunAjaran || "-", // ✅ Tambahkan ini
          students: matpel.siswa_terdaftar ? matpel.siswa_terdaftar.length : 0, // ✅ Hindari error jika siswa_terdaftar undefined
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
