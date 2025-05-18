// app/admin/evaluasi-guru/overview-tahunan/schema.ts
import { z } from 'zod';

export interface SkorPerVariabelBackend {
  [variabelId: string]: string; 
}

export interface EvaluasiGuruRaw {
  guru_id: number;
  nama_guru: string;
  nisp: string | null;
  mata_pelajaran_summary: string[]; // Ini berisi "Nama Mapel (Kelas X)"
  total_pengisi: number;
  skor_per_variabel: SkorPerVariabelBackend;
}

export interface FlattenedEvaluasiGuruOverview extends EvaluasiGuruRaw {
  tahun_ajaran: string; 
  row_id: string; 
  // Field baru untuk filter:
  skor_rata_rata_numerik: number | null; // Skor numerik untuk filter rentang (misal, rata-rata dari semua var, atau var tertentu)
  mata_pelajaran_summary: string[]; // Daftar nama mapel unik, e.g., ["Matematika", "Fisika"]
}

export interface ApiResponseOverview {
  status: number;
  message: string;
  data_evaluasi_per_tahun: {
    [tahunAjaran: string]: EvaluasiGuruRaw[];
  };
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const variabelColumnsMap: { [key: string]: string } = {
  '1': 'Rerata Materi Pembelajaran',
  '2': 'Rerata Proses Pembelajaran',
  '3': 'Rerata Pengelolaan Kelas',
  '4': 'Rerata Evaluasi Pembelajaran',
  '5': 'Rerata Pengalaman Belajar', 
};

export const rentangNilaiOptions: FilterOption[] = [
    { label: "5.00", value: "5.00" },
    { label: ">4.00 - <5.00", value: "4.01-4.99" },
    { label: ">3.00 - <4.00", value: "3.01-3.99" },
    { label: ">2.00 - <3.00", value: "2.01-2.99" },
    { label: ">1.00 - <2.00", value: "1.01-1.99" },
    { label: "< 1.00", value: "0-0.99" },
];