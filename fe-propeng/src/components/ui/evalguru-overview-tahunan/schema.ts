// app/admin/evaluasi-guru/overview-tahunan/schema.ts
import { z } from 'zod';

export interface SkorPerVariabelBackend {
  [variabelId: string]: string;
}

// This interface represents the raw data for one teacher entry FOR A SPECIFIC TAHUN AJARAN
// as returned by your get_overall_teacher_evaluations_overview backend,
// before it's flattened with the tahun_ajaran itself.
export interface EvaluasiGuruDataPerTA {
  guru_id: number;
  nama_guru: string;
  nisp: string | null;
  mata_pelajaran_summary: string[]; // This is the direct output from backend for a TA
  detail_per_mata_pelajaran: { // This contains info to calculate cumulative counts
      matapelajaran_id: number;
      nama_matapelajaran: string;
      total_pengisi_evaluasi: string; // e.g., "1"
      total_siswa_mapel: string;      // e.g., "4"
  }[];
  skor_per_variabel: SkorPerVariabelBackend;
}


// This is the type for the data your DataTable will actually use.
// It includes the tahun_ajaran and the new cumulative fields.
export interface FlattenedEvaluasiGuruOverview {
  guru_id: number;
  nama_guru: string;
  nisp: string | null;
  tahun_ajaran: string; // The academic year string itself (e.g., "2024")
  row_id: string; // A unique ID for the row (e.g., `guru_id-tahun_ajaran`)
  
  mata_pelajaran_summary: string[]; // List of unique subject names, can be derived or direct
  skor_per_variabel: SkorPerVariabelBackend; // Direct from backend for that teacher/TA

  // **NEW FIELDS TO ADD**
  jumlah_pengisi_kumulatif: number;
  jumlah_siswa_kumulatif: number;

  // Optional: if you still need to carry over the detailed per-subject breakdown
  // for other purposes, though it's not directly used by the overview columns
  // other than to calculate the cumulative fields above during data preparation.
  detail_per_mata_pelajaran?: {
      matapelajaran_id: number;
      nama_matapelajaran: string;
      total_pengisi_evaluasi: string;
      total_siswa_mapel: string;
  }[];

  // This field was in your original schema, ensure its calculation if still needed
  skor_rata_rata_numerik: number | null; 
}


export interface ApiResponseOverview {
  status: number;
  message: string;
  data_evaluasi_per_tahun: {
    // The key is the tahun_ajaran string (e.g., "2024")
    // The value is an array of objects, each matching EvaluasiGuruDataPerTA structure
    [tahunAjaran: string]: EvaluasiGuruDataPerTA[];
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
};

export const rentangNilaiOptions: FilterOption[] = [
    { label: "5.00", value: "5.00-5.00" }, // Ensure max is inclusive for exact match
    { label: "4.00 - <5.00", value: "4.00-4.99" },
    { label: "3.00 - <4.00", value: "3.00-3.99" },
    { label: "2.00 - <3.00", value: "2.00-2.99" },
    { label: "1.00 - <2.00", value: "1.00-1.99" },
    { label: "< 1.00", value: "0.00-0.99" },
    // { label: "Belum Dinilai", value: "N/A_SCORE" } // If you add this, update filterFn
];