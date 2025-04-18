// Lokasi: app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    useReactTable, Table as TanstackTable, Row, HeaderGroup, Header, Cell, // Impor tipe Tanstack
} from '@tanstack/react-table';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input'; // Pastikan Input diimpor
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GradeDataTableToolbar } from './grade-entry-table-toolbar'; // Sesuaikan path
import { DataTablePagination } from './pagination'; // Sesuaikan path
// Impor tipe dari skema Anda
import { Student, AssessmentComponent, GradesState, GradeTableRowData, FilterOption, GradeTableMeta } from './schema'; // Sesuaikan path
import { generateGradeColumns } from './grade-entry-columns'; // Sesuaikan path
import { RotateCcw, Loader2 } from 'lucide-react';
import { useCallback } from 'react'; // useCallback sudah diimpor oleh React by default

// --- Interface Prop (scoreType DIHAPUS) ---
interface GradeEntryDataTableProps {
    students: Student[] | undefined | null;
    assessmentComponents: AssessmentComponent[] | undefined | null;
    initialGrades: GradesState;
    // scoreType: 'pengetahuan' | 'keterampilan'; // <-- DIHAPUS
    subjectId: string;
    subjectName?: string;
    onSaveSingleGrade: ( // Signature onSaveSingleGrade DIUPDATE
        studentId: string,
        componentId: string,
        score: number | null
        // Hapus scoreType dari sini
    ) => Promise<void>;
    onDeleteComponent?: (componentId: string, componentName: string) => void;
    onUpdateComponent?: (updatedComponent: AssessmentComponent) => Promise<void>;
}

