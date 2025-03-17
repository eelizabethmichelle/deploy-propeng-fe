"use client";

import { useState, useEffect } from "react";
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

export default function TambahMataPelajaran() {
  const [namaPelajaran, setNamaPelajaran] = useState("");
  const [kategoriMatpel, setKategoriMatpel] = useState<"Wajib" | "Peminatan">("Wajib");
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
    kategoriMatpel: false,
    angkatan: false,
    guru: false,
    siswa: false,
    tahunAjaran: false
  });

  // Fetch Guru dari API
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  
    if (!token) {
      console.error("Token tidak tersedia.");
      return;
    }
  
    fetch("http://localhost:8000/api/auth/list_teacher/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setDaftarGuru(data.data);
      })
      .catch((error) => console.error("Error fetching guru:", error));
  }, []);
  
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  
    if (!token) {
      console.error("Token tidak tersedia.");
      return;
    }
  
    fetch("http://localhost:8000/api/auth/list_student/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === 200) {
        setDaftarSiswa(data.data);
      } else {
        console.error("Error fetching siswa:", data.message);
      }
    })
    .catch((error) => console.error("Error fetching siswa:", error));
  }, []);

  console.log(daftarSiswa)
  // Filter daftarSiswa berdasarkan angkatan yang dipilih
  useEffect(() => {
    console.log(angkatan)
    if (angkatan) {
      const normalizedAngkatan = parseInt(angkatan, 10);
      const filtered = daftarSiswa.filter((s) => {
        // Normalize tahunAjaran format
        const siswaTahun = s.tahunAjaran < 100 ? 2000 + s.tahunAjaran : s.tahunAjaran;
        return siswaTahun === normalizedAngkatan;
      });
      setFilteredSiswa(daftarSiswa);
    } else {
      setFilteredSiswa([]); // Kosongkan jika tidak ada angkatan yang dipilih
    }
  }, [angkatan, daftarSiswa]);

  const handleSubmit = async () => {
    const newErrors = {
      namaPelajaran: !namaPelajaran,
      angkatan: !angkatan,
      kategoriMatpel: !kategoriMatpel,
      guru: !guru,
      siswa: siswa.length === 0,
      tahunAjaran: !angkatan
      // tahunAjaran: !tahunAjaran || !/^\d{2}$/.test(tahunAjaran) || !tahunAjaranEnd || !/^\d{2}$/.test(tahunAjaranEnd),
    };

    setErrors(newErrors);

    // Stop submission if any field is empty
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
      nama: namaPelajaran,
      kategoriMatpel: kategoriMatpel,
      kelas: Number(angkatan),
      tahunAjaran: Number(angkatan),
      // tahunAjaran: formattedTahunAjaran,
      teacher: guru || null,
      siswa_terdaftar: siswa,
      is_archived: status === "inactive",
    };

    try {
      const response = await fetch("http://localhost:8000/api/matpel/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Mata Pelajaran berhasil ditambahkan!");
      } else {
        console.error("Error:", data);
        alert(`Gagal menambahkan mata pelajaran: ${data.message}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Terjadi kesalahan jaringan, coba lagi.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-xl font-bold mb-4">Tambah Mata Pelajaran</h1>

      {/* Input Nama Pelajaran */}
      <label className="block text-sm font-medium">Nama Mata Pelajaran*</label>
      <Input
        type="text"
        placeholder="contoh: Matematika"
        value={namaPelajaran}
        onChange={(e) => setNamaPelajaran(e.target.value)}
        className={`mb-2 ${errors.namaPelajaran ? "border-red-500" : ""}`}
      />
      {errors.namaPelajaran && <p className="text-red-500 text-sm">Nama mata pelajaran wajib diisi!</p>}


      {/* Radio Group Sifat Mata Pelajaran */}
      <label className="block text-sm font-medium">Sifat Mata Pelajaran*</label>
      <RadioGroup className="mb-4" value={kategoriMatpel} onValueChange={(value: "Wajib" | "Peminatan") => setKategoriMatpel(value)}>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <RadioGroupItem value="Wajib" /> Wajib
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="Peminatan" /> Peminatan
          </label>
        </div>
      </RadioGroup>
            {/* Select Guru */}
            <label className="block text-sm font-medium">Guru Mata Pelajaran*</label>
      <Select onValueChange={(value: string) => setGuru(Number(value))}>
        <SelectTrigger className={`mb-2 ${errors.guru ? "border-red-500" : ""}`}>
          <SelectValue placeholder="Pilih Guru" />
        </SelectTrigger>
        <SelectContent>
          {daftarGuru.map((guru) => (
            <SelectItem key={guru.id} value={guru.id.toString()}>
              {guru.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.guru && <p className="text-red-500 text-sm">Guru wajib dipilih!</p>}
      <label className="block text-sm font-medium">Tahun Ajaran (Format: TA 20xx/xx)*</label>
  <div className="flex items-center mb-2">
    <span className="mr-2">TA 20</span>
    <Input
      type="text"
      placeholder="23"
      maxLength={2}
      value={tahunAjaran}
      onChange={(e) => setTahunAjaran(e.target.value.replace(/[^\d]/g, ""))}
      className={`w-20 ${errors.tahunAjaran ? "border-red-500" : ""}`}
    />
    <span className="mx-2">/</span>
    <Input
      type="text"
      placeholder="24"
      maxLength={2}
      value={tahunAjaranEnd}
      onChange={(e) => setTahunAjaranEnd(e.target.value.replace(/[^\d]/g, ""))}
      className={`w-20 ${errors.tahunAjaran ? "border-red-500" : ""}`}
    />
  </div>
  {errors.tahunAjaran && (
    <p className="text-red-500 text-sm">Tahun ajaran wajib diisi dengan format dua angka, contoh: "23/24"!</p>
  )}

      {/* Select Angkatan */}
      <label className="block text-sm font-medium">Angkatan*</label>
      <Select onValueChange={setAngkatan}>
        <SelectTrigger className={`mb-2 ${errors.angkatan ? "border-red-500" : ""}`}>
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
      {errors.angkatan && <p className="text-red-500 text-sm">Angkatan wajib dipilih!</p>}

      {/* Select Siswa */}
      <label className="block text-sm font-medium">Siswa*</label>
      <Select onValueChange={(value: string) => setSiswa([Number(value)])}>
        <SelectTrigger className={`mb-2 ${errors.siswa ? "border-red-500" : ""}`}>
          <SelectValue placeholder="Pilih Siswa" />
        </SelectTrigger>
        <SelectContent>
        {filteredSiswa.length > 0 ? (
  filteredSiswa.map((siswa) => (
    <SelectItem key={siswa.id} value={siswa.id.toString()}>
      {siswa.name}
    </SelectItem>
  ))
) : (
  <div className="p-2 text-gray-500 text-center">Tidak ada siswa untuk angkatan ini</div>
)}


        </SelectContent>
      </Select>
      {errors.siswa && <p className="text-red-500 text-sm">Minimal satu siswa harus dipilih!</p>}


      {/* Status Dropdown */}
      <label className="block text-sm font-medium">Status*</label>
      <Select value={status} onValueChange={(value: "active" | "inactive") => setStatus(value)}>
        <SelectTrigger className="mb-4">
          <SelectValue placeholder="Pilih Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Buttons */}
      <div className="flex gap-4 mt-4">
        <Button variant="outline">Kembali</Button>
        <Button onClick={handleSubmit}>Simpan</Button>
      </div>
    </div>
  );
}