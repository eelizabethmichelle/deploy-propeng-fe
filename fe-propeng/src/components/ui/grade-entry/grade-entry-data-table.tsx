// Lokasi: app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    useReactTable, Table as TanstackTable, Row, HeaderGroup, Header, Cell,
} from '@tanstack/react-table';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GradeDataTableToolbar } from './grade-entry-table-toolbar';
import { DataTablePagination } from './pagination';
import { Student, AssessmentComponent, GradesState, GradeTableRowData, FilterOption, GradeTableMeta } from './schema';
import { generateGradeColumns } from './grade-entry-columns';
import { RotateCcw, Loader2, AlertTriangle, PlusCircle } from 'lucide-react'; // Import AlertTriangle & PlusCircle
import { useCallback } from 'react';
import { useRouter } from 'next/navigation'; // <-- Import useRouter
import { Button } from '@/components/ui/button'; // <-- Import Button
import NextImage from 'next/image'; // Ganti nama menjadi NextImage (atau nama lain yang unik)

// --- Interface Prop (Tetap Sama) ---
interface GradeEntryDataTableProps {
    students: Student[] | undefined | null;
    assessmentComponents: AssessmentComponent[] | undefined | null;
    initialGrades: GradesState;
    subjectId: string;
    subjectName?: string;
    onSaveSingleGrade: (
        studentId: string,
        componentId: string,
        score: number | null
    ) => Promise<void>;
    onDeleteComponent?: (componentId: string, componentName: string) => void;
    onUpdateComponent?: (updatedComponent: AssessmentComponent) => Promise<void>;
    // Tambahkan prop opsional untuk path halaman komponen
    assessmentComponentPath?: string;
}
// --- Tipe Statistik (Bisa ditambahkan di schema.ts atau di sini) ---
interface Statistics {
    avg: Record<string, number | null>; // Key: componentId atau 'final'
    min: Record<string, number | null>;
    max: Record<string, number | null>;
}

