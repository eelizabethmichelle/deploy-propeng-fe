// app/components/subject-list/schema.ts
import { z } from 'zod';

// Skema untuk satu komponen penilaian dalam summary
export interface ComponentSummary {
    id: string;
    name: string;
    weight?: number | null; // Bobot bisa null dari DB
    type: 'Pengetahuan' | 'Keterampilan' | string; // Tipe komponen
}
export const componentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().nullable().optional(), // Validasi bobot bisa null atau tidak ada
  type: z.enum(['Pengetahuan', 'Keterampilan']).or(z.string()), // Validasi tipe
});

// Tipe Status yang Mungkin (Tambahkan ini untuk konsistensi)
export type SubjectStatusType = 'Terisi Penuh' | 'Dalam Proses' | 'Belum Dimulai' | string;
const subjectStatusEnum = z.enum(['Terisi Penuh', 'Dalam Proses', 'Belum Dimulai']);

// Skema untuk ringkasan satu mata pelajaran
export interface SubjectSummary {
    id: string; // UUID MataPelajaran
    subjectId?: string; // Kode mapel (opsional?)
    name: string;
    academicYear: string;
    knowledgeWeight: number; // Total bobot Pengetahuan
    skillWeight: number;     // Total bobot Keterampilan
    componentCount: number;  // Jumlah total komponen
    studentCount: number;    // Jumlah siswa
    status: SubjectStatusType; // Status keseluruhan (masih ada dari backend)
    statusPengetahuan: SubjectStatusType; 
    statusKeterampilan: SubjectStatusType;
    components: ComponentSummary[]; // Array detail komponen
}
export const subjectSummarySchema = z.object({
   id: z.string().uuid(), // Validasi sebagai UUID jika memang UUID
   subjectId: z.string().optional(), // Kode mapel opsional
   name: z.string(),
   academicYear: z.string(),
   knowledgeWeight: z.number(), // Validasi bobot pengetahuan
   skillWeight: z.number(),     // Validasi bobot keterampilan
   componentCount: z.number(),
   studentCount: z.number(), // Asumsikan selalu ada angka jumlah siswa
   status: z.enum(['Terisi Penuh', 'Dalam Proses', 'Belum Dimulai']).or(z.string()), // Validasi status
   statusPengetahuan: subjectStatusEnum.or(z.string()),
   statusKeterampilan: subjectStatusEnum.or(z.string()),
   components: z.array(componentSummarySchema), // Validasi array komponen
 });

// ---- Definisi Tipe untuk Grade Entry (Tidak berubah) ----
export interface Student { id: string; name: string; }
// Pastikan AssessmentComponent juga punya type jika diperlukan di halaman input nilai
export interface AssessmentComponent { id: string; name: string; weight: number; type: 'Pengetahuan' | 'Keterampilan' | string; }
export type GradesState = Record<string, Record<string, number | null>>;
export interface GradeTableRowData { id: string; name: string; finalScore?: number | null; [key: string]: any; }
export const gradeTableRowSchema = z.object({ id: z.string(), name: z.string(), finalScore: z.number().nullable().optional() }).passthrough();
// ---- End Definisi Grade Entry ----