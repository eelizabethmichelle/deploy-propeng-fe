// Lokasi: app/guru/input-nilai/[subjectId]/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Loader2, Scale, Download, Sigma, GalleryHorizontal, GalleryVertical,
    Save, Trash2, Info, Pencil, X // Trash2 tidak terpakai tapi impor bisa dibiarkan
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable, { UserOptions, CellDef, RowInput, HAlignType, FontStyle } from 'jspdf-autotable';
import { GradeEntryDataTable } from '@/components/ui/grade-entry/grade-entry-data-table'; // Pastikan path ini benar

// --- Tipe Data ---
interface AssessmentComponent {
    id: string;
    name: string;
    weight: number;
    type: 'Pengetahuan' | 'Keterampilan';
}
interface Student {
    id: string;
    name: string;
    class: string;
}
type GradesState = Record<string, Record<string, number | null>>;
interface GradeData {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    subjectName: string;
    initialGrades: GradesState;
    academicYear: string;
    teacherName: string;
    teacherNisp: string;
}
interface CapaianData {
    pengetahuan: { deskripsi: string } | null;
    keterampilan: { deskripsi: string } | null;
}
// --- Akhir Tipe Data ---

type PdfOrientation = 'p' | 'l';
type PdfPaperSize = 'a4' | 'letter' | 'legal';