export function GradeEntryDataTable({
    students,
    assessmentComponents,
    initialGrades = {},
    subjectId,
    subjectName,
    onSaveSingleGrade,
    onDeleteComponent = () => { console.warn("onDeleteComponent not provided"); },
    onUpdateComponent = async () => { console.warn("onUpdateComponent not provided"); },
    assessmentComponentPath // Terima prop path
}: GradeEntryDataTableProps) {

    const router = useRouter(); // <-- Inisialisasi router

    // State lokal (Tetap Sama)
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    const [originalLoadedGrades, setOriginalLoadedGrades] = React.useState<GradesState>({});
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [isSavingRow, setIsSavingRow] = React.useState<string | null>(null);
    const [isEditingAll, setIsEditingAll] = React.useState(false);
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ 'class': false, });
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editingHeaderId, setEditingHeaderId] = React.useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = React.useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = React.useState(false);
    const [isResetting, setIsResetting] = React.useState(false);

    // Effect sinkronisasi data dari props (Tetap Sama)
    React.useEffect(() => {
        console.log(`[DataTable] Syncing state with initialGrades prop.`);
        const initialDataFromProp = initialGrades || {};
        setGrades(initialDataFromProp);
        setOriginalLoadedGrades(JSON.parse(JSON.stringify(initialDataFromProp)));
        setEditingRowId(null); setRowSelection({}); setIsEditingAll(false); setEditingHeaderId(null);
    }, [initialGrades, students, assessmentComponents]);

    // --- Opsi Filter (Tetap Sama) ---
    const nameFilterOptions = React.useMemo<FilterOption[]>(() => {
        // ... (implementasi sama)
        if (!Array.isArray(students)) return [];
        if (students.length === 0) return [];
        const uniqueNames = new Set(students.map(s => s.name).filter(Boolean));
        const sortedNames = Array.from(uniqueNames);
        try { sortedNames.sort((a, b) => a.localeCompare(b)); } catch (e) { console.error("Error sorting names:", e); return []; }
        return sortedNames.map(name => ({ label: name, value: name }));
    }, [students]);

    const classFilterOptions = React.useMemo<FilterOption[]>(() => {
        // ... (implementasi sama)
        if (!Array.isArray(students)) return [];
        if (students.length === 0) return [];
        const uniqueClasses = new Set(students.map(s => s.class).filter(Boolean));
        const sortedClasses = Array.from(uniqueClasses);
        try { sortedClasses.sort((a, b) => a.localeCompare(b)); } catch (e) { console.error("Error sorting classes:", e); return []; }
        return sortedClasses.map(className => ({ label: className, value: className }));
    }, [students]);

    const finalScoreFilterOptions: FilterOption[] = [
        { label: "< 50", value: "lt50" },
        { label: "50 - 75", value: "50to75" },
        { label: "> 75", value: "gt75" },
    ];


    // ==================================================================
    // === PERUBAHAN LOGIKA KALKULASI DATA TABEL (useMemo tableData) ===
    // ==================================================================
     const tableData = React.useMemo<GradeTableRowData[]>(() => {
        console.log("[DataTable] Recalculating tableData..."); // Log untuk debug
        const currentStudents = Array.isArray(students) ? students : [];
        const currentComponents = (Array.isArray(assessmentComponents) && assessmentComponents.length > 0)
            ? assessmentComponents
            : [];

        // Return lebih awal jika tidak ada siswa (komponen kosong tidak masalah di sini)
        if (currentStudents.length === 0) return [];

        // Kalkulasi total bobot untuk SEMUA komponen jenis ini (mungkin diperlukan untuk validasi > 100%)
        // const currentTotalWeight = currentComponents.reduce((sum, comp) => sum + (comp?.weight || 0), 0);
        // console.log("[DataTable] Total Weight for this type:", currentTotalWeight);

        return currentStudents.map((student: Student) => {
            if (!student?.id) return null;

            const studentGrades = grades[student.id] || {}; // Ambil nilai siswa saat ini dari state
            let weightedScoreSum = 0; // Akumulator untuk: Sum(Score * (Weight / 100))
            let componentProcessed = false; // Flag apakah ada komponen valid yang diproses

            const componentScores: Record<string, number | null> = {}; // Untuk menyimpan skor mentah per komponen
            currentComponents.forEach((comp: AssessmentComponent) => {
                if (!comp?.id) return;

                const compId = comp.id;
                const compWeight = comp.weight || 0;
                const score = studentGrades[compId]; // Ambil skor (bisa null/undefined)

                componentScores[compId] = (typeof score === 'number' && !isNaN(score)) ? score : null; // Simpan skor mentah

                // Hanya hitung jika skor valid (angka) dan bobot > 0
                if (typeof score === 'number' && !isNaN(score) && compWeight > 0) {
                    // === LOGIKA BARU: Hitung Kontribusi Poin ===
                    // Asumsi compWeight adalah persentase (misal 30), jadi bagi 100
                    weightedScoreSum += (score * (compWeight / 100));
                    componentProcessed = true; // Tandai bahwa setidaknya satu komponen diproses
                }
                 // Jika skor null/undefined tapi bobot > 0, tandai juga sebagai diproses agar final score jadi 0 (bukan null)
                 else if ((score === null || score === undefined) && compWeight > 0) {
                    componentProcessed = true;
                 }

            });

            // Tentukan nilai akhir berdasarkan logika baru
            let calculatedFinalScore: number | null = null;
            if (componentProcessed) {
                // Jika setidaknya satu komponen (dengan nilai valid atau null) diproses,
                // nilai akhirnya adalah jumlah kontribusi poin.
                // Jika semua nilai null/0, hasilnya akan 0.
                calculatedFinalScore = weightedScoreSum;
            } else if (currentComponents.length === 0) {
                // Jika tidak ada komponen sama sekali, nilai akhir null
                calculatedFinalScore = null;
            } else {
                // Jika ada komponen tapi tidak ada yang diproses (misal semua bobot 0),
                // anggap nilai akhir 0 atau null? Mari kita pilih 0 untuk konsistensi.
                calculatedFinalScore = 0.0;
            }

            // Debug log per siswa
            // console.log(`[DataTable] Student: ${student.name}, WeightedSum: ${weightedScoreSum}, Processed: ${componentProcessed}, Final: ${calculatedFinalScore}`);

            return {
                id: student.id,
                name: student.name,
                class: student.class,
                ...componentScores, // Sebar skor mentah per komponen
                finalScore: calculatedFinalScore // Gunakan nilai akhir yang baru dihitung
            };
        }).filter((item): item is GradeTableRowData => item !== null);
    }, [students, assessmentComponents, grades]); // grades menjadi dependency penting di sini
    // ==================================================================
    // === AKHIR PERUBAHAN LOGIKA KALKULASI DATA TABEL               ===
    // ==================================================================


        // ==========================================
    // === HITUNG STATISTIK UNTUK FOOTER ===
    // ==========================================
    const statistics = React.useMemo<Statistics | null>(() => {
        console.log("[DataTable] Calculating statistics for footer...");
        // Gunakan tableData yang sudah di-memoize, karena sudah berisi finalScore terbaru
        if (!tableData || tableData.length === 0) return null;

        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (currentComponents.length === 0) return null; // Tidak perlu statistik jika tidak ada komponen

        const componentScores: Record<string, number[]> = {};
        currentComponents.forEach(comp => { componentScores[comp.id] = []; });
        const finalScoresList: number[] = [];

        // Kumpulkan nilai dari tableData
        tableData.forEach(row => {
            // Kumpulkan skor per komponen
            currentComponents.forEach(comp => {
                const score = row[comp.id]; // Ambil skor dari data baris
                if (typeof score === 'number' && !isNaN(score)) {
                    componentScores[comp.id].push(score);
                }
            });
            // Kumpulkan skor akhir
            const finalScore = row.finalScore;
            if (typeof finalScore === 'number' && !isNaN(finalScore)) {
                finalScoresList.push(finalScore);
            }
        });

        // Hitung statistik
        const stats: Statistics = {
            avg: {}, min: {}, max: {}
        };

        currentComponents.forEach(comp => {
            const scores = componentScores[comp.id];
            stats.avg[comp.id] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
            stats.min[comp.id] = scores.length > 0 ? Math.min(...scores) : null;
            stats.max[comp.id] = scores.length > 0 ? Math.max(...scores) : null;
        });

        stats.avg['final'] = finalScoresList.length > 0 ? finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length : null;
        stats.min['final'] = finalScoresList.length > 0 ? Math.min(...finalScoresList) : null;
        stats.max['final'] = finalScoresList.length > 0 ? Math.max(...finalScoresList) : null;

        console.log("[DataTable] Footer Stats:", stats);
        return stats;

    }, [tableData, assessmentComponents]); // Dependency: tableData dan assessmentComponents
    // ==========================================
    // === AKHIR HITUNG STATISTIK FOOTER ===
    // ==========================================


    // --- Helper Function ---
    const formatNumberOrDash = (value: number | null | undefined, decimals: number = 0): string => {
        if (typeof value === 'number' && !isNaN(value)) {
            return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
        }
        return '-';
    };
    
    // --- Handlers Sederhana (Tetap Sama) ---
    const handleGradeChange = useCallback((studentId: string, componentId: string, value: string) => {
        // ... (implementasi sama)
        const numericValue = value.trim() === '' ? null : Number(value);
        let finalValue = numericValue;
        if (numericValue !== null) {
            if (isNaN(numericValue)) { toast.warning("Masukkan angka atau kosongkan."); return; }
            if (numericValue < 0 || numericValue > 100) { toast.warning("Nilai harus antara 0 dan 100."); finalValue = Math.max(0, Math.min(100, numericValue)); }
        }
        setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: finalValue } }));
    }, []);

    const handleCancelRow = useCallback((rowId: string) => {
        // ... (implementasi sama)
         const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        setGrades(prev => {
            const originalRowGrades = originalLoadedGrades[rowId] || {};
            const updatedStudentGrades = { ...(prev[rowId] || {}) };
            currentComponentsSafe.forEach((c: AssessmentComponent) => { if (c?.id) updatedStudentGrades[c.id] = originalRowGrades[c.id] ?? null; });
            return { ...prev, [rowId]: updatedStudentGrades };
        });
        setEditingRowId(null);
    }, [originalLoadedGrades, assessmentComponents]);

    const handleEditRowTrigger = useCallback((rowId: string) => {
        // ... (implementasi sama)
         if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); }
        setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId);
    }, [editingRowId, handleCancelRow]);

    const startHeaderEdit = useCallback((component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const handleDeleteComponent = useCallback((id: string, name: string) => { if(onDeleteComponent) onDeleteComponent(id, name); }, [onDeleteComponent]);
    const cancelHeaderEdit = useCallback(() => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = useCallback((field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = useCallback(async () => {
        // ... (implementasi sama)
         const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (!editingHeaderId) return; const comp = currentComponentsSafe.find(c => c.id === editingHeaderId); if (!comp) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib"); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot harus > 0."); return; } if (name.trim() === comp.name && weightValue === comp.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { if(onUpdateComponent) await onUpdateComponent({ ...comp, name: name.trim(), weight: weightValue }); toast.success(`Komponen diperbarui.`); cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update header: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); }
    }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);

    const handleEditAllTrigger = useCallback(() => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); toast.info("Mode Edit Semua Aktif"); }, []);
    const handleCancelAllEdit = useCallback(() => { setGrades(originalLoadedGrades); setIsEditingAll(false); setEditingRowId(null); toast.info("Mode Edit Semua dibatalkan."); }, [originalLoadedGrades]);

    // --- Definisi Kolom Tabel (Tetap Sama) ---
    const columns = React.useMemo<ColumnDef<GradeTableRowData>[]>(() => {
        // Gunakan safe guard lagi di sini
        const currentComponentsSafe = (Array.isArray(assessmentComponents) && assessmentComponents.length > 0)
            ? assessmentComponents
            : [];
        return generateGradeColumns(
                currentComponentsSafe,
                grades,
                startHeaderEdit,
                handleDeleteComponent,
                editingHeaderId,
                editingHeaderValues,
                handleHeaderEditChange,
                saveHeaderEdit,
                cancelHeaderEdit,
                isHeaderEditingLoading,
                !!editingRowId || isEditingAll
        );
    }, [ assessmentComponents, grades, startHeaderEdit, handleDeleteComponent, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, editingRowId, isEditingAll ]);

    // --- Deklarasi Table (Tetap Sama) ---
    const table = useReactTable<GradeTableRowData>({
        data: tableData, // Data akan kosong jika tidak ada komponen
        columns, // Kolom akan disesuaikan (tidak ada kolom komponen jika kosong)
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: {
            grades,
            editingRowId,
            isEditingAll,
            isSavingRow,
            isSavingAll,
            handleGradeChange,
            handleEditRowTrigger,
            handleCancelRow,
            handleSaveRow: (rowId: string) => handleSaveRow(rowId),
        } as GradeTableMeta
    });

    // --- Handlers Kompleks (Tetap Sama) ---

    const handleSaveRow = useCallback(async (rowId: string) => {
        const currentStudents = Array.isArray(students) ? students : [];
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (currentStudents.length === 0 || currentComponents.length === 0) {
            toast.error("Data siswa atau komponen belum siap."); return;
        }
        setIsSavingRow(rowId); // Tandai baris sedang disimpan

        const changesToSave: { componentId: string; score: number | null }[] = []; // Kumpulkan perubahan
        let validationError = false;
        const student = currentStudents.find(s => s.id === rowId);
        if (!student) {
            toast.error("Siswa tidak ditemukan."); setIsSavingRow(null); return;
        }
        const studentCurrentGrades = grades[rowId] || {};
        const studentInitialGrades = originalLoadedGrades[rowId] || {};

        // 1. Identifikasi semua perubahan dan validasi
        currentComponents.forEach((c: AssessmentComponent) => {
            if (!c?.id) return;
            const componentId = c.id;
            const currentGrade = studentCurrentGrades[componentId] ?? null;
            const initialGrade = studentInitialGrades[componentId] ?? null;

            // Cek perubahan (pastikan perbandingan null/angka benar)
            const hasChanged = JSON.stringify(currentGrade) !== JSON.stringify(initialGrade);

            if (hasChanged) {
                // Validasi nilai sebelum dimasukkan ke list
                if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) {
                     toast.error(`Nilai ${c.name} (${student.name}) tidak valid (0-100 atau kosong).`);
                     validationError = true;
                     // Jangan hentikan loop di sini, kumpulkan semua error dulu jika perlu
                     // atau return langsung jika ingin stop di error pertama
                     // return; // <-- Hapus ini agar semua divalidasi
                }
                changesToSave.push({ componentId, score: currentGrade }); // Tambahkan ke list jika berubah
            }
        });

        // Jika ada error validasi, hentikan proses simpan
        if (validationError) {
            setIsSavingRow(null);
            return;
        }

        // Jika tidak ada perubahan
        if (changesToSave.length === 0) {
            toast.info(`Tidak ada perubahan nilai untuk ${student.name}.`);
            setIsSavingRow(null);
            setEditingRowId(null); // Tutup mode edit
            return;
        }

        // 2. Kirim perubahan secara SEKUENTIAL
        let saveSuccess = true; // Flag untuk status keseluruhan
        console.log(`[SaveRow Sequential] Saving ${changesToSave.length} changes for ${student.name}...`);
        for (const change of changesToSave) {
            try {
                // Panggil onSaveSingleGrade (yang memanggil API) dan tunggu selesai
                await onSaveSingleGrade(rowId, change.componentId, change.score);
                console.log(`  - Saved Comp: ${change.componentId}, Score: ${change.score}`);
            } catch (error) {
                console.error(`[SaveRow Sequential] FAILED for Comp: ${change.componentId}, Score: ${change.score}:`, error);
                saveSuccess = false;
                // Hentikan loop jika satu gagal? Atau lanjutkan? Tergantung kebutuhan.
                // Di sini kita hentikan jika satu gagal agar tidak membuat state tidak konsisten.
                break; // Hentikan loop jika ada error
            }
        }

        // 3. Update state dan UI setelah semua (atau sebagian) berhasil
        if (saveSuccess) {
            toast.success(`Nilai ${student.name} (${changesToSave.length} perubahan) berhasil disimpan.`);
            // Update originalLoadedGrades HANYA jika semua berhasil
            setOriginalLoadedGrades(prevOrig => {
                const newOrig = JSON.parse(JSON.stringify(prevOrig));
                newOrig[rowId] = { ...(newOrig[rowId] || {}), ...studentCurrentGrades }; // Update dengan semua nilai saat ini
                return newOrig;
            });
             setEditingRowId(null); // Tutup mode edit jika semua sukses
        } else {
            // Toast error sudah ditangani di handleSaveSingleGradeClient atau di catch di atas
            toast.warning(`Sebagian nilai ${student.name} mungkin gagal disimpan. Silakan cek kembali.`);
            // Jangan tutup mode edit jika ada yg gagal? Atau biarkan guru yg cancel manual?
            // setEditingRowId(null); // <-- Mungkin jangan ditutup otomatis
        }

        setIsSavingRow(null); // Selesai menyimpan (baik sukses maupun gagal)

    }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade]); // Tambahkan dependency

    // handleSaveAllChanges (Tetap Sama)
    const handleSaveAllChanges = useCallback(async () => {
        // ... (implementasi sama)
        const currentStudents = Array.isArray(students) ? students : [];
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (currentStudents.length === 0 || currentComponents.length === 0) { toast.error("Data siswa atau komponen belum siap."); return; }
        setIsSavingAll(true);
        const studentsWithChanges: Record<string, GradesState[string]> = {};
        const changesToSave: { studentId: string; componentId: string; score: number | null; studentName: string; componentName: string }[] = [];
        let validationError = false; let saveErrors: { studentName: string; componentName: string; message: string }[] = [];

        for (const student of currentStudents) {
             if (!student?.id) continue; const studentId = student.id; const studentCurrentGrades = grades[studentId] || {}; const studentInitialGrades = originalLoadedGrades[studentId] || {}; let studentHasChanges = false;
             for (const component of currentComponents) {
                 if (!component?.id) continue; const compId = component.id; const current = studentCurrentGrades[compId] ?? null; const initial = studentInitialGrades[compId] ?? null; const hasChanged = JSON.stringify(current) !== JSON.stringify(initial);
                 if (hasChanged) {
                     if (current !== null && (isNaN(Number(current)) || Number(current) < 0 || Number(current) > 100)) { toast.error(`Nilai ${component.name} (${student.name}) tidak valid.`); validationError = true; break; }
                     changesToSave.push({ studentId, componentId: compId, score: current, studentName: student.name, componentName: component.name }); studentHasChanges = true;
                 }
             } if (validationError) break; if (studentHasChanges) { studentsWithChanges[studentId] = { ...studentCurrentGrades }; }
        }
        if (validationError) { setIsSavingAll(false); return; }
        if (changesToSave.length === 0) { toast.info(`Tidak ada perubahan nilai untuk disimpan.`); setIsSavingAll(false); setIsEditingAll(false); return; }

        console.log(`[Save All] Found ${changesToSave.length} changes. Starting sequential save...`);
        let successCount = 0;
        for (const change of changesToSave) {
            try {
                await onSaveSingleGrade(change.studentId, change.componentId, change.score);
                successCount++;
            }
            catch (error) { console.error(`[Save All] Failed for St:${change.studentId}, Comp:${change.componentId}:`, error); saveErrors.push({ studentName: change.studentName, componentName: change.componentName, message: error instanceof Error ? error.message : String(error) }); }
        }
        console.log(`[Save All] Finished. Success: ${successCount}/${changesToSave.length}. Errors: ${saveErrors.length}`);

        if (Object.keys(studentsWithChanges).length > 0) {
            setOriginalLoadedGrades(prevOrig => { const newOrig = JSON.parse(JSON.stringify(prevOrig)); Object.keys(studentsWithChanges).forEach(sid => { newOrig[sid] = { ...(newOrig[sid] || {}), ...studentsWithChanges[sid] }; }); return newOrig; });
        }

        if (saveErrors.length === 0) { toast.success(`${successCount} perubahan nilai berhasil disimpan.`); setIsEditingAll(false); }
        else { toast.error(`Gagal menyimpan ${saveErrors.length} dari ${changesToSave.length} perubahan. Error pertama: ${saveErrors[0].message}`, { duration: 7000 }); }
        setIsSavingAll(false);
    }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade, setIsSavingAll, setIsEditingAll, setOriginalLoadedGrades]);

    // handleResetSelected (Tetap Sama)
    const handleResetSelected = useCallback(async () => {
        // ... (implementasi sama)
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) { toast.info("Pilih satu atau lebih siswa untuk mereset nilai."); return; }
        if (currentComponentsSafe.length === 0) { toast.warning("Tidak ada komponen penilaian."); return; }

        setIsResetting(true); let successCount = 0; let firstError: Error | null = null;
        const studentsToReset: { studentId: string, name: string }[] = selectedRows.map(row => ({ studentId: row.original.id, name: row.original.name }));
        const componentsToReset: AssessmentComponent[] = currentComponentsSafe.filter(c => c && c.id);
        const totalOperations = studentsToReset.length * componentsToReset.length;
        console.log(`[Reset Sequential] Starting reset for ${studentsToReset.length} students, ${componentsToReset.length} components. Total ops: ${totalOperations}`);
        const updatedGradesForState: GradesState = structuredClone(grades || {});

        for (const student of studentsToReset) {
            const studentId = student.studentId; if (!updatedGradesForState[studentId]) updatedGradesForState[studentId] = {};
            for (const component of componentsToReset) {
                const componentId = component.id; updatedGradesForState[studentId][componentId] = null;
                try {
                    await onSaveSingleGrade(studentId, componentId, null);
                    successCount++;
                }
                catch (error) { console.error(`[Reset Sequential] FAILED for St:${studentId}, Comp:${componentId}:`, error); if (!firstError) { firstError = error instanceof Error ? error : new Error(String(error)); } }
            }
        }
        console.log(`[Reset Sequential] Finished. Success: ${successCount}/${totalOperations}.`);

        setGrades(updatedGradesForState);
        if (!firstError && successCount === totalOperations) {
             setOriginalLoadedGrades(prevOrig => { const newOrig = JSON.parse(JSON.stringify(prevOrig)); studentsToReset.forEach(student => { const sid = student.studentId; if (!newOrig[sid]) newOrig[sid] = {}; componentsToReset.forEach(comp => { if(comp?.id) newOrig[sid][comp.id] = null; }); }); return newOrig; });
            toast.success(`${successCount} nilai berhasil direset.`);
        } else if (firstError) { toast.error(`Gagal mereset sebagian nilai: ${firstError.message}`, { duration: 5000 }); }
        else { toast.warning(`Reset nilai selesai dengan ${successCount} dari ${totalOperations} operasi sukses.`); }

        table.toggleAllPageRowsSelected(false);
        setEditingRowId(null); setIsResetting(false);
    }, [assessmentComponents, onSaveSingleGrade, grades, originalLoadedGrades, setIsResetting, setGrades, setOriginalLoadedGrades, setEditingRowId, table]);


    // --- Helper function getStickyOffset (Tetap Sama) ---
    const getStickyOffset = (tableInstance: TanstackTable<GradeTableRowData>, columnId: string): number => {
        // ... (implementasi sama)
        let offset = 0; const columnOrder = ['select', 'name', 'class']; const currentIndex = columnOrder.indexOf(columnId); if (currentIndex === -1) return 0;
        for (let i = 0; i < currentIndex; i++) { const column = tableInstance.getColumn(columnOrder[i]); if (column?.getIsVisible()) { offset += column.getSize(); } } return offset;
    };

    // --- Render Komponen ---

    // ============================================================
    // === PERIKSA JIKA TIDAK ADA KOMPONEN PENILAIAN ===
    // ============================================================
    if (!assessmentComponents || assessmentComponents.length === 0) {
        // Tiru struktur dasar 404 page untuk konsistensi (opsional, bisa disederhanakan)
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border rounded-md min-h-[450px] bg-card text-card-foreground shadow-sm"> {/* Mungkin perlu menambah min-h */}
                {/* === GANTI IKON DENGAN GAMBAR === */}
                {/* <div className="relative w-60 h-60 md:w-72 md:h-72 mb-6">
                    <NextImage
                        src="/images/tambah-komponen.png"
                        alt="Ilustrasi belum ada komponen penilaian"
                        width={250} // Example fixed width
                        height={250} // Example fixed height
                        className="mb-6" // Keep margin if needed
                    />
                </div> */}
                <h2 className="text-xl font-semibold mb-2">Belum Ada Komponen Penilaian</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Ibu/Bapak belum menambahkan komponen penilaian pada mata pelajaran ini. Buat komponen penilaian dulu lalu bisa lanjut masukkan nilai, ya!
                </p>
                <Button
                    onClick={() => {
                        // Pastikan subjectId tersedia
                        if (!subjectId) {
                            console.error("Subject ID tidak ditemukan untuk navigasi!");
                            toast.error("Gagal mengarahkan: ID Mata Pelajaran tidak ditemukan."); // Beri feedback jika ID tidak ada
                            return;
                        }
                        // Buat URL target menggunakan subjectId
                        const targetPath = `/guru/mata-pelajaran/detil/${subjectId}`;
                        console.log("Navigating to:", targetPath);
                        router.push(targetPath);
                    }}
                    // Tombol tidak perlu di-disable berdasarkan assessmentComponentPath lagi
                    // disabled={!assessmentComponentPath} <-- Hapus atau sesuaikan logika disable jika perlu
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {/* Ganti teks tombol jika lebih sesuai, misal "Lihat Detail Mapel" */}
                    Tambah Komponen Penilaian
                    {/* atau tetap "Buat Komponen Penilaian" */}
                </Button>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {/* Toolbar Tabel */}
            <GradeDataTableToolbar
                table={table}
                onResetSelected={handleResetSelected}
                isEditingAll={isEditingAll}
                isSavingAll={isSavingAll}
                onEditAll={handleEditAllTrigger}
                onSaveAll={handleSaveAllChanges}
                onCancelAll={handleCancelAllEdit}
                isRowEditing={!!editingRowId}
                nameFilterOptions={nameFilterOptions}
                classFilterOptions={classFilterOptions}
                finalScoreFilterOptions={finalScoreFilterOptions}
                isResetting={isResetting}
            />

            {/* Tabel Utama */}
            {/* Tetap pertahankan overflow-x-auto di wrapper ini */}
            <div className="overflow-x-auto border rounded-md">

                <Table className="w-full">
                    {/* Header Tabel */}
                     <TableHeader className="bg-white">
                         {/* TIDAK BOLEH ADA SPASI/ENTER DI SINI */}
                         {table.getHeaderGroups().map((headerGroup) => ( // Langsung map
                            <TableRow key={headerGroup.id} className='border-b'>
                                {headerGroup.headers.map((header) => {
                                    // Tidak perlu kalkulasi sticky offset lagi
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan}
                                            // --- 👇 HAPUS prop 'style' untuk sticky positioning ---
                                            style={{
                                                width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
                                                minWidth: header.getSize() !== 150 ? `${header.getSize()}px` : '100px',
                                            }}
                                            // --- 👇 HAPUS kelas background kondisional sticky ---
                                            className={cn(
                                                'px-2 py-2 text-xs h-auto whitespace-nowrap bg-inherit', // bg-inherit OK jika TableHeader solid
                                                header.id === 'finalScore' && 'text-center',
                                                header.id === 'actions' && 'text-center'
                                            )} >
                                            {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                   {/* Body Tabel */}
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                             table.getRowModel().rows.map((row) => {
                                 const isEditingThisRow = editingRowId === row.original.id;
                                return (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}
                                        // Beri background solid di sini jika perlu (misal bg-white)
                                        className={cn("hover:bg-muted/50 bg-white transition-colors", isEditingThisRow && 'outline outline-2 outline-primary outline-offset-[-1px]')} >
                                        {row.getVisibleCells().map((cell) => {
                                             // Tidak perlu kalkulasi sticky offset lagi
                                            return (
                                                <TableCell key={cell.id}
                                                    style={{
                                                        width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
                                                        minWidth: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : '100px',
                                                    }}
                                                    className={cn(
                                                        'px-2 py-1 h-11 align-middle text-xs',
                                                        cell.column.id === 'finalScore' && 'text-center font-medium',
                                                        cell.column.id === 'actions' && 'text-center'
                                                    )} >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length || 1} className="h-24 text-center">
                                    Tidak ada data siswa.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                    {/* ========================================== */}
                    {/* === TAMBAHKAN TABLE FOOTER (<tfoot>) === */}
                    {/* ========================================== */}
                    {statistics && ( // Hanya render footer jika statistik ada
                        <tfoot className="bg-muted/30 font-medium text-sm border-t">
                            {/* Kita definisikan 3 baris footer secara manual di sini */}
                            {/* Baris Rata-rata */}
                            <TableRow>
                                <TableCell className="px-3 py-1.5 text-left font-semibold" colSpan={2}> {/* Colspan 2 (select+name) */}
                                    Rata-rata
                                </TableCell>
                                {/* Kolom Kelas Dikosongkan */}
                                {table.getColumn('class')?.getIsVisible() && <TableCell></TableCell>}
                                {/* Kolom Komponen */}
                                {assessmentComponents.map(comp => (
                                     <TableCell key={`avg-foot-${comp.id}`} className="px-2 py-1.5 text-center">
                                         {formatNumberOrDash(statistics.avg[comp.id], 2)}
                                     </TableCell>
                                ))}
                                {/* Kolom Nilai Akhir */}
                                <TableCell className="px-3 py-1.5 text-center font-semibold">
                                     {formatNumberOrDash(statistics.avg['final'], 2)}
                                 </TableCell>
                                 {/* Kolom Aksi Dikosongkan */}
                                 <TableCell></TableCell>
                            </TableRow>
                             {/* Baris Minimum */}
                            <TableRow>
                                <TableCell className="px-3 py-1.5 text-left font-semibold" colSpan={2}>
                                    Minimum
                                </TableCell>
                                {table.getColumn('class')?.getIsVisible() && <TableCell></TableCell>}
                                {assessmentComponents.map(comp => (
                                     <TableCell key={`min-foot-${comp.id}`} className="px-2 py-1.5 text-center">
                                         {formatNumberOrDash(statistics.min[comp.id], 2)}
                                     </TableCell>
                                ))}
                                <TableCell className="px-3 py-1.5 text-center font-semibold">
                                     {formatNumberOrDash(statistics.min['final'], 2)}
                                 </TableCell>
                                 <TableCell></TableCell>
                            </TableRow>
                             {/* Baris Maksimum */}
                             <TableRow>
                                <TableCell className="px-3 py-1.5 text-left font-semibold" colSpan={2}>
                                    Maksimum
                                </TableCell>
                                {table.getColumn('class')?.getIsVisible() && <TableCell></TableCell>}
                                {assessmentComponents.map(comp => (
                                     <TableCell key={`max-foot-${comp.id}`} className="text-center">
                                         {formatNumberOrDash(statistics.max[comp.id], 2)}
                                     </TableCell>
                                ))}
                                <TableCell className="px-3 py-1.5 text-center font-semibold">
                                     {formatNumberOrDash(statistics.max['final'], 2)}
                                 </TableCell>
                                 <TableCell></TableCell>
                            </TableRow>
                        </tfoot>
                     )}
                     {/* ========================================== */}
                     {/* === AKHIR TABLE FOOTER (<tfoot>) === */}
                     {/* ========================================== */}
                </Table>
            </div>

            {/* Pagination Tabel */}
            <DataTablePagination table={table} />
        </div>
    );
}