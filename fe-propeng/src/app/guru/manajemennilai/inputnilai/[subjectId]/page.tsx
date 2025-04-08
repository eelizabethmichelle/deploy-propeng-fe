// Lokasi: app/guru/input-nilai/[subjectId]/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { useParams, usePathname } from 'next/navigation'; // Tidak dipakai lagi, pakai window.location
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Scale, Download, Sigma, GalleryHorizontal, GalleryVertical } from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable, { UserOptions, CellDef, RowInput, HAlignType, FontStyle } from 'jspdf-autotable';
import { GradeEntryDataTable } from '@/components/ui/grade-entry/grade-entry-data-table'; // Sesuaikan path

// --- Tipe Data ---
interface Student { id: string; name: string; class: string; }
interface AssessmentComponent { id: string; name: string; weight: number; }
type GradesState = Record<string, Record<string, number | null>>;
interface GradeData {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    subjectName: string;
    initialGrades: GradesState;              // Pengetahuan
    initialGrades_keterampilan: GradesState; // Keterampilan
    academicYear: string;
    teacherName: string;
    teacherNisp: string;
}
interface DeleteDialogState { isOpen: boolean; componentId: string | null; componentName: string | null; isLoading: boolean; error?: string | null; }
type PdfOrientation = 'p' | 'l';
type PdfPaperSize = 'a4' | 'letter' | 'legal';


export default function InputNilaiPage() {
    // --- State Utama ---
    const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
    const [paramsError, setParamsError] = useState<string | null>(null);
    const [gradeData, setGradeData] = useState<GradeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- State Dialog PDF ---
    const [isPdfOptionsDialogOpen, setIsPdfOptionsDialogOpen] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('p');
    const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>('a4');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // --- Ekstraksi subjectId (Client-Side) ---
    useEffect(() => {
        const pathname = window.location.pathname;
        if (pathname) {
            const segments = pathname.split('/');
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && /^\d+$/.test(lastSegment)) {
                setSubjectId(lastSegment); setParamsError(null);
            } else {
                setParamsError("ID Mata Pelajaran tidak valid di URL."); setSubjectId(undefined); setIsLoading(false);
            }
        } else {
            setParamsError("Tidak bisa membaca path URL."); setSubjectId(undefined); setIsLoading(false);
        }
    }, []);

    // --- Fetch Data Awal ---
    const fetchInitialData = useCallback(async () => {
        if (!subjectId) { return; } // Skip jika ID belum ada
        console.log(`[page.tsx fetchData] Starting fetch for subjectId: ${subjectId}`);
        setIsLoading(true); setError(null);
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Token otentikasi tidak ditemukan.");

            const apiUrl = `/api/nilai/gradedata?subjectId=${subjectId}`;
            const response = await fetch(apiUrl, { headers: { "Authorization": `Bearer ${accessToken}` }, cache: 'no-store' });
            console.log(`[page.tsx fetchData] Response status: ${response.status}`);
            if (!response.ok) { let errData; try { errData = await response.json(); } catch { errData = { message: `Error ${response.status}` }; } throw new Error(errData?.message || `Gagal memuat data (${response.status})`); }

            const data: GradeData = await response.json();
            if (data && Array.isArray(data.students) && Array.isArray(data.assessmentComponents) && typeof data.initialGrades === 'object' && typeof data.initialGrades_keterampilan === 'object') {
                 data.students.sort((a, b) => a.name.localeCompare(b.name));
                 setGradeData(data); console.log("[page.tsx fetchData] Fetched Initial Data:", data);
             } else { throw new Error("Format data dari server tidak valid."); }
        } catch (err) { console.error("[page.tsx fetchData] Catch block error:", err); setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data"); setGradeData(null); }
        finally { setIsLoading(false); }
    }, [subjectId]);

    // --- useEffect untuk memanggil fetchInitialData ---
    useEffect(() => { if (subjectId) { fetchInitialData(); } }, [subjectId, fetchInitialData]);

    // --- Fungsi Simpan Nilai (Sudah Disesuaikan) ---
    const handleSaveSingleGradeClient = useCallback(async ( studentId: string, componentId: string, score: number | null, scoreType: 'pengetahuan' | 'keterampilan'): Promise<void> => {
        if (!subjectId) { toast.error("Gagal menyimpan: ID Mata Pelajaran tidak ditemukan."); throw new Error("ID Mata Pelajaran tidak valid."); }
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) { toast.error("Gagal menyimpan: Sesi berakhir."); throw new Error("Token otorisasi tidak ditemukan."); }
            console.log(`[page.tsx Save] Sending: St:${studentId} Comp:${componentId} Score:${score} Type:${scoreType} Subj:${subjectId}`);
            const apiUrl = `/api/nilai/gradedata?subjectId=${subjectId}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify({ studentId, componentId, score, scoreType }), });
            const result = await response.json();
            console.log(`[page.tsx Save] Response status: ${response.status}`, result);
            if (!response.ok) { toast.error(`Gagal menyimpan: ${result.message || `Error (${response.status})`}`); throw new Error(result.message || `Gagal menyimpan (${response.status})`); }
            setGradeData(prevData => {
                if (!prevData) return null;
                const gradeKeyToUpdate = scoreType === 'pengetahuan' ? 'initialGrades' : 'initialGrades_keterampilan';
                const updatedGrades = structuredClone(prevData[gradeKeyToUpdate]);
                if (!updatedGrades[studentId]) { updatedGrades[studentId] = {}; }
                updatedGrades[studentId][componentId] = score;
                console.log(`[page.tsx Save] Successfully updated local state for ${studentId}, type: ${scoreType}.`);
                return { ...prevData, [gradeKeyToUpdate]: updatedGrades };
            });
        } catch (err) { console.error(`[page.tsx Client Save ${scoreType}] Error:`, err); if (!(err instanceof Error && err.message.startsWith("Gagal menyimpan"))) { toast.error(`Gagal menyimpan nilai ${scoreType}: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`); } throw err; }
    }, [subjectId]);

    // --- Kalkulasi Memoized ---
    const totalWeight = useMemo(() => {
        if (!gradeData?.assessmentComponents) return 0;
        return gradeData.assessmentComponents.reduce((sum, comp) => sum + (Number(comp?.weight) || 0), 0);
    }, [gradeData?.assessmentComponents]);


    // --- Helper untuk Kalkulasi Nilai Akhir Siswa (Metode PDF) ---
    const calculateStudentFinalScorePdfMethod = (
        studentId: string,
        gradesSource: GradesState | undefined, // initialGrades atau initialGrades_keterampilan
        assessmentComponents: AssessmentComponent[] | undefined | null
    ): number | null => {
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (!gradesSource || currentComponents.length === 0) return null;

        const studentGrades = gradesSource[studentId];
        // Total bobot HARUS 100% agar perhitungan ini valid, atau gunakan totalWeight dari useMemo
        const totalPossibleWeight = 100; // Asumsi total bobot selalu 100

        if (!studentGrades && currentComponents.length > 0) {
            // Jika siswa belum punya entri nilai sama sekali, nilai akhirnya 0
             return 0.0;
        }
        if (!studentGrades) return null; // Jika studentGrades undefined (seharusnya tidak terjadi jika students ada)


        let scoreTimesWeightSum = 0;
        currentComponents.forEach(comp => {
            if (!comp?.id) return;
            const score = studentGrades[comp.id] ?? 0; // Anggap null/undefined sebagai 0
            const compWeight = comp.weight || 0;
            if (typeof score === 'number' && !isNaN(score) && compWeight > 0) {
                scoreTimesWeightSum += (score * compWeight);
            }
             // Jika score bukan angka valid, kontribusinya 0 * compWeight = 0
        });

        // Selalu bagi dengan total bobot komponen (misal 100)
        return totalPossibleWeight > 0 ? (scoreTimesWeightSum / totalPossibleWeight) : 0;
    };
    // --- Akhir Helper ---

    // --- Rata-rata PENGETAHUAN (Menggunakan Metode PDF) ---
    const overallAveragePengetahuan = useMemo(() => {
        if (!gradeData || !gradeData.students.length) return null;
        const { students, initialGrades, assessmentComponents } = gradeData;
        const finalScoresList: number[] = [];

        students.forEach(student => {
            const finalScore = calculateStudentFinalScorePdfMethod(student.id, initialGrades, assessmentComponents);
            // Hanya masukkan ke list jika score BUKAN null (artinya bisa dihitung)
            if (finalScore !== null) {
                finalScoresList.push(finalScore);
            }
        });

        // Rata-ratakan HANYA dari nilai akhir yang valid
        return finalScoresList.length > 0 ? (finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length) : null;
    }, [gradeData]); // Dependency hanya gradeData

    // --- Rata-rata KETERAMPILAN (Menggunakan Metode PDF) ---
    const overallAverageKeterampilan = useMemo(() => {
        if (!gradeData || !gradeData.students.length) return null;
        const { students, initialGrades_keterampilan, assessmentComponents } = gradeData;
        const finalScoresList: number[] = [];

        students.forEach(student => {
            const finalScore = calculateStudentFinalScorePdfMethod(student.id, initialGrades_keterampilan, assessmentComponents);
            if (finalScore !== null) {
                finalScoresList.push(finalScore);
            }
        });
        // Rata-ratakan HANYA dari nilai akhir yang valid
        return finalScoresList.length > 0 ? (finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length) : null;
    }, [gradeData]); // Dependency hanya gradeData


    // ***** PINDAHKAN useMemo totalPossibleWeight KE SINI *****
    const totalPossibleWeightForPdf = useMemo(() => {
        if (!gradeData?.assessmentComponents) return 0;
        // Pastikan assessmentComponents adalah array sebelum reduce
        const components = Array.isArray(gradeData.assessmentComponents) ? gradeData.assessmentComponents : [];
        return components.reduce((sum, comp) => sum + (comp?.weight || 0), 0);
    }, [gradeData?.assessmentComponents]);
    // *******************************************************

    // --- Fungsi PDF ---
    const formatNumberOrDash = (value: number | null | undefined, decimals: number = 1): string => { if (typeof value === 'number' && !isNaN(value)) { return value.toFixed(decimals); } return '-'; };

    const generatePdfDocument = useCallback((orientation: PdfOrientation, paperSize: PdfPaperSize): jsPDF | null => {
        if (!gradeData) { toast.error("Data nilai belum tersedia untuk membuat PDF."); return null; }

        // Gunakan nilai yang sudah dihitung di luar
        const totalPossibleWeight = totalPossibleWeightForPdf;
        console.log("[PDF] Using totalPossibleWeight:", totalPossibleWeight); // Debug

        const { students, assessmentComponents, initialGrades, initialGrades_keterampilan, subjectName, academicYear, teacherName, teacherNisp } = gradeData;
        const schoolName = "SMA Kristen Anglo"; const location = "Bekasi";
        const signDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: paperSize });
        const pageMargin = 14; const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = pageMargin;

        const drawTableTitle = (title: string, yPos: number) => { doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(title, pageWidth / 2, yPos, { align: 'center' }); return yPos + 6; };

        // Header Dokumen Utama (Sama)
        doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Daftar Nilai Siswa", pageWidth / 2, currentY, { align: 'center' }); currentY += 8;
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); const infoLineHeight = 5;
        doc.text(`Nama Sekolah`, pageMargin, currentY); doc.text(`: ${schoolName}`, pageMargin + 30, currentY); currentY += infoLineHeight;
        doc.text(`Mata Pelajaran`, pageMargin, currentY); doc.text(`: ${subjectName}`, pageMargin + 30, currentY); currentY += infoLineHeight;
        doc.text(`Tahun Ajaran`, pageMargin, currentY); doc.text(`: ${academicYear}`, pageMargin + 30, currentY); currentY += infoLineHeight;
        const uniqueClasses = Array.from(new Set(students.map(s => s.class))).filter(Boolean).join(', ');
        doc.text(`Kelas`, pageMargin, currentY); doc.text(`: ${uniqueClasses || '-'}`, pageMargin + 30, currentY); currentY += 10;

        // --- Fungsi Helper untuk Membuat Satu Tabel (P atau K) ---
        const generateSingleTable = ( tableTitle: string, gradesData: GradesState, startY: number, finalScoreLabel: string ): number => {
            currentY = drawTableTitle(tableTitle, startY);
            const componentScores: Record<string, number[]> = {}; assessmentComponents.forEach(comp => componentScores[comp.id] = []);
            const finalScoresList: number[] = [];

            const body: RowInput[] = students.map((student) => {
                let finalScoreNum = 0; let weightSum = 0; const studentRow: RowInput = [ student.name, { content: student.class, styles: { halign: 'center' as HAlignType } } ];
                assessmentComponents.forEach(comp => {
                    const rawScore = gradesData[student.id]?.[comp.id] ?? null; let displayScore = '-'; let scoreForCalc = 0;
                    if (typeof rawScore === 'number' && !isNaN(rawScore)) { displayScore = rawScore.toFixed(0); scoreForCalc = rawScore; componentScores[comp.id].push(rawScore); } // Tampilkan 0 desimal di cell
                    if (comp.weight && comp.weight > 0) { finalScoreNum += (scoreForCalc * comp.weight); weightSum += comp.weight; }
                    studentRow.push({ content: displayScore, styles: { halign: 'center' as HAlignType } });
                });
                const finalScore = weightSum > 0 ? (finalScoreNum / weightSum) : null; // Hitung NA per tipe
                if (finalScore !== null) finalScoresList.push(finalScore);
                studentRow.push({ content: formatNumberOrDash(finalScore, 1), styles: { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle } });
                return studentRow;
            });

            const stats = { avg: {} as Record<string, number | null>, min: {} as Record<string, number | null>, max: {} as Record<string, number | null> };
            assessmentComponents.forEach(comp => { const scores = componentScores[comp.id]; stats.avg[comp.id] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null; stats.min[comp.id] = scores.length > 0 ? Math.min(...scores) : null; stats.max[comp.id] = scores.length > 0 ? Math.max(...scores) : null; });
            stats.avg['final'] = finalScoresList.length > 0 ? finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length : null;
            stats.min['final'] = finalScoresList.length > 0 ? Math.min(...finalScoresList) : null;
            stats.max['final'] = finalScoresList.length > 0 ? Math.max(...finalScoresList) : null;

            const head: CellDef[][] = [[ { content: 'Nama Siswa', styles: { fontStyle: 'bold' as FontStyle, halign: 'left' as HAlignType } }, { content: 'Kelas', styles: { fontStyle: 'bold' as FontStyle, halign: 'center' as HAlignType } }, ...assessmentComponents.map(comp => ({ content: `${comp.name}\n(${comp.weight || 0}%)`, styles: { halign: 'center' as HAlignType, fontStyle: 'bold' as FontStyle, fontSize: 8 } })), { content: finalScoreLabel, styles: { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle } } ]];
            const footerRowStyles = { halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle }; const footerLabelStyles = { halign: 'left' as HAlignType, fontStyle: 'bold' as FontStyle };
            const foot: RowInput[] = [ [{ content: 'Rata-rata', colSpan: 2, styles: footerLabelStyles }, ...assessmentComponents.map(comp => ({ content: formatNumberOrDash(stats.avg[comp.id], 1), styles: footerRowStyles })), { content: formatNumberOrDash(stats.avg['final'], 1), styles: footerRowStyles }], [{ content: 'Minimum', colSpan: 2, styles: footerLabelStyles }, ...assessmentComponents.map(comp => ({ content: formatNumberOrDash(stats.min[comp.id], 0), styles: footerRowStyles })), { content: formatNumberOrDash(stats.min['final'], 1), styles: footerRowStyles }], [{ content: 'Maksimum', colSpan: 2, styles: footerLabelStyles }, ...assessmentComponents.map(comp => ({ content: formatNumberOrDash(stats.max[comp.id], 0), styles: footerRowStyles })), { content: formatNumberOrDash(stats.max['final'], 1), styles: footerRowStyles }] ];
            const nameWidth = orientation === 'l' ? 55 : 40; const classWidth = 15; const finalScoreWidth = 20; const numComponentCols = assessmentComponents.length; const fixedWidths = nameWidth + classWidth + finalScoreWidth; const availableWidth = doc.internal.pageSize.getWidth() - (pageMargin * 2) - fixedWidths; const componentColWidth = numComponentCols > 0 ? Math.max(15, availableWidth / numComponentCols) : 15;

            autoTable(doc, {
                head: head, body: body, foot: foot, startY: currentY, theme: 'grid',
                headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' as FontStyle, fontSize: 9, lineWidth: 0.1, lineColor: [180, 180, 180] },
                footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' as FontStyle, lineWidth: 0.1, lineColor: [180, 180, 180], fontSize: 8.5 },
                styles: { fontSize: 8.5, cellPadding: 1.5, overflow: 'linebreak', lineWidth: 0.1, lineColor: [180, 180, 180] },
                columnStyles: { 0: { cellWidth: nameWidth, halign: 'left' as HAlignType }, 1: { cellWidth: classWidth, halign: 'center' as HAlignType }, ...assessmentComponents.reduce((acc, _comp, idx) => { acc[idx + 2] = { cellWidth: componentColWidth, halign: 'center' as HAlignType }; return acc; }, {} as any), [head[0].length - 1]: { cellWidth: finalScoreWidth, halign: 'right' as HAlignType, fontStyle: 'bold' as FontStyle }, },
                didDrawPage: (data) => { doc.setFontSize(8); doc.setTextColor(150); const pageCount = (doc as any).internal.getNumberOfPages(); doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, pageMargin, pageHeight - 8); doc.setTextColor(0); }
            });
            return (doc as any).lastAutoTable.finalY;
        };

        // --- Generate Tabel ---
        let finalY_P = generateSingleTable("Nilai Pengetahuan", initialGrades, currentY, "Nilai Akhir (P)");
        const minimumSpacing = 15;
        if (finalY_P + minimumSpacing + 20 > pageHeight - pageMargin) { doc.addPage(); currentY = pageMargin; }
        else { currentY = finalY_P + minimumSpacing; }
        let finalY_K = generateSingleTable("Nilai Keterampilan", initialGrades_keterampilan, currentY, "Nilai Akhir (K)");

        // --- Tanda Tangan ---
        let signatureYStart = finalY_K + 15;
        if (signatureYStart > pageHeight - 35) { doc.addPage(); signatureYStart = pageMargin; }
        const signatureX = pageWidth - pageMargin;
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0);
        doc.text(`${location}, ${signDate}`, signatureX, signatureYStart, { align: 'right' }); signatureYStart += 5;
        doc.text('Guru Mata Pelajaran,', signatureX, signatureYStart, { align: 'right' }); signatureYStart += 20;
        doc.setFont("helvetica", "bold"); doc.text(teacherName || '-', signatureX, signatureYStart, { align: 'right' }); signatureYStart += 5;
        doc.setFont("helvetica", "normal"); doc.text(`NIP. ${teacherNisp || '-'}`, signatureX, signatureYStart, { align: 'right' });

        return doc;

    }, [gradeData, totalPossibleWeightForPdf]); // <-- Tambah dependency totalPossibleWeightForPdf

    // Callback PDF lainnya
    const handleGeneratePreview = useCallback(async () => { if (!gradeData || !isPdfOptionsDialogOpen) { setPdfPreviewUrl(null); return; } setIsPreviewLoading(true); setPdfPreviewUrl(null); await new Promise(resolve => setTimeout(resolve, 50)); try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { setPdfPreviewUrl(doc.output('datauristring')); } else { throw new Error("Gagal buat dokumen PDF."); } } catch (pdfError) { console.error("[PDF Preview] Error:", pdfError); toast.error("Gagal buat pratinjau PDF."); setPdfPreviewUrl(null); } finally { setIsPreviewLoading(false); } }, [gradeData, pdfOrientation, pdfPaperSize, generatePdfDocument, isPdfOptionsDialogOpen]);
    useEffect(() => { if (isPdfOptionsDialogOpen) { handleGeneratePreview(); } else { setPdfPreviewUrl(null); } }, [pdfOrientation, pdfPaperSize, isPdfOptionsDialogOpen, handleGeneratePreview]);
    const handleActualDownload = useCallback(() => { if (!gradeData) { toast.error("Data nilai belum dimuat."); return; } setIsDownloadingPdf(true); setTimeout(() => { try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { const { subjectName } = gradeData; const safeSubjectName = subjectName.replace(/[^a-zA-Z0-9]/g, '_'); const timestamp = new Date().toISOString().slice(0,10); const fileName = `Rekap_Nilai_${safeSubjectName}_${timestamp}_${pdfOrientation}_${pdfPaperSize}.pdf`; doc.save(fileName); toast.success("Unduhan PDF dimulai..."); setIsPdfOptionsDialogOpen(false); } else { throw new Error("Gagal buat dokumen PDF."); } } catch (pdfError) { console.error("[PDF Download] Error:", pdfError); toast.error("Gagal mengunduh PDF."); } finally { setIsDownloadingPdf(false); } }, 50); }, [gradeData, pdfOrientation, pdfPaperSize, generatePdfDocument]);


    // --- Render Logic Utama ---
    if (paramsError) return <div className="container mx-auto p-4 text-red-600 text-center">Error: {paramsError}</div>;
    if (isLoading) return <div className="container mx-auto p-4 text-center"><Loader2 className="inline-block animate-spin mr-2" /> Memuat data nilai...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-600 text-center">Error memuat data: {error}</div>;
    if (!gradeData) return <div className="container mx-auto p-4 text-center text-muted-foreground">Data nilai tidak tersedia atau ID Mata Pelajaran tidak ditemukan.</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Header Halaman */}
            <div className="flex justify-between items-start mb-3 flex-wrap gap-x-6 gap-y-3">
                <div className='space-y-1'>
                    <h2 className="text-xl font-semibold">{gradeData.subjectName}</h2>
                    <p className="text-sm text-muted-foreground">Tahun Ajaran: {gradeData.academicYear}</p>
                    <div className={`text-sm font-medium flex items-center gap-1 ${totalWeight !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                        <Scale className="h-4 w-4" /> Total Bobot: {totalWeight.toFixed(0)}% {totalWeight !== 100 && <span className="font-semibold">(Bobot tidak 100%)</span>}
                    </div>
                     <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                        <Sigma className="h-4 w-4" /> Rata-rata Pengetahuan: {overallAveragePengetahuan !== null ? overallAveragePengetahuan.toFixed(1) : '-'}
                    </div>
                     <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                        <Sigma className="h-4 w-4" /> Rata-rata Keterampilan: {overallAverageKeterampilan !== null ? overallAverageKeterampilan.toFixed(1) : '-'}
                    </div>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0 self-start pt-1'>
                    {/* Tombol PDF */}
                    <Dialog open={isPdfOptionsDialogOpen} onOpenChange={(open) => { setIsPdfOptionsDialogOpen(open); if (!open) setPdfPreviewUrl(null); }}>
                         <DialogTrigger asChild><Button variant="secondary"> <Download className="mr-2 h-4 w-4"/> Unduh PDF </Button></DialogTrigger>
                         <DialogContent className="sm:max-w-3xl">
                              <DialogHeader> <DialogTitle>Opsi Unduh PDF</DialogTitle> <DialogDescription>Pilih orientasi dan ukuran kertas. PDF akan berisi tabel Pengetahuan dan Keterampilan terpisah.</DialogDescription> </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4"> <div className="space-y-4 md:col-span-1"> <div>
                                  <Label className="text-sm font-medium">Orientasi</Label> <RadioGroup value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as PdfOrientation)} className="mt-2 grid grid-cols-2 gap-2"> <div><RadioGroupItem value="p" id="pdf-p" className="peer sr-only" />
                                      <Label htmlFor="pdf-p" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                          <GalleryHorizontal size={16} className='mr-2 text-primary'></GalleryHorizontal> Potrait</Label></div> <div><RadioGroupItem value="l" id="pdf-l" className="peer sr-only" />
                                          <Label htmlFor="pdf-l" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                          <GalleryVertical size={16} className='mr-2 text-primary'></GalleryVertical> Lanskap</Label></div> </RadioGroup> </div> <div>
                                      <Label htmlFor="pdf-paper-size" className="text-sm font-medium">Ukuran Kertas</Label> <Select value={pdfPaperSize} onValueChange={(v) => setPdfPaperSize(v as PdfPaperSize)}> <SelectTrigger id="pdf-paper-size" className="w-full mt-2"><SelectValue placeholder="Pilih..." /></SelectTrigger> <SelectContent> <SelectItem value="a4">A4</SelectItem> <SelectItem value="letter">Letter</SelectItem> <SelectItem value="legal">Legal</SelectItem> </SelectContent> </Select> </div> <div className='pt-4'> <Button onClick={handleActualDownload} disabled={isDownloadingPdf || isPreviewLoading} className="w-full"> {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh PDF Sekarang </Button> </div> </div> <div className="md:col-span-2 border rounded-md bg-muted/30 min-h-[400px] flex items-center justify-center relative overflow-hidden">{isPreviewLoading && (<div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}{pdfPreviewUrl ? (<iframe src={pdfPreviewUrl} className="w-full h-[500px] md:h-[600px]" title="Pratinjau PDF" aria-label="Pratinjau Dokumen PDF" />) : (<div className="text-center text-muted-foreground p-4"><p>Pratinjau PDF akan muncul di sini...</p>{!isPreviewLoading && <p className='text-xs mt-1'>(Mengubah opsi akan memuat ulang pratinjau)</p>}</div>)}</div> </div> <DialogFooter className="mt-4"><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter>
                         </DialogContent>
                     </Dialog>
                </div>
             </div>

            {/* Area TABS */}
            <Tabs defaultValue="pengetahuan" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pengetahuan">Pengetahuan</TabsTrigger>
                    <TabsTrigger value="keterampilan">Keterampilan</TabsTrigger>
                </TabsList>
                <TabsContent value="pengetahuan" className="mt-4 bg-card">
                    {gradeData && ( <GradeEntryDataTable key="pengetahuan-table" students={gradeData.students} assessmentComponents={gradeData.assessmentComponents} subjectName={""} initialGrades={gradeData.initialGrades} scoreType="pengetahuan" subjectId={String(subjectId)} onSaveSingleGrade={handleSaveSingleGradeClient} /> )}
                </TabsContent>
                <TabsContent value="keterampilan" className="mt-4 bg-card">
                     {gradeData && ( <GradeEntryDataTable key="keterampilan-table" students={gradeData.students} assessmentComponents={gradeData.assessmentComponents} subjectName={""} initialGrades={gradeData.initialGrades_keterampilan} scoreType="keterampilan" subjectId={String(subjectId)} onSaveSingleGrade={handleSaveSingleGradeClient} /> )}
                </TabsContent>
            </Tabs>
        </div>
    );
}