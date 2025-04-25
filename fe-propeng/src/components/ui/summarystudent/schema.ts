// src/components/ui/summarystudent/schema.ts
import { z } from 'zod';

// Tipe untuk detail kelas (jika API mengirimkannya)
export interface KelasInfo {
  nama: string;
  tahun_ajaran: string; // Diasumsikan string dari API
  angkatan: number;
}
export const kelasInfoSchema = z.object({
  nama: z.string(),
  tahun_ajaran: z.string(),
  angkatan: z.number(),
});

// Tipe untuk satu komponen nilai yang diterima dari API
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

// Tipe untuk satu mata pelajaran yang diterima dari API
export interface SubjectGradeFromApi {
  id: string;
  nama: string;
  kategori: 'Wajib' | 'Peminatan' | string;
  kode?: string;
  pengetahuan: ComponentScoreDetail[]; // Rincian komponen Pengetahuan
  keterampilan: ComponentScoreDetail[]; // Rincian komponen Keterampilan
}
export const subjectGradeFromApiSchema = z.object({
  id: z.string(),
  nama: z.string(),
  kategori: z.enum(['Wajib', 'Peminatan']).or(z.string()),
  kode: z.string().optional(),
  pengetahuan: z.array(componentScoreDetailSchema),
  keterampilan: z.array(componentScoreDetailSchema),
});

// Tipe data yang digunakan di tabel frontend (setelah nilai akhir dihitung)
export interface SubjectGradeForTable extends SubjectGradeFromApi {
    calculatedNilaiPengetahuan: number | null;
    calculatedNilaiKeterampilan: number | null;
}

// Tipe untuk keseluruhan data nilai siswa dari API
export interface StudentGradesDataFromApi {
  kelas?: KelasInfo | null;
  nilai_siswa: SubjectGradeFromApi[];
}
export const studentGradesDataFromApiSchema = z.object({
  kelas: kelasInfoSchema.nullable().optional(),
  nilai_siswa: z.array(subjectGradeFromApiSchema),
});

// Tipe untuk rekap kehadiran
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
export const attendanceSummaryDataSchema = z.object({
    status: z.number(),
    message: z.string(),
    kelas_aktif: z.string().optional(),
    siswa: z.string().optional(),
    periode: z.object({ start_date: z.string(), end_date: z.string() }).optional(),
    rekap_kehadiran: z.object({
        Hadir: z.number().optional().default(0),
        Izin: z.number().optional().default(0),
        Sakit: z.number().optional().default(0),
        Alfa: z.number().optional().default(0),
    }).passthrough(),
});