export function GradeEntryDataTable({
    students,
    assessmentComponents,
    initialGrades = {},
    // scoreType, // <-- DIHAPUS dari parameter
    subjectId,
    subjectName,
    onSaveSingleGrade, // Callback diterima tanpa scoreType
    onDeleteComponent = () => { console.warn("onDeleteComponent not provided"); },
    onUpdateComponent = async () => { console.warn("onUpdateComponent not provided"); },
}: GradeEntryDataTableProps) { // Hapus scoreType dari destructuring

    // State lokal (Sama)
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    const [originalLoadedGrades, setOriginalLoadedGrades] = React.useState<GradesState>({});
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [isSavingRow, setIsSavingRow] = React.useState<string | null>(null);
    const [isEditingAll, setIsEditingAll] = React.useState(false);
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ 'class': false, }); // Sembunyikan kelas by default
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editingHeaderId, setEditingHeaderId] = React.useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = React.useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = React.useState(false);
    const [isResetting, setIsResetting] = React.useState(false);

    // Effect sinkronisasi data dari props (Hapus referensi scoreType)
    React.useEffect(() => {
        console.log(`[DataTable] Syncing state with initialGrades prop.`); // Hapus scoreType dari log
        const initialDataFromProp = initialGrades || {};
        setGrades(initialDataFromProp);
        setOriginalLoadedGrades(JSON.parse(JSON.stringify(initialDataFromProp)));
        setEditingRowId(null); setRowSelection({}); setIsEditingAll(false); setEditingHeaderId(null);
    }, [initialGrades, students, assessmentComponents]); // Hapus scoreType dependency

    // --- Opsi Filter (Sama) ---
    const nameFilterOptions = React.useMemo<FilterOption[]>(() => {
        if (!Array.isArray(students)) return [];
        if (students.length === 0) return [];
        const uniqueNames = new Set(students.map(s => s.name).filter(Boolean));
        const sortedNames = Array.from(uniqueNames);
        try { sortedNames.sort((a, b) => a.localeCompare(b)); } catch (e) { console.error("Error sorting names:", e); return []; }
        return sortedNames.map(name => ({ label: name, value: name }));
    }, [students]);

    const classFilterOptions = React.useMemo<FilterOption[]>(() => {
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

    // --- Kalkulasi Data Tabel (Sama) ---
    const tableData = React.useMemo<GradeTableRowData[]>(() => {
        const currentStudents = Array.isArray(students) ? students : [];
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (currentStudents.length === 0) return []; // Return lebih awal jika tidak ada siswa

        const currentTotalWeight = currentComponents.reduce((sum, comp) => sum + (comp?.weight || 0), 0);

        return currentStudents.map((student: Student) => {
            if (!student?.id) return null;

            const studentGrades = grades[student.id] || {};
            let scoreTimesWeightSum = 0;
            let weightSumForStudent = 0;

            const componentScores: Record<string, number | null> = {};
            currentComponents.forEach((comp: AssessmentComponent) => {
                if (!comp?.id) return;
                const compId = comp.id;
                const compWeight = comp.weight || 0;
                const score = studentGrades[compId] ?? null;
                componentScores[compId] = score;
                const scoreForCalc = (typeof score === 'number' && !isNaN(score)) ? score : 0;
                if (compWeight > 0) {
                    scoreTimesWeightSum += (scoreForCalc * compWeight);
                    weightSumForStudent += compWeight;
                }
            });
            // Perhitungan nilai akhir mungkin perlu disesuaikan jika bobot tidak 100%
            // Untuk sekarang, asumsi bobot komponen yang relevan adalah pembaginya
            const calculatedFinalScore = weightSumForStudent > 0 ? (scoreTimesWeightSum / weightSumForStudent) : null;

            return {
                id: student.id, name: student.name, class: student.class,
                ...componentScores, finalScore: calculatedFinalScore
            };
        }).filter((item): item is GradeTableRowData => item !== null);
    }, [students, assessmentComponents, grades]);

    // --- Handlers Sederhana (Sama) ---
    const handleGradeChange = useCallback((studentId: string, componentId: string, value: string) => {
        const numericValue = value.trim() === '' ? null : Number(value);
        let finalValue = numericValue;
        if (numericValue !== null) {
            if (isNaN(numericValue)) { toast.warning("Masukkan angka atau kosongkan."); return; }
            if (numericValue < 0 || numericValue > 100) { toast.warning("Nilai harus antara 0 dan 100."); finalValue = Math.max(0, Math.min(100, numericValue)); }
        }
        setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: finalValue } }));
    }, []);

    const handleCancelRow = useCallback((rowId: string) => {
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
        if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); }
        setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId);
    }, [editingRowId, handleCancelRow]);

    const startHeaderEdit = useCallback((component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const handleDeleteComponent = useCallback((id: string, name: string) => { if(onDeleteComponent) onDeleteComponent(id, name); }, [onDeleteComponent]);
    const cancelHeaderEdit = useCallback(() => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = useCallback((field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = useCallback(async () => {
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (!editingHeaderId) return; const comp = currentComponentsSafe.find(c => c.id === editingHeaderId); if (!comp) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib"); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot harus > 0."); return; } if (name.trim() === comp.name && weightValue === comp.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { if(onUpdateComponent) await onUpdateComponent({ ...comp, name: name.trim(), weight: weightValue }); toast.success(`Komponen diperbarui.`); cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update header: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); }
    }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);

    const handleEditAllTrigger = useCallback(() => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); toast.info("Mode Edit Semua Aktif"); }, []);
    const handleCancelAllEdit = useCallback(() => { setGrades(originalLoadedGrades); setIsEditingAll(false); setEditingRowId(null); toast.info("Mode Edit Semua dibatalkan."); }, [originalLoadedGrades]);

    // --- Definisi Kolom Tabel (Hapus scoreType dari pemanggilan generateGradeColumns) ---
    const columns = React.useMemo<ColumnDef<GradeTableRowData>[]>(() => {
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        // Panggil generateGradeColumns dengan 11 argumen (tanpa scoreType)
        // !!! PASTIKAN ANDA JUGA MENGEDIT FILE grade-entry-columns.ts !!!
        return generateGradeColumns(
                currentComponentsSafe,
                grades, // Kirim state grades saat ini
                startHeaderEdit,
                handleDeleteComponent,
                editingHeaderId,
                editingHeaderValues,
                handleHeaderEditChange,
                saveHeaderEdit,
                cancelHeaderEdit,
                isHeaderEditingLoading,
                !!editingRowId || isEditingAll
                // Hapus scoreType dari sini
        );
    }, [ assessmentComponents, grades, startHeaderEdit, handleDeleteComponent, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, editingRowId, isEditingAll ]); // Hapus scoreType dependency

    // --- Deklarasi Table (Sama) ---
    const table = useReactTable<GradeTableRowData>({
        data: tableData,
        columns,
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
        // Pass meta data ke kolom/sel
        meta: {
            grades, // Pass state nilai saat ini
            editingRowId,
            isEditingAll,
            isSavingRow,
            isSavingAll,
            handleGradeChange,
            handleEditRowTrigger,
            handleCancelRow,
            // Pastikan signature handleSaveRow di meta cocok
            handleSaveRow: (rowId: string) => handleSaveRow(rowId),
        } as GradeTableMeta // Pastikan tipe GradeTableMeta sesuai
    });
    // ------------------------------------------

    // --- Handlers Kompleks (Hapus referensi scoreType) ---

    // handleSaveRow (Sudah Disesuaikan)
    const handleSaveRow = useCallback(async (rowId: string) => {
        const currentStudents = Array.isArray(students) ? students : [];
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (currentStudents.length === 0 || currentComponents.length === 0) { toast.error("Data siswa atau komponen belum siap."); return; }
        setIsSavingRow(rowId);
        const promises: Promise<void>[] = []; let changesCount = 0; let validationError = false;
        const student = currentStudents.find(s => s.id === rowId);
        if (!student) { toast.error("Siswa tidak ditemukan."); setIsSavingRow(null); return; }
        const studentCurrentGrades = grades[rowId] || {};
        const studentInitialGrades = originalLoadedGrades[rowId] || {};

        currentComponents.forEach((c: AssessmentComponent) => {
            if (!c?.id) return;
            const componentId = c.id;
            const currentGrade = studentCurrentGrades[componentId] ?? null;
            const initialGrade = studentInitialGrades[componentId] ?? null;
            const hasChanged = JSON.stringify(currentGrade) !== JSON.stringify(initialGrade);
            if (hasChanged) {
                if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) { toast.error(`Nilai ${c.name} (${student.name}) tidak valid (0-100 atau kosong).`); validationError = true; return; }
                changesCount++;
                console.log(`[SaveRow] Change detected: St:${rowId}, Comp:${componentId}, Score:${currentGrade}`); // Hapus scoreType dari log
                // Panggil onSaveSingleGrade tanpa scoreType
                promises.push(onSaveSingleGrade(rowId, componentId, currentGrade));
            }
        });

        if (validationError) { setIsSavingRow(null); return; }
        if (changesCount === 0) { toast.info(`Tidak ada perubahan nilai untuk ${student.name}.`); setIsSavingRow(null); setEditingRowId(null); return; } // Hapus scoreType dari pesan

        try {
            await Promise.all(promises);
            toast.success(`Nilai ${student.name} berhasil disimpan.`); // Hapus scoreType dari pesan
            // Update originalLoadedGrades (sama)
            setOriginalLoadedGrades(prevOrig => { const newOrig = JSON.parse(JSON.stringify(prevOrig)); newOrig[rowId] = { ...(newOrig[rowId] || {}), ...studentCurrentGrades }; return newOrig; });
            setEditingRowId(null);
        } catch (error) { console.error(`[SaveRow] Error saving for ${rowId}:`, error); /* Toast error sudah di handle di page.tsx */ }
        finally { setIsSavingRow(null); }
    }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade]); // Hapus scoreType dependency

    // handleSaveAllChanges (Sudah Disesuaikan)
    const handleSaveAllChanges = useCallback(async () => {
        const currentStudents = Array.isArray(students) ? students : [];
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (currentStudents.length === 0 || currentComponents.length === 0) { toast.error("Data siswa atau komponen belum siap."); return; }
        setIsSavingAll(true);
        const studentsWithChanges: Record<string, GradesState[string]> = {};
        const changesToSave: { studentId: string; componentId: string; score: number | null; studentName: string; componentName: string }[] = [];
        let validationError = false; let saveErrors: { studentName: string; componentName: string; message: string }[] = [];

        // Loop validasi (sama)
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
        if (changesToSave.length === 0) { toast.info(`Tidak ada perubahan nilai untuk disimpan.`); setIsSavingAll(false); setIsEditingAll(false); return; } // Hapus scoreType dari pesan

        console.log(`[Save All] Found ${changesToSave.length} changes. Starting sequential save...`); // Hapus scoreType dari log
        let successCount = 0;
        // Loop penyimpanan
        for (const change of changesToSave) {
            try {
                // Panggil onSaveSingleGrade tanpa scoreType
                await onSaveSingleGrade(change.studentId, change.componentId, change.score);
                successCount++;
            }
            catch (error) { console.error(`[Save All] Failed for St:${change.studentId}, Comp:${change.componentId}:`, error); saveErrors.push({ studentName: change.studentName, componentName: change.componentName, message: error instanceof Error ? error.message : String(error) }); } // Hapus scoreType dari log
        }
        console.log(`[Save All] Finished. Success: ${successCount}/${changesToSave.length}. Errors: ${saveErrors.length}`); // Hapus scoreType dari log

        // Update originalLoadedGrades (sama)
        if (Object.keys(studentsWithChanges).length > 0) {
            setOriginalLoadedGrades(prevOrig => { const newOrig = JSON.parse(JSON.stringify(prevOrig)); Object.keys(studentsWithChanges).forEach(sid => { newOrig[sid] = { ...(newOrig[sid] || {}), ...studentsWithChanges[sid] }; }); return newOrig; });
        }

        // Tampilkan hasil (hapus scoreType dari pesan)
        if (saveErrors.length === 0) { toast.success(`${successCount} perubahan nilai berhasil disimpan.`); setIsEditingAll(false); }
        else { toast.error(`Gagal menyimpan ${saveErrors.length} dari ${changesToSave.length} perubahan. Error pertama: ${saveErrors[0].message}`, { duration: 7000 }); }
        setIsSavingAll(false);
    }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade, setIsSavingAll, setIsEditingAll, setOriginalLoadedGrades]); // Hapus scoreType dependency

    // handleResetSelected (Sudah Disesuaikan)
    const handleResetSelected = useCallback(async () => {
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) { toast.info("Pilih satu atau lebih siswa untuk mereset nilai."); return; }
        if (currentComponentsSafe.length === 0) { toast.warning("Tidak ada komponen penilaian."); return; }

        setIsResetting(true); let successCount = 0; let firstError: Error | null = null;
        const studentsToReset: { studentId: string, name: string }[] = selectedRows.map(row => ({ studentId: row.original.id, name: row.original.name }));
        const componentsToReset: AssessmentComponent[] = currentComponentsSafe.filter(c => c && c.id);
        const totalOperations = studentsToReset.length * componentsToReset.length;
        console.log(`[Reset Sequential] Starting reset for ${studentsToReset.length} students, ${componentsToReset.length} components. Total ops: ${totalOperations}`); // Hapus scoreType dari log
        const updatedGradesForState: GradesState = structuredClone(grades || {});

        // Loop reset
        for (const student of studentsToReset) {
            const studentId = student.studentId; if (!updatedGradesForState[studentId]) updatedGradesForState[studentId] = {};
            for (const component of componentsToReset) {
                const componentId = component.id; updatedGradesForState[studentId][componentId] = null;
                try {
                    // Panggil onSaveSingleGrade tanpa scoreType
                    await onSaveSingleGrade(studentId, componentId, null);
                    successCount++;
                }
                catch (error) { console.error(`[Reset Sequential] FAILED for St:${studentId}, Comp:${componentId}:`, error); if (!firstError) { firstError = error instanceof Error ? error : new Error(String(error)); } } // Hapus scoreType dari log
            }
        }
        console.log(`[Reset Sequential] Finished. Success: ${successCount}/${totalOperations}.`); // Hapus scoreType dari log

        setGrades(updatedGradesForState);
        // Update originalLoadedGrades (sama)
        if (!firstError && successCount === totalOperations) {
             setOriginalLoadedGrades(prevOrig => { const newOrig = JSON.parse(JSON.stringify(prevOrig)); studentsToReset.forEach(student => { const sid = student.studentId; if (!newOrig[sid]) newOrig[sid] = {}; componentsToReset.forEach(comp => { if(comp?.id) newOrig[sid][comp.id] = null; }); }); return newOrig; });
            toast.success(`${successCount} nilai berhasil direset.`); // Hapus scoreType dari pesan
        } else if (firstError) { toast.error(`Gagal mereset sebagian nilai: ${firstError.message}`, { duration: 5000 }); } // Hapus scoreType dari pesan
        else { toast.warning(`Reset nilai selesai dengan ${successCount} dari ${totalOperations} operasi sukses.`); } // Hapus scoreType dari pesan

        table.toggleAllPageRowsSelected(false);
        setEditingRowId(null); setIsResetting(false);
    }, [assessmentComponents, onSaveSingleGrade, grades, originalLoadedGrades, setIsResetting, setGrades, setOriginalLoadedGrades, setEditingRowId, table]); // Hapus scoreType dependency, tambah table dependency

    // --- Helper function getStickyOffset (Tetap Sama) ---
    const getStickyOffset = (tableInstance: TanstackTable<GradeTableRowData>, columnId: string): number => {
        let offset = 0; const columnOrder = ['select', 'name', 'class']; const currentIndex = columnOrder.indexOf(columnId); if (currentIndex === -1) return 0;
        for (let i = 0; i < currentIndex; i++) { const column = tableInstance.getColumn(columnOrder[i]); if (column?.getIsVisible()) { offset += column.getSize(); } } return offset;
    };

    // --- Render Komponen ---
    return (
        <div className="space-y-4">
            {/* Toolbar Tabel (Tetap Sama) */}
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

            {/* Tabel Utama (Tetap Sama) */}
            <div className="overflow-x-auto relative border rounded-md">
                <Table>
                    {/* Header Tabel (Tetap Sama) */}
                     <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className='border-b'>
                                {headerGroup.headers.map((header) => {
                                    const isStickyLeft = ['select', 'name', 'class'].includes(header.id);
                                    const isStickyRight = ['finalScore', 'actions'].includes(header.id);
                                    const stickyLeftOffset = isStickyLeft ? getStickyOffset(table, header.id) : undefined;
                                    let stickyRightOffset = 0;
                                    if (header.id === 'actions') stickyRightOffset = 0;
                                    else if (header.id === 'finalScore') { const actionsCol = table.getColumn('actions'); stickyRightOffset = actionsCol?.getIsVisible() ? actionsCol.getSize() : 0; }
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan}
                                            style={{
                                                width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
                                                minWidth: header.getSize() !== 150 ? `${header.getSize()}px` : '100px',
                                                left: isStickyLeft ? `${stickyLeftOffset}px` : undefined,
                                                right: isStickyRight ? `${stickyRightOffset}px` : undefined,
                                                position: (isStickyLeft || isStickyRight) ? 'sticky' : undefined,
                                                zIndex: (isStickyLeft || isStickyRight) ? 11 : undefined,
                                            }}
                                            className={cn('px-2 py-2 text-xs h-auto whitespace-nowrap bg-inherit', header.id === 'finalScore' && 'text-center', header.id === 'actions' && 'text-center')} >
                                            {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                   {/* Body Tabel (Tetap Sama) */}
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const isEditingThisRow = editingRowId === row.original.id;
                                return (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}
                                        className={cn("hover:bg-muted/50 transition-colors", isEditingThisRow && 'outline outline-2 outline-primary outline-offset-[-1px]')} >
                                        {row.getVisibleCells().map((cell) => {
                                            const isStickyLeft = ['select', 'name', 'class'].includes(cell.column.id);
                                            const isStickyRight = ['finalScore', 'actions'].includes(cell.column.id);
                                            const stickyLeftOffset = isStickyLeft ? getStickyOffset(table, cell.column.id) : undefined;
                                            let stickyRightOffset = 0;
                                            if (cell.column.id === 'actions') stickyRightOffset = 0;
                                            else if (cell.column.id === 'finalScore') { const actionsCol = table.getColumn('actions'); stickyRightOffset = actionsCol?.getIsVisible() ? actionsCol.getSize() : 0; }
                                            return (
                                                <TableCell key={cell.id}
                                                    style={{
                                                        width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
                                                        minWidth: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : '100px',
                                                        left: isStickyLeft ? `${stickyLeftOffset}px` : undefined,
                                                        right: isStickyRight ? `${stickyRightOffset}px` : undefined,
                                                        position: (isStickyLeft || isStickyRight) ? 'sticky' : undefined,
                                                        zIndex: (isStickyLeft || isStickyRight) ? 10 : undefined,
                                                    }}
                                                    className={cn('px-2 py-1 h-11 align-middle text-xs', cell.column.id === 'finalScore' && 'text-center font-medium', cell.column.id === 'actions' && 'text-center')} >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Tidak ada data siswa.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Tabel (Tetap Sama) */}
            <DataTablePagination table={table} />
        </div>
    );
}