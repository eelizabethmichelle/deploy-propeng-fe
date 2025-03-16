"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Guru {
  id: number;
  name: string;
}

interface Siswa {
  id: number;
  name: string;
  tahunAjaran: number;
}

export default function UbahMataPelajaran() {
  const searchParams = useSearchParams();
  const matpelId = searchParams.get("matpelId"); // Get the ID from URL

  const [namaPelajaran, setNamaPelajaran] = useState("");
  const [sifat, setSifat] = useState<"wajib" | "minat">("wajib");
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [tahunAjaranEnd, setTahunAjaranEnd] = useState("");
  const [angkatan, setAngkatan] = useState<string>("");
  const [guru, setGuru] = useState<number | "">("");
  const [siswa, setSiswa] = useState<number[]>([]);
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [daftarGuru, setDaftarGuru] = useState<Guru[]>([]);
  const [daftarSiswa, setDaftarSiswa] = useState<Siswa[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]); // Filtered students
  const daftarAngkatan = ["2022", "2023", "2024"];

  const [errors, setErrors] = useState({
    namaPelajaran: false,
    angkatan: false,
    guru: false,
    siswa: false,
    tahunAjaran: false
  });

  // **1️⃣ Fetch Existing Mata Pelajaran Data**
  useEffect(() => {
    if (!matpelId) return;

    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      console.error("Token tidak tersedia.");
      return;
    }

    fetch(`http://localhost:8000/api/matpel//${matpelId}/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 404) {
          console.error("Mata pelajaran tidak ditemukan.");
          return;
        }

        // **Pre-fill form with existing data**
        setNamaPelajaran(data.namaMatpel);
        setSifat(data.sifat || "wajib");
        setTahunAjaran(data.tahunAjaran?.split("/")[0]?.replace("20", ""));
        setTahunAjaranEnd(data.tahunAjaran?.split("/")[1]);
        setAngkatan(data.kelas.toString());
        setGuru(data.teacher || "");
        setSiswa(data.siswa_terdaftar || []);
        setStatus(data.is_archived ? "inactive" : "active");
      })
      .catch((error) => console.error("Error fetching mata pelajaran:", error));
  }, [matpelId]);

  // **2️⃣ Handle Form Submission**
  const handleSubmit = async () => {
    const newErrors = {
      namaPelajaran: !namaPelajaran,
      angkatan: !angkatan,
      guru: !guru,
      siswa: siswa.length === 0,
      tahunAjaran: !tahunAjaran,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      alert("Mohon isi semua field yang wajib!");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Anda harus login terlebih dahulu!");
      return;
    }

    const formattedTahunAjaran = `20${tahunAjaran}/${tahunAjaranEnd}`;

    const requestBody = {
      namaMatpel: namaPelajaran,
      kelas: Number(angkatan),
      tahunAjaran: formattedTahunAjaran,
      teacher: guru || null,
      siswa_terdaftar: siswa,
      is_archived: status === "inactive",
    };

    try {
      const response = await fetch(`http://localhost:8000/api/matpel/update/${matpelId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Mata Pelajaran berhasil diperbarui!");
      } else {
        console.error("Error:", data);
        alert(`Gagal memperbarui mata pelajaran: ${data.message}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Terjadi kesalahan jaringan, coba lagi.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-xl font-bold mb-4">Edit Mata Pelajaran</h1>

      {/* Nama Mata Pelajaran */}
      <label className="block text-sm font-medium">Nama Mata Pelajaran*</label>
      <Input type="text" value={namaPelajaran} onChange={(e) => setNamaPelajaran(e.target.value)} />

      {/* Sifat Mata Pelajaran */}
      <label className="block text-sm font-medium">Sifat Mata Pelajaran*</label>
      <RadioGroup value={sifat} onValueChange={(value) => setSifat(value as "wajib" | "minat")}>
        <RadioGroupItem value="wajib" label="Wajib" />
        <RadioGroupItem value="minat" label="Minat" />
      </RadioGroup>

      {/* Tahun Ajaran */}
      <label className="block text-sm font-medium">Tahun Ajaran*</label>
      <div className="flex">
        <Input type="text" value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} className="w-20" />
        <span className="mx-2">/</span>
        <Input type="text" value={tahunAjaranEnd} onChange={(e) => setTahunAjaranEnd(e.target.value)} className="w-20" />
      </div>

      {/* Angkatan */}
      <label className="block text-sm font-medium">Angkatan*</label>
      <Select value={angkatan} onValueChange={setAngkatan}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Angkatan" />
        </SelectTrigger>
        <SelectContent>
          {daftarAngkatan.map((tahun) => (
            <SelectItem key={tahun} value={tahun}>
              {tahun}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Submit Button */}
      <Button onClick={handleSubmit} className="mt-4">
        Simpan Perubahan
      </Button>
    </div>
  );
}
