// src/components/ui/summarystudent/schema.ts
import { z } from 'zod';

// Tipe untuk detail kelas
export interface KelasInfo {
  nama: string;
  tahun_ajaran: string;
  angkatan: number | null; // Allow null if angkatan might be missing
}
export const kelasInfoSchema = z.object({
  nama: z.string(),
  tahun_ajaran: z.string(),
  angkatan: z.number().nullable(),
});

// Tipe untuk satu komponen nilai
export interface ComponentScoreDetail {
  komponen: string;
  bobot: number | null;
  nilai: number | null;
}
export const componentScoreDetailSchema = z.object({
  komponen: z.string(),
  bobot: z.number().nullable(),
  nilai: z.number().nullable(),
});

// Tipe untuk satu mata pelajaran DARI API (termasuk rata-rata)
export interface SubjectGradeFromApi {
  id: string;
  nama: string;
  kategori: 'Wajib' | 'Peminatan' | string;
  kode?: string;
  capaian_pengetahuan?: string | null; // Add if your API sends this
  capaian_keterampilan?: string | null; // Add if your API sends this
  pengetahuan: ComponentScoreDetail[];
  keterampilan: ComponentScoreDetail[];
  // --- ADDED Backend Averages ---
  rata_rata_pengetahuan: number | null;
  rata_rata_keterampilan: number | null;
  // --- --- --- --- --- --- --- ---
}
export const subjectGradeFromApiSchema = z.object({
  id: z.string(),
  nama: z.string(),
  kategori: z.enum(['Wajib', 'Peminatan']).or(z.string()),
  kode: z.string().optional(),
  capaian_pengetahuan: z.string().nullable().optional(),
  capaian_keterampilan: z.string().nullable().optional(),
  pengetahuan: z.array(componentScoreDetailSchema),
  keterampilan: z.array(componentScoreDetailSchema),
  // --- ADDED Backend Averages ---
  rata_rata_pengetahuan: z.number().nullable(),
  rata_rata_keterampilan: z.number().nullable(),
  // --- --- --- --- --- --- --- ---
});

// Tipe untuk keseluruhan data nilai siswa dari API
export interface StudentGradesDataFromApi {
  siswa_info: { // Add student info if present
      id: string;
      username: string;
      nama: string;
  };
  kelas?: KelasInfo | null;
  nilai_siswa: SubjectGradeFromApi[];
}
export const studentGradesDataFromApiSchema = z.object({
   siswa_info: z.object({
       id: z.string(),
       username: z.string(),
       nama: z.string(),
   }),
  kelas: kelasInfoSchema.nullable().optional(),
  nilai_siswa: z.array(subjectGradeFromApiSchema),
});

// Tipe untuk rekap kehadiran (Keep as is)
export interface AttendanceSummaryData {
  status: number;
  message: string;
  kelas_aktif?: string;
  siswa?: string;
  periode?: { start_date: string; end_date: string; };
  rekap_kehadiran: {
    Hadir?: number; Izin?: number; Sakit?: number; Alfa?: number;
  };
}
// ... (keep attendanceSummaryDataSchema)