export default function InputNilaiPage() {
    // --- State ---
    const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
    const [paramsError, setParamsError] = useState<string | null>(null);
    const [gradeData, setGradeData] = useState<GradeData | null>(null);
    const [isLoadingGrade, setIsLoadingGrade] = useState(true);
    const [errorGrade, setErrorGrade] = useState<string | null>(null);
    const [capaianData, setCapaianData] = useState<CapaianData | null>(null);
    const [initialCapaianData, setInitialCapaianData] = useState<CapaianData | null>(null);
    const [isCapaianLoading, setIsCapaianLoading] = useState(true);
    const [capaianError, setCapaianError] = useState<string | null>(null);
    const [isSavingCapaian, setIsSavingCapaian] = useState(false);
    const [editedPengetahuanDesc, setEditedPengetahuanDesc] = useState<string>('');
    const [editedKeterampilanDesc, setEditedKeterampilanDesc] = useState<string>('');
    const [isEditingPengetahuan, setIsEditingPengetahuan] = useState(false);
    const [isEditingKeterampilan, setIsEditingKeterampilan] = useState(false);
    const [isPdfOptionsDialogOpen, setIsPdfOptionsDialogOpen] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('p');
    const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>('a4');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // --- Ekstraksi subjectId ---
    useEffect(() => {
        const pathname = window.location.pathname;
        if (pathname) {
            const segments = pathname.split('/');
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && /^\d+$/.test(lastSegment)) {
                setSubjectId(lastSegment); setParamsError(null);
            } else {
                setParamsError("ID Mata Pelajaran tidak valid di URL."); setSubjectId(undefined);
                setIsLoadingGrade(false); setIsCapaianLoading(false);
            }
        } else {
            setParamsError("Tidak bisa membaca path URL."); setSubjectId(undefined);
            setIsLoadingGrade(false); setIsCapaianLoading(false);
        }
    }, []);

    // --- Fetch Data Awal (Grade Data) ---
    const fetchInitialData = useCallback(async () => {
        if (!subjectId) return;
        setIsLoadingGrade(true); setErrorGrade(null);
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Token otentikasi tidak ditemukan.");
            const apiUrl = `/api/nilai/gradedata?subjectId=${subjectId}`; // Panggil Next API Route grade
            const response = await fetch(apiUrl, { headers: { "Authorization": `Bearer ${accessToken}` }, cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || `Gagal memuat data nilai (${response.status})`);
            if (data && Array.isArray(data.students) && Array.isArray(data.assessmentComponents) && typeof data.initialGrades === 'object') {
                 data.students.sort((a: Student, b: Student) => a.name.localeCompare(b.name));
                 data.assessmentComponents = data.assessmentComponents.map((comp: any) => ({ ...comp, type: comp.type === 'pengetahuan' ? 'Pengetahuan' : comp.type === 'keterampilan' ? 'Keterampilan' : comp.type }));
                 setGradeData(data as GradeData);
            } else {
                 throw new Error("Format data nilai dari server tidak valid.");
            }
        } catch (err) {
            setErrorGrade(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data nilai"); setGradeData(null);
        } finally {
            setIsLoadingGrade(false);
        }
    }, [subjectId]);

    // --- Fetch Data Capaian Kompetensi ---
    const fetchCapaianData = useCallback(async () => {
        if (!subjectId) return;
        setIsCapaianLoading(true); setCapaianError(null);
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Token otentikasi tidak ditemukan.");
            const apiUrl = `/api/nilai/capaian?subjectId=${subjectId}`; // Panggil Next API Route capaian (pakai search params)
            const response = await fetch(apiUrl, { headers: { "Authorization": `Bearer ${accessToken}` }, cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || `Gagal memuat data capaian (${response.status})`);
            if (data && (data.pengetahuan === null || typeof data.pengetahuan?.deskripsi === 'string') && (data.keterampilan === null || typeof data.keterampilan?.deskripsi === 'string')) {
                setCapaianData(data); setInitialCapaianData(structuredClone(data));
                setEditedPengetahuanDesc(data.pengetahuan?.deskripsi || ''); setEditedKeterampilanDesc(data.keterampilan?.deskripsi || '');
            } else {
                 throw new Error("Format data capaian dari server tidak valid.");
            }
        } catch (err) {
            setCapaianError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data capaian");
            setCapaianData(null); setInitialCapaianData(null); setEditedPengetahuanDesc(''); setEditedKeterampilanDesc('');
        } finally {
            setIsCapaianLoading(false);
        }
     }, [subjectId]);

    // --- useEffect untuk memanggil kedua fetch ---
    useEffect(() => { if (subjectId) { fetchInitialData(); fetchCapaianData(); } }, [subjectId, fetchInitialData, fetchCapaianData]);

    // --- Fungsi Simpan Nilai (Grade) ---
    const handleSaveSingleGradeClient = useCallback(async (studentId: string, componentId: string, score: number | null): Promise<void> => {
        // ... (Logika simpan nilai TETAP SAMA) ...
        if (!subjectId) { toast.error("Gagal menyimpan: ID Mata Pelajaran tidak ditemukan."); throw new Error("ID Mata Pelajaran tidak valid."); }
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) { toast.error("Gagal menyimpan: Sesi berakhir."); throw new Error("Token otorisasi tidak ditemukan."); }
            const apiUrl = `/api/nilai/gradedata?subjectId=${subjectId}`; const body = { studentId, componentId, score };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(body) });
            const result = await response.json();
            if (!response.ok) { toast.error(`Gagal menyimpan nilai: ${result.message || `Error (${response.status})`}`); throw new Error(result.message || `Gagal menyimpan nilai (${response.status})`); }
            setGradeData(prevData => { if (!prevData) return null; const updatedGrades = structuredClone(prevData.initialGrades); if (!updatedGrades[studentId]) { updatedGrades[studentId] = {}; } updatedGrades[studentId][componentId] = score; return { ...prevData, initialGrades: updatedGrades }; });
        } catch (err) { if (!(err instanceof Error && err.message.startsWith("Gagal menyimpan nilai"))) { toast.error(`Gagal menyimpan nilai: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`); } throw err; }
    }, [subjectId, gradeData]);

    // --- Fungsi Simpan Capaian Kompetensi (Backend Call) ---
    const handleSaveCapaian = useCallback(async (payload: { pengetahuan?: string; keterampilan?: string }) => { // Payload tidak lagi null
        if (!subjectId) { toast.error("Gagal menyimpan: ID Mata Pelajaran tidak ditemukan."); return false; }
        const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => typeof v === 'string')); // Hanya kirim string
        if (Object.keys(cleanPayload).length === 0) { toast.info("Tidak ada deskripsi valid untuk disimpan."); return false; }

        console.log(`[page.tsx saveCapaian] Sending payload:`, cleanPayload);
        setIsSavingCapaian(true); let success = false;
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Token otentikasi tidak ditemukan.");
            const apiUrl = `/api/nilai/capaian?subjectId=${subjectId}`; // Pakai search params
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(cleanPayload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result?.message || `Gagal menyimpan capaian (${response.status})`);
            setCapaianData(result); setInitialCapaianData(structuredClone(result));
            setEditedPengetahuanDesc(result.pengetahuan?.deskripsi || ''); setEditedKeterampilanDesc(result.keterampilan?.deskripsi || '');
            toast.success("Deskripsi Capaian Kompetensi berhasil disimpan."); success = true;
        } catch (err) {
            toast.error(`Gagal menyimpan capaian: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`); success = false;
        } finally {
            setIsSavingCapaian(false);
        }
        return success;
    }, [subjectId]);

    // --- Handler untuk tombol Simpan per tipe ---
     const onSaveChangesClick = async (type: 'pengetahuan' | 'keterampilan') => {
        let payload: { pengetahuan?: string; keterampilan?: string } = {};
        let success = false;
        if (type === 'pengetahuan') {
            if (editedPengetahuanDesc !== (initialCapaianData?.pengetahuan?.deskripsi || '')) {
                 payload = { pengetahuan: editedPengetahuanDesc };
                 success = await handleSaveCapaian(payload);
                 if (success) setIsEditingPengetahuan(false);
            } else {
                 toast.info("Tidak ada perubahan pada deskripsi Pengetahuan."); setIsEditingPengetahuan(false);
            }
        } else {
             if (editedKeterampilanDesc !== (initialCapaianData?.keterampilan?.deskripsi || '')) {
                 payload = { keterampilan: editedKeterampilanDesc };
                 success = await handleSaveCapaian(payload);
                 if (success) setIsEditingKeterampilan(false);
            } else {
                 toast.info("Tidak ada perubahan pada deskripsi Keterampilan."); setIsEditingKeterampilan(false);
            }
        }
    };

    // --- Handler untuk tombol Batal Edit ---
    const onCancelEditClick = (type: 'pengetahuan' | 'keterampilan') => {
        if (type === 'pengetahuan') {
            setEditedPengetahuanDesc(initialCapaianData?.pengetahuan?.deskripsi || '');
            setIsEditingPengetahuan(false);
        } else {
            setEditedKeterampilanDesc(initialCapaianData?.keterampilan?.deskripsi || '');
            setIsEditingKeterampilan(false);
        }
    };

    // --- Handler Hapus Dihapus ---
    // const onDeleteCapaianClick = ...

    // --- Kalkulasi Memoized (Grade) ---
    // ... (Kode useMemo componentsPengetahuan, componentsKeterampilan, bobot, rata-rata TETAP SAMA) ...
    const componentsPengetahuan = useMemo(() => gradeData?.assessmentComponents.filter(c => c.type === 'Pengetahuan') ?? [], [gradeData?.assessmentComponents]);
    const componentsKeterampilan = useMemo(() => gradeData?.assessmentComponents.filter(c => c.type === 'Keterampilan') ?? [], [gradeData?.assessmentComponents]);
    const totalWeightPengetahuan = useMemo(() => componentsPengetahuan.reduce((sum, comp) => sum + (Number(comp?.weight) || 0), 0), [componentsPengetahuan]);
    const totalWeightKeterampilan = useMemo(() => componentsKeterampilan.reduce((sum, comp) => sum + (Number(comp?.weight) || 0), 0), [componentsKeterampilan]);
    const calculateStudentFinalScorePdfMethod = useCallback((studentId: string, gradesSource: GradesState | undefined, assessmentComponentsForType: AssessmentComponent[]): number | null => {
        if (!gradesSource || assessmentComponentsForType.length === 0) return null; const studentGrades = gradesSource[studentId]; const totalPossibleWeight = assessmentComponentsForType.reduce((sum, comp) => sum + (comp?.weight || 0), 0); if (!studentGrades && assessmentComponentsForType.length > 0) return 0.0; if (!studentGrades) return null;
// Di dalam calculateStudentFinalScorePdfMethod

let weightedScoreSum = 0;
let anyComponentProcessed = false; // Untuk handle jika tidak ada nilai sama sekali

assessmentComponentsForType.forEach(comp => {
    if (!comp?.id) return;
    const score = studentGrades[comp.id]; // Jangan default ke 0 dulu
    const compWeight = comp.weight || 0;

    // Hanya proses jika nilai adalah angka valid dan bobot > 0
    if (typeof score === 'number' && !isNaN(score) && compWeight > 0) {
        // === PERUBAHAN UTAMA: Hitung kontribusi ===
        // Asumsi compWeight adalah 0-100 (misal 30 untuk 30%)
        weightedScoreSum += (score * (compWeight / 100));
        anyComponentProcessed = true;
    }
});

// Kembalikan jumlah kontribusi poin, atau null/0 jika tidak ada data?
// Di sini kita kembalikan 0 jika ada komponen tapi tidak ada nilai,
// dan null jika tidak ada komponen sama sekali. Sesuaikan jika perlu.
if (!anyComponentProcessed && assessmentComponentsForType.length > 0) {
    return 0.0;
}
if (!anyComponentProcessed && assessmentComponentsForType.length === 0) {
    return null;
}
return weightedScoreSum;
}, []);
    const overallAveragePengetahuan = useMemo(() => { if (!gradeData || !gradeData.students.length || !componentsPengetahuan.length) return null; const { students, initialGrades } = gradeData; const finalScoresList: number[] = students.map(student => calculateStudentFinalScorePdfMethod(student.id, initialGrades, componentsPengetahuan)).filter((s): s is number => s !== null); return finalScoresList.length > 0 ? (finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length) : null; }, [gradeData, componentsPengetahuan, calculateStudentFinalScorePdfMethod]);
    const overallAverageKeterampilan = useMemo(() => { if (!gradeData || !gradeData.students.length || !componentsKeterampilan.length) return null; const { students, initialGrades } = gradeData; const finalScoresList: number[] = students.map(student => calculateStudentFinalScorePdfMethod(student.id, initialGrades, componentsKeterampilan)).filter((s): s is number => s !== null); return finalScoresList.length > 0 ? (finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length) : null; }, [gradeData, componentsKeterampilan, calculateStudentFinalScorePdfMethod]);



    // --- Fungsi PDF ---
    const formatNumberOrDash = (value: number | null | undefined, decimals: number = 1): string => { if (typeof value === 'number' && !isNaN(value)) { return value.toFixed(decimals); } return '-'; };
    const generatePdfDocument = useCallback((orientation: PdfOrientation, paperSize: PdfPaperSize): jsPDF | null => {
        if (!gradeData) { toast.error("Data nilai belum tersedia untuk membuat PDF."); return null; }
        const componentsP = componentsPengetahuan; // Gunakan variabel memoized
        const componentsK = componentsKeterampilan; // Gunakan variabel memoized
        const { students, initialGrades, subjectName, academicYear, teacherName, teacherNisp } = gradeData;
        const schoolName = "SMA Kristen Anglo"; const location = "Bekasi";
        const signDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: paperSize });
        const pageMargin = 14; const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = pageMargin;

        // --- Start PDF Header ---
        doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Daftar Nilai Siswa", pageWidth / 2, currentY, { align: 'center' }); currentY += 8;
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); const infoLineHeight = 5;
        const infoX1 = pageMargin; const infoX2 = pageMargin + 60;
        doc.text(`Nama Sekolah`, infoX1, currentY); doc.text(`: ${schoolName}`, infoX2, currentY); currentY += infoLineHeight;
        doc.text(`Mata Pelajaran`, infoX1, currentY); doc.text(`: ${subjectName}`, infoX2, currentY); currentY += infoLineHeight;
        doc.text(`Tahun Ajaran`, infoX1, currentY); doc.text(`: ${academicYear}`, infoX2, currentY); currentY += infoLineHeight;
        const pDesc = capaianData?.pengetahuan?.deskripsi;
        const kDesc = capaianData?.keterampilan?.deskripsi;
        doc.text(`Capaian Kompetensi Pengetahuan`, infoX1, currentY); doc.text(`: ${pDesc}`, infoX2, currentY); currentY += infoLineHeight;
        doc.text(`Capaian Kompetensi Keterampilan`, infoX1, currentY); doc.text(`: ${kDesc}`, infoX2, currentY); currentY += infoLineHeight;
        const uniqueClasses = Array.from(new Set(students.map(s => s.class))).filter(Boolean).join(', ');
        doc.text(`Kelas`, infoX1, currentY); doc.text(`: ${uniqueClasses || '-'}`, infoX2, currentY); currentY += 6;
        
        currentY += 6; // Spasi sebelum tabel nilai
        // --- Akhir Deskripsi Capaian PDF ---

        const drawTableTitle = (title: string, yPos: number) => { doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(title, pageWidth / 2, yPos, { align: 'center' }); return yPos + 6; };
        const generateSingleTable = (
            tableTitle: string, gradesData: GradesState, componentsForTable: AssessmentComponent[], startY: number, finalScoreLabel: string
        ): number => {
            if (componentsForTable.length === 0) { console.log(`[PDF] Skipping table "${tableTitle}" no components.`); doc.setFontSize(10).setFont("helvetica", "italic").text(`Tidak ada komponen ${tableTitle.toLowerCase()}.`, pageMargin, startY + 5); return startY + 10; }
            let tableY = drawTableTitle(tableTitle, startY);
            const componentScores: Record<string, number[]> = {}; componentsForTable.forEach(comp => componentScores[comp.id] = []);
            const finalScoresList: number[] = []; const totalWeightForType = componentsForTable.reduce((sum, c) => sum + (c.weight || 0), 0);
            const body: RowInput[] = students.map((student) => {
                let scoreTimesWeightSum = 0; const studentRow: RowInput = [ student.name, { content: student.class, styles: { halign: 'center' as HAlignType } } ];
                componentsForTable.forEach(comp => {
                    const rawScore = gradesData[student.id]?.[comp.id] ?? null; let displayScore = '-'; let scoreForCalc = 0;
                    if (typeof rawScore === 'number' && !isNaN(rawScore)) { displayScore = rawScore.toFixed(0); scoreForCalc = rawScore; componentScores[comp.id].push(rawScore); }
                    const compWeight = comp.weight || 0; if (compWeight > 0) { scoreTimesWeightSum += (scoreForCalc * compWeight); }
                    studentRow.push({ content: displayScore, styles: { halign: 'center' as HAlignType } });
                });
                const finalScore = calculateStudentFinalScorePdfMethod(student.id, gradesData, componentsForTable);
                if (finalScore !== null) finalScoresList.push(finalScore);
                studentRow.push({ content: formatNumberOrDash(finalScore, 1), styles: { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle } });
                return studentRow;
            });
            const stats = { avg: {} as Record<string, number | null>, min: {} as Record<string, number | null>, max: {} as Record<string, number | null> };
            componentsForTable.forEach(comp => { const scores = componentScores[comp.id]; stats.avg[comp.id] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null; stats.min[comp.id] = scores.length > 0 ? Math.min(...scores) : null; stats.max[comp.id] = scores.length > 0 ? Math.max(...scores) : null; });
            stats.avg['final'] = finalScoresList.length > 0 ? finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length : null;
            stats.min['final'] = finalScoresList.length > 0 ? Math.min(...finalScoresList) : null;
            stats.max['final'] = finalScoresList.length > 0 ? Math.max(...finalScoresList) : null;
            const head: CellDef[][] = [[ { content: 'Nama Siswa', styles: { fontStyle: 'bold' as FontStyle, halign: 'left' as HAlignType } }, { content: 'Kelas', styles: { fontStyle: 'bold' as FontStyle, halign: 'center' as HAlignType } }, ...componentsForTable.map(comp => ({ content: `${comp.name}\n(${comp.weight || 0}%)`, styles: { halign: 'center' as HAlignType, fontStyle: 'bold' as FontStyle, fontSize: 8 } })), { content: finalScoreLabel, styles: { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle } } ]];
            const footerRowStyles = { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle }; const footerLabelStyles = { halign: 'left' as HAlignType, fontStyle: 'bold' as FontStyle };
            const foot: RowInput[] = [ [{ content: 'Rata-rata', colSpan: 2, styles: footerLabelStyles }, ...componentsForTable.map(comp => ({ content: formatNumberOrDash(stats.avg[comp.id], 1), styles: footerRowStyles })), { content: formatNumberOrDash(stats.avg['final'], 1), styles: footerRowStyles }], [{ content: 'Minimum', colSpan: 2, styles: footerLabelStyles }, ...componentsForTable.map(comp => ({ content: formatNumberOrDash(stats.min[comp.id], 0), styles: footerRowStyles })), { content: formatNumberOrDash(stats.min['final'], 1), styles: footerRowStyles }], [{ content: 'Maksimum', colSpan: 2, styles: footerLabelStyles }, ...componentsForTable.map(comp => ({ content: formatNumberOrDash(stats.max[comp.id], 0), styles: footerRowStyles })), { content: formatNumberOrDash(stats.max['final'], 1), styles: footerRowStyles }] ];
            const nameWidth = orientation === 'l' ? 55 : 40; const classWidth = 15; const finalScoreWidth = 20; const numComponentCols = componentsForTable.length; const fixedWidths = nameWidth + classWidth + finalScoreWidth; const availableWidth = doc.internal.pageSize.getWidth() - (pageMargin * 2) - fixedWidths; const componentColWidth = numComponentCols > 0 ? Math.max(15, availableWidth / numComponentCols) : 15;
            autoTable(doc, {
                head: head, body: body, foot: foot, startY: tableY, theme: 'grid',
                headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' as FontStyle, fontSize: 9, lineWidth: 0.1, lineColor: [180, 180, 180] },
                footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' as FontStyle, lineWidth: 0.1, lineColor: [180, 180, 180], fontSize: 8.5 },
                styles: { fontSize: 8.5, cellPadding: 1.5, overflow: 'linebreak', lineWidth: 0.1, lineColor: [180, 180, 180] },
                columnStyles: { 0: { cellWidth: nameWidth, halign: 'left' as HAlignType }, 1: { cellWidth: classWidth, halign: 'center' as HAlignType }, ...componentsForTable.reduce((acc, _comp, idx) => { acc[idx + 2] = { cellWidth: componentColWidth, halign: 'center' as HAlignType }; return acc; }, {} as any), [head[0].length - 1]: { cellWidth: finalScoreWidth, halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle }, },
                didDrawPage: (data) => { doc.setFontSize(8); doc.setTextColor(150); const pageCount = (doc as any).internal.getNumberOfPages(); doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, pageMargin, pageHeight - 8); doc.setTextColor(0); }
            });
            return (doc as any).lastAutoTable.finalY;
        };

        let finalY_P = generateSingleTable("Nilai Pengetahuan", initialGrades, componentsP, currentY, "NA (P)");
        const minimumSpacing = 15;
        let finalY_K = 0;
        // Cek apakah tabel Keterampilan perlu halaman baru
        // Perkirakan tinggi header Keterampilan
        const estimatedKHeaderHeight = 20;
        if (finalY_P + minimumSpacing + estimatedKHeaderHeight > pageHeight - pageMargin - 35) { // Kurangi margin bawah + tinggi signature
            doc.addPage();
            currentY = pageMargin; // Reset Y untuk halaman baru
            finalY_K = generateSingleTable("Nilai Keterampilan", initialGrades, componentsK, currentY, "NA (K)");
        } else {
            currentY = finalY_P + minimumSpacing; // Cukup spasi di halaman yang sama
            finalY_K = generateSingleTable("Nilai Keterampilan", initialGrades, componentsK, currentY, "NA (K)");
        }

        let finalY = Math.max(finalY_P, finalY_K); // Gunakan Y terbesar dari kedua tabel jika di halaman sama

        // --- Tanda Tangan ---
        let signatureYStart = finalY + 15; // Jarak dari tabel terakhir
        // Cek jika tanda tangan butuh halaman baru
        if (signatureYStart > pageHeight - 35) { // 35 = perkiraan tinggi area ttd
             doc.addPage();
             signatureYStart = pageMargin;
        }
        const signatureX = pageWidth - pageMargin;
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0);
        doc.text(`${location}, ${signDate}`, signatureX, signatureYStart, { align: 'right' }); signatureYStart += 5;
        doc.text('Guru Mata Pelajaran,', signatureX, signatureYStart, { align: 'right' }); signatureYStart += 20; // Jarak untuk ttd
        doc.setFont("helvetica", "bold"); doc.text(teacherName || '-', signatureX, signatureYStart, { align: 'right' }); signatureYStart += 5;
        doc.setFont("helvetica", "normal"); doc.text(`NIP. ${teacherNisp || '-'}`, signatureX, signatureYStart, { align: 'right' });

        return doc;
    }, [gradeData, capaianData, componentsPengetahuan, componentsKeterampilan, calculateStudentFinalScorePdfMethod]); // Tambahkan capaianData dependency

    // Callback PDF lainnya
    const handleGeneratePreview = useCallback(async () => { if (!gradeData || !isPdfOptionsDialogOpen) { setPdfPreviewUrl(null); return; } setIsPreviewLoading(true); setPdfPreviewUrl(null); await new Promise(resolve => setTimeout(resolve, 50)); try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { setPdfPreviewUrl(doc.output('datauristring')); } else { throw new Error("Gagal buat dokumen PDF."); } } catch (pdfError) { console.error("[PDF Preview] Error:", pdfError); toast.error("Gagal buat pratinjau PDF."); setPdfPreviewUrl(null); } finally { setIsPreviewLoading(false); } }, [gradeData, pdfOrientation, pdfPaperSize, generatePdfDocument, isPdfOptionsDialogOpen]);
    useEffect(() => { if (isPdfOptionsDialogOpen) { handleGeneratePreview(); } else { setPdfPreviewUrl(null); } }, [pdfOrientation, pdfPaperSize, isPdfOptionsDialogOpen, handleGeneratePreview]);
    const handleActualDownload = useCallback(() => { if (!gradeData) { toast.error("Data nilai belum dimuat."); return; } setIsDownloadingPdf(true); setTimeout(() => { try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { const { subjectName } = gradeData; const safeSubjectName = subjectName.replace(/[^a-zA-Z0-9]/g, '_'); const timestamp = new Date().toISOString().slice(0,10); const fileName = `Rekap_Nilai_${safeSubjectName}_${timestamp}_${pdfOrientation}_${pdfPaperSize}.pdf`; doc.save(fileName); toast.success("Unduhan PDF dimulai..."); setIsPdfOptionsDialogOpen(false); } else { throw new Error("Gagal buat dokumen PDF."); } } catch (pdfError) { console.error("[PDF Download] Error:", pdfError); toast.error("Gagal mengunduh PDF."); } finally { setIsDownloadingPdf(false); } }, 50); }, [gradeData, pdfOrientation, pdfPaperSize, generatePdfDocument]);



    // --- Render Logic Utama ---
    if (paramsError) return <div className="container mx-auto p-4 text-red-600 text-center">Error: {paramsError}</div>;
    if (isLoadingGrade || isCapaianLoading) return <div className="container mx-auto p-4 flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Memuat data...</div>;
    if (errorGrade) return <div className="container mx-auto p-4 text-red-600 text-center">Error memuat data nilai: {errorGrade}</div>;
    if (!gradeData) return <div className="container mx-auto p-4 text-center text-muted-foreground">Data nilai tidak tersedia atau ID Mata Pelajaran tidak ditemukan.</div>;

    // --- Helper Komponen untuk Edit/View Capaian (Internal) ---
    const CapaianEditor = ({ type }: { type: 'pengetahuan' | 'keterampilan' }) => {
        const isEditing = type === 'pengetahuan' ? isEditingPengetahuan : isEditingKeterampilan;
        const editedDesc = type === 'pengetahuan' ? editedPengetahuanDesc : editedKeterampilanDesc;
        const setEditedDesc = type === 'pengetahuan' ? setEditedPengetahuanDesc : setEditedKeterampilanDesc;
        const setIsEditing = type === 'pengetahuan' ? setIsEditingPengetahuan : setIsEditingKeterampilan;
        const initialDesc = type === 'pengetahuan' ? (initialCapaianData?.pengetahuan?.deskripsi || '') : (initialCapaianData?.keterampilan?.deskripsi || '');
        // Hapus hasExistingData karena tombol hapus sudah tidak ada
        // const hasExistingData = type === 'pengetahuan' ? !!capaianData?.pengetahuan : !!capaianData?.keterampilan;
        const typeLabel = type === 'pengetahuan' ? 'Pengetahuan' : 'Keterampilan';

        return (
            // Container tanpa border/padding eksternal
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                    <Label className="text-base font-xs">
                        {/* Ganti label agar lebih jelas */}
                        {typeLabel}
                    </Label>
                    {/* Tombol Edit */}
                    {!isCapaianLoading && !isEditing && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)} disabled={isSavingCapaian}>
                            <Pencil className="h-4 w-4" /> <span className="sr-only">Edit {typeLabel}</span>
                        </Button>
                    )}
                </div>

                {/* Tampilkan loading skeleton jika sedang loading */}
                {isCapaianLoading ? (
                    <div className="h-16 bg-muted rounded animate-pulse"></div>
                 ) : isEditing ? (
                    // --- Mode Edit ---
                    <div className='space-y-2'>
                        <Textarea
                            id={`capaian-${type}`}
                            placeholder={`Masukkan deskripsi capaian ${type.toLowerCase()}...`}
                            value={editedDesc}
                            onChange={(e) => setEditedDesc(e.target.value)}
                            className="min-h-[12px] text-xs text-gray-600"
                            disabled={isSavingCapaian}
                            autoFocus
                        />
                        <div className='flex items-center justify-end gap-2'>
                            <Button variant="ghost" size="sm" onClick={() => onCancelEditClick(type)} disabled={isSavingCapaian} className='h-7 px-2'> <X className="mr-1 h-4 w-4" /> Batal </Button>
                            <Button size="sm" onClick={() => onSaveChangesClick(type)} disabled={isSavingCapaian || editedDesc === initialDesc} className='h-7 px-2'> {isSavingCapaian ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Simpan </Button>
                        </div>
                    </div>
                ) : (
                    // --- Mode Tampilan ---
                    // Tampilkan teks deskripsi atau pesan placeholder
                    <p className={`text-xs text-gray-600 min-h-[12px] whitespace-pre-wrap py-1 ${editedDesc ? '' : 'text-muted-foreground italic'}`}>
                        {editedDesc || '(Klik ikon pensil untuk menambahkan deskripsi)'}
                    </p>
                    // Tombol Hapus sudah dihilangkan
                )}
            </div>
        );
    };
    // --- Akhir Helper Komponen ---


    // === MULAI JSX UTAMA ===
    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Header Halaman */}
            <div className="flex justify-between items-start mb-3 flex-wrap gap-x-6 gap-y-3">
                 <div className='space-y-1'>
                    <h2 className="text-xl font-semibold">{gradeData.subjectName}</h2>
                    <p className="text-sm text-muted-foreground">Tahun Ajaran: {gradeData.academicYear}</p>
                    <div className={`text-sm font-medium flex items-center gap-1 ${totalWeightPengetahuan !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}> <Scale size={16} className="h-4 w-4 flex-shrink-0" /> Bobot Pengetahuan: {totalWeightPengetahuan.toFixed(0)}% {totalWeightPengetahuan !== 100 && <span className="font-semibold">(Bobot ≠ 100%)</span>} </div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${totalWeightKeterampilan !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}> <Scale size={16} className="h-4 w-4 flex-shrink-0" /> Bobot Keterampilan: {totalWeightKeterampilan.toFixed(0)}% {totalWeightKeterampilan !== 100 && <span className="font-semibold">(Bobot ≠ 100%)</span>} </div>
                    <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground"> <Sigma size={16} className="h-4 w-4 flex-shrink-0" /> Rata-rata Pengetahuan: {formatNumberOrDash(overallAveragePengetahuan, 1)} </div>
                    <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground"> <Sigma size={16} className="h-4 w-4 flex-shrink-0" /> Rata-rata Keterampilan: {formatNumberOrDash(overallAverageKeterampilan, 1)} </div>
                 </div>
                 <div className='flex items-center gap-2 flex-shrink-0 self-start pt-1'>
                    {/* Tombol PDF */}
                     <Dialog open={isPdfOptionsDialogOpen} onOpenChange={(open) => { setIsPdfOptionsDialogOpen(open); if (!open) setPdfPreviewUrl(null); }}> <DialogTrigger asChild><Button variant="secondary"> <Download className="mr-2 h-4 w-4"/> Unduh PDF </Button></DialogTrigger> <DialogContent className="sm:max-w-3xl"> {/* ... (Konten Dialog PDF tetap sama) ... */} <DialogHeader> <DialogTitle>Opsi Unduh PDF</DialogTitle> <DialogDescription>Pilih orientasi dan ukuran kertas. PDF akan berisi deskripsi capaian dan tabel nilai Pengetahuan & Keterampilan.</DialogDescription> </DialogHeader> <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4"> <div className="space-y-4 md:col-span-1"> <div> <Label className="text-sm font-medium">Orientasi</Label> <RadioGroup value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as PdfOrientation)} className="mt-2 grid grid-cols-2 gap-2"> <div><RadioGroupItem value="p" id="pdf-p" className="peer sr-only" /> <Label htmlFor="pdf-p" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"> <GalleryHorizontal size={16} className='mr-2 text-primary'></GalleryHorizontal> Potrait</Label></div> <div><RadioGroupItem value="l" id="pdf-l" className="peer sr-only" /> <Label htmlFor="pdf-l" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"> <GalleryVertical size={16} className='mr-2 text-primary'></GalleryVertical> Lanskap</Label></div> </RadioGroup> </div> <div> <Label htmlFor="pdf-paper-size" className="text-sm font-medium">Ukuran Kertas</Label> <Select value={pdfPaperSize} onValueChange={(v) => setPdfPaperSize(v as PdfPaperSize)}> <SelectTrigger id="pdf-paper-size" className="w-full mt-2"><SelectValue placeholder="Pilih..." /></SelectTrigger> <SelectContent> <SelectItem value="a4">A4</SelectItem> <SelectItem value="letter">Letter</SelectItem> <SelectItem value="legal">Legal</SelectItem> </SelectContent> </Select> </div> <div className='pt-4'> <Button onClick={handleActualDownload} disabled={isDownloadingPdf || isPreviewLoading} className="w-full"> {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh PDF Sekarang </Button> </div> </div> <div className="md:col-span-2 border rounded-md bg-muted/30 min-h-[400px] flex items-center justify-center relative overflow-hidden">{isPreviewLoading && (<div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}{pdfPreviewUrl ? (<iframe src={pdfPreviewUrl} className="w-full h-[500px] md:h-[600px]" title="Pratinjau PDF" aria-label="Pratinjau Dokumen PDF" />) : (<div className="text-center text-muted-foreground p-4"><p>Pratinjau PDF akan muncul di sini...</p>{!isPreviewLoading && <p className='text-xs mt-1'>(Mengubah opsi akan memuat ulang pratinjau)</p>}</div>)}</div> </div> <DialogFooter className="mt-4"><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter> </DialogContent> </Dialog>
                 </div>
            </div>

             {/* Tampilkan error capaian jika ada */}
             {capaianError && ( <div className="p-3 mb-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm"> Gagal memuat/menyimpan deskripsi capaian kompetensi: {capaianError} </div> )}

            {/* ====================================================================== */}
            {/* BAGIAN EDIT/VIEW CAPAIAN KOMPETENSI (SATU KARTU, DI ATAS TABS)       */}
            {/* ====================================================================== */}
            <div className="p-4 border rounded-md bg-background shadow-sm space-y-4">
                <h3 className="text-md font-semibold border-b pb-2 mb-4">Capaian Kompetensi</h3>
                {/* --- Area Pengetahuan --- */}
                <CapaianEditor type="pengetahuan" />

                {/* --- Pemisah Visual --- */}
                <hr className=" border-dashed"/>

                 {/* --- Area Keterampilan --- */}
                <CapaianEditor type="keterampilan" />
            </div>
            {/* ====================================================================== */}
            {/* AKHIR BAGIAN EDIT/VIEW CAPAIAN KOMPETENSI                             */}
            {/* ====================================================================== */}


            {/* Area TABS (HANYA berisi tabel nilai) */}
            <Tabs defaultValue="pengetahuan" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pengetahuan">Nilai Pengetahuan</TabsTrigger>
                    <TabsTrigger value="keterampilan">Nilai Keterampilan</TabsTrigger>
                </TabsList>
                <TabsContent value="pengetahuan">
                    <div className="bg-card">
                        {gradeData && ( <GradeEntryDataTable key="pengetahuan-table" students={gradeData.students} assessmentComponents={componentsPengetahuan} initialGrades={gradeData.initialGrades} subjectId={String(subjectId)} onSaveSingleGrade={handleSaveSingleGradeClient} subjectName={gradeData.subjectName} /> )}
                    </div>
                </TabsContent>
                <TabsContent value="keterampilan">
                    <div className="bg-card">
                        {gradeData && ( <GradeEntryDataTable key="keterampilan-table" students={gradeData.students} assessmentComponents={componentsKeterampilan} initialGrades={gradeData.initialGrades} subjectId={String(subjectId)} onSaveSingleGrade={handleSaveSingleGradeClient} subjectName={gradeData.subjectName} /> )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}