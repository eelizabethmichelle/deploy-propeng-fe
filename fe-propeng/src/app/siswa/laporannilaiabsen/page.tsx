// src/app/siswa/laporannilaiabsen/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// ... other imports
import { AttendanceSummaryTable } from "@/components/ui/summarystudent/attendance-summary"
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// --- Import updated schema ---
import { StudentInfo, AttendanceSummaryData, StudentGradesDataFromApi, SubjectGradeFromApi } from '@/components/ui/summarystudent/schema';
// --- Import the table component ---
import { SubjectGradesTable } from '@/components/ui/summarystudent/subject-grades-data-table'; // Adjust path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, GalleryHorizontal, GalleryVertical, Loader2 } from 'lucide-react';

type PdfOrientation = 'p' | 'l';
type PdfPaperSize = 'a4' | 'letter' | 'legal';

const attendanceStatusLabels: { [key: string]: string } = {
    Sakit: 'Sakit', Izin: 'Izin', Alfa: 'Tanpa Keterangan',
};

// --- REMOVE calculateFinalScore function ---

export default function StudentReportPage() {
    // --- Update state type hint ---
    const [gradesDataFromApi, setGradesDataFromApi] = useState<StudentGradesDataFromApi | null>(null);
    // ... (keep other state variables: attendanceData, isLoadingGrades, etc.)
    const [attendanceData, setAttendanceData] = useState<AttendanceSummaryData | null>(null);
    const [isLoadingGrades, setIsLoadingGrades] = useState(true);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
    const [gradesError, setGradesError] = useState<string | null>(null);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);
    const [overallError, setOverallError] = useState<string | null>(null);
    const [isPdfOptionsDialogOpen, setIsPdfOptionsDialogOpen] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('p');
    const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>('a4');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);


    // --- Keep useEffect for fetching data ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingGrades(true); setIsLoadingAttendance(true);
            setGradesError(null); setAttendanceError(null); setOverallError(null);
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) { setOverallError("Autentikasi gagal."); setIsLoadingGrades(false); setIsLoadingAttendance(false); return; }
            try {
                // Use the correct API route for the summary grades
                const gradesPromise = fetch("/api/nilai/summarystudent", { headers: { "Authorization": `Bearer ${accessToken}` }, cache: 'no-store' })
                    .then(async (res) => { console.log(`Nilai - Status: ${res.status}`); if (!res.ok) { const d = await res.json().catch(() => { return { message: res.statusText } }); throw new Error(`Nilai (${res.status}): ${d.message || res.statusText}`); } return res.json(); })
                    .catch(err => { console.error("Fetch Nilai Gagal:", err); setGradesError(err.message); return null; });

                const attendancePromise = fetch("/api/absensi/summarystudent", { headers: { "Authorization": `Bearer ${accessToken}` }, cache: 'no-store' })
                    .then(async (res) => { console.log(`Absensi - Status: ${res.status}`); if (!res.ok) { const d = await res.json().catch(() => { return { message: res.statusText } }); console.error(`Gagal memuat absensi (${res.status}): ${d.message || res.statusText}`); setAttendanceError(`Gagal memuat data (${res.status})`); return null; } return res.json(); })
                    .catch(err => { console.error("Fetch Absensi Gagal:", err); setAttendanceError(err.message); return null; });

                const [fetchedGrades, fetchedAttendance] = await Promise.all([gradesPromise, attendancePromise]);

                // --- Update type assertion ---
                setGradesDataFromApi(fetchedGrades as StudentGradesDataFromApi | null);
                setAttendanceData(fetchedAttendance as AttendanceSummaryData | null);

            } catch (err) { console.error("Gagal fetch data laporan:", err); if (err instanceof Error && err.message.startsWith('Nilai')) { setGradesError(err.message); } else { setOverallError(err instanceof Error ? err.message : "Gagal memuat data laporan."); } }
            finally { setIsLoadingGrades(false); setIsLoadingAttendance(false); }
        };
        fetchData();
    }, []);

    // --- Simplify processedGradeDataForTable ---
    const processedGradeDataForTable = useMemo((): { umumSubjects: SubjectGradeFromApi[], minatSubjects: SubjectGradeFromApi[] } => {
        const umum: SubjectGradeFromApi[] = [];
        const minat: SubjectGradeFromApi[] = [];
        // Directly group subjects from API data
        gradesDataFromApi?.nilai_siswa?.forEach(subjectApi => {
            // No calculation needed here anymore
            if (subjectApi.kategori === 'Wajib') {
                umum.push(subjectApi);
            } else if (subjectApi.kategori === 'Peminatan') {
                minat.push(subjectApi);
            }
            // Optionally handle other categories if they exist
        });
        // Sort alphabetically by name
        umum.sort((a, b) => a.nama.localeCompare(b.nama));
        minat.sort((a, b) => a.nama.localeCompare(b.nama));
        return { umumSubjects: umum, minatSubjects: minat };
    }, [gradesDataFromApi]); // Depend only on the raw API data

    // Student Info //

    const generatePdfDocument = useCallback(
        (
            orientation: PdfOrientation,
            paperSize: PdfPaperSize,
        ): jsPDF | null => {
            const { umumSubjects, minatSubjects } = processedGradeDataForTable;
            const studentInfo = gradesDataFromApi?.siswa_info; // Get student info
            const kelasInfo = gradesDataFromApi?.kelas;
            // Check if there's any subject data at all
            if (
                !gradesDataFromApi?.nilai_siswa ||
                gradesDataFromApi.nilai_siswa.length === 0
            ) {
                toast.error("Data nilai tidak tersedia untuk diunduh.");
                return null;
            }
            const doc = new jsPDF({
                orientation,
                unit: "mm",
                format: paperSize,
            });
            const pageMargin = 15;
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- School Header ---
            let currentY = pageMargin;

            // // Add school logo (Assuming logo.png exists and is valid)
            // const logoWidth = 25;
            // const logoHeight = 25;
            // try {
            //     // Make sure /images/logo.png is accessible from the public folder
            //     doc.addImage(
            //         "/images/logo.png",
            //         "PNG",
            //         pageMargin,
            //         currentY,
            //         logoWidth,
            //         logoHeight,
            //     );
            // } catch (error) {
            //     console.error("Error adding logo image:", error);
            //     // Handle error, maybe draw placeholder text
            //     doc.setTextColor(255, 0, 0);
            //     doc.text("Logo Error", pageMargin, currentY + logoHeight / 2);
            //     doc.setTextColor(0); // Reset color
            // }

            // School name in blue
            doc.setTextColor("#05218E");
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(
                "SEKOLAH KRISTEN NASIONAL ANGLO",
                pageWidth / 2,
                currentY + 5,
                { align: "center" },
            );

            // School levels
            doc.setFontSize(14);
            doc.text("TK – SD – SMP – SMA", pageWidth / 2, currentY + 12, {
                align: "center",
            });

            // School addresses in gray
            doc.setTextColor("#AFB0B5");
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");

            // First address
            doc.text(
                "• Jl. Seruni Raya No.1 Taman Lembah Hijau, Lippo Cikarang - Bekasi",
                pageWidth / 2,
                currentY + 20,
                {
                    align: "center",
                },
            );
            doc.text(
                "Telp. (62-21) 8990 1579 - 83, Fax. (62-21) 8990 1584",
                pageWidth / 2,
                currentY + 24,
                {
                    align: "center",
                },
            );

            // Second address
            doc.text(
                "• Jl. Rawasari Selatan 10 X, Jakarta Pusat",
                pageWidth / 2,
                currentY + 28,
                { align: "center" },
            );
            doc.text(
                "Telp. (62-21) 420 8702, Fax. (62-21) 4280 4424",
                pageWidth / 2,
                currentY + 32,
                { align: "center" },
            );

            // Add separator line
            currentY += 35; // Adjust Y position below the header content
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.line(pageMargin, currentY, pageWidth - pageMargin, currentY);

            // Report title
            doc.setTextColor(0);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            currentY += 10;
            doc.text(
                "Laporan Hasil Belajar Peserta Didik",
                pageWidth / 2,
                currentY,
                { align: "center" },
            );

            // --- Student and class info ---
            // Position this block below the title and separator
            currentY += 10; // Add some space after the title

            const studentName = studentInfo?.nama || "N/A";
            const className = kelasInfo?.nama || "N/A";
            const year = kelasInfo?.tahun_ajaran || "N/A";

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            // ***** CHANGE HERE *****
            // Use pageMargin for the x-coordinate to align left
            doc.text(`Nama: ${studentName}`, pageMargin, currentY);
            currentY += 5; // Move down for the next line
            doc.text(`Kelas: ${className}`, pageMargin, currentY);
            currentY += 5; // Move down for the next line
            doc.text(`Tahun Ajaran: ${year}`, pageMargin, currentY);
            // ***** END CHANGE *****

            currentY += 10; // Add space before the first table

            // Use the same formatScore helper
            const formatScore = (score: number | null): string =>
                score !== null ? score.toFixed(0) : "-";

            // --- Table Rendering Function ---
            const renderSubjectTablePdf = (
                title: string,
                subjects: SubjectGradeFromApi[],
            ) => {
                if (subjects.length === 0) return;
                // Estimate height needed (adjust if necessary)
                const tableHeaderHeight = 7; // Approximate header height
                const tableRowHeight = 7; // Approximate row height
                const tableHeightEstimate =
                    tableHeaderHeight + subjects.length * tableRowHeight + 10; // Add some buffer
                const spaceForAttendance = 40; // Fixed space for attendance table

                // Check if new page needed BEFORE drawing title
                if (
                    currentY + tableHeightEstimate >
                    pageHeight - pageMargin - spaceForAttendance
                ) {
                    doc.addPage();
                    currentY = pageMargin; // Reset Y to top margin on new page
                }

                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0);
                doc.text(title, pageMargin, currentY);
                currentY += 6; // Space between title and table

                autoTable(doc, {
                    head: [
                        ["No", "Mata Pelajaran", "Nilai Pengetahuan", "Nilai Keterampilan"],
                    ],
                    body: subjects.map((subj, index) => [
                        (index + 1).toString(),
                        subj.nama,
                        {
                            content: formatScore(subj.rata_rata_pengetahuan),
                            styles: { halign: "center" },
                        },
                        {
                            content: formatScore(subj.rata_rata_keterampilan),
                            styles: { halign: "center" },
                        },
                    ]),
                    startY: currentY,
                    theme: "grid",
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: 30,
                        fontStyle: "bold",
                        halign: "center",
                        fontSize: 9,
                        cellPadding: 1.8,
                    },
                    bodyStyles: {
                        fontSize: 9,
                        textColor: 40,
                        cellPadding: 1.8,
                        minCellHeight: 6,
                    },
                    columnStyles: {
                        0: { cellWidth: 10, halign: "center" },
                        1: { cellWidth: "auto" },
                        2: { cellWidth: 35, halign: "center" },
                        3: { cellWidth: 35, halign: "center" },
                    },
                    margin: { left: pageMargin, right: pageMargin },
                    didDrawPage: (data) => {
                        // Add page numbers (optional, but good practice)
                        doc.setFontSize(8);
                        doc.setTextColor(150);
                        const pageCount = (doc as any).internal.getNumberOfPages();
                        doc.text(
                            `Halaman ${data.pageNumber} dari ${pageCount}`,
                            data.settings.margin.left,
                            pageHeight - 10, // Position near bottom
                        );
                    },
                });
                // Ensure currentY is updated correctly after the table
                currentY = (doc as any).lastAutoTable.finalY + 10; // Update Y position below the table
            };

            // --- Render Tables ---
            renderSubjectTablePdf("Kelompok Mata Pelajaran Umum", umumSubjects);
            renderSubjectTablePdf("Kelompok Mata Pelajaran Minat", minatSubjects);

            // --- Render Attendance as a Table ---
            if (attendanceData?.rekap_kehadiran) {
                const attendanceTableHeight = 30; // Estimate height
                // Check if new page needed
                if (currentY + attendanceTableHeight > pageHeight - pageMargin) {
                    doc.addPage();
                    currentY = pageMargin;
                }

                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0);
                doc.text("Kehadiran", pageMargin, currentY);
                currentY += 6;

                // Get attendance values with defaults of 0
                const sakitValue = (
                    attendanceData.rekap_kehadiran.Sakit ?? 0
                ).toString();
                const izinValue = (
                    attendanceData.rekap_kehadiran.Izin ?? 0
                ).toString();
                const alfaValue = (
                    attendanceData.rekap_kehadiran.Alfa ?? 0
                ).toString();

                // Create attendance table
                autoTable(doc, {
                    body: [
                        [
                            { content: "Sakit", styles: { fontStyle: "bold" } },
                            { content: `${sakitValue} hari`, styles: { halign: "right" } },
                        ],
                        [
                            { content: "Izin", styles: { fontStyle: "bold" } },
                            { content: `${izinValue} hari`, styles: { halign: "right" } },
                        ],
                        [
                            { content: "Tanpa Keterangan", styles: { fontStyle: "bold" } },
                            { content: `${alfaValue} hari`, styles: { halign: "right" } },
                        ],
                    ],
                    startY: currentY,
                    theme: "grid", // Or 'plain' if you don't want borders
                    styles: { cellPadding: 1 }, // Reduce padding if needed
                    bodyStyles: {
                        fontSize: 9,
                        textColor: 40,
                        cellPadding: 1.8,
                        minCellHeight: 6,
                    },
                    columnStyles: {
                        0: { cellWidth: "auto", fontStyle: "bold" }, // Make label bold
                        1: { cellWidth: 40, halign: "right" }, // Align value right
                    },
                    margin: { left: pageMargin, right: pageWidth - pageMargin - 80 }, // Limit width
                    tableWidth: 80, // Set an explicit width for the attendance table
                });

                currentY = (doc as any).lastAutoTable.finalY + 10;
            } else if (attendanceError) {
                // Handle attendance error display
                const errorTextHeight = 10;
                if (currentY + errorTextHeight > pageHeight - pageMargin) {
                    doc.addPage();
                    currentY = pageMargin;
                }
                doc.setFontSize(10);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(150);
                doc.text(`Data kehadiran gagal dimuat.`, pageMargin, currentY);
                currentY += 5;
            }

            // --- Add Signature Area (Example) ---
            const signatureAreaHeight = 40;
            if (currentY + signatureAreaHeight > pageHeight - pageMargin) {
                doc.addPage();
                currentY = pageMargin;
            }

            // Position signature block towards the right
            const signatureX = pageWidth - pageMargin - 60; // Adjust width (60mm) as needed
            currentY += 20; // Space before signature

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);

            // You might want another signature block for the teacher/principal on the left

            return doc;
        },
        [
            gradesDataFromApi,
            attendanceData,
            processedGradeDataForTable,
            attendanceError,
        ], // Add dependencies
    );
    // --- Keep handleGeneratePreview and handleActualDownload as they were ---
    // They now rely on generatePdfDocument using the correct data
    const handleGeneratePreview = useCallback(async () => {
        if (!gradesDataFromApi || !isPdfOptionsDialogOpen) { setPdfPreviewUrl(null); return; } setIsPreviewLoading(true); setPdfPreviewUrl(null);
        await new Promise(resolve => setTimeout(resolve, 50));
        try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { setPdfPreviewUrl(doc.output('datauristring')); } else { throw new Error("Gagal membuat PDF."); } }
        catch (pdfError) { console.error("[PDF Preview] Error:", pdfError); toast.error("Gagal pratinjau PDF."); setPdfPreviewUrl(null); } finally { setIsPreviewLoading(false); }
    }, [gradesDataFromApi, pdfOrientation, pdfPaperSize, generatePdfDocument, isPdfOptionsDialogOpen]);

    useEffect(() => { if (isPdfOptionsDialogOpen) { handleGeneratePreview(); } else { setPdfPreviewUrl(null); } }, [pdfOrientation, pdfPaperSize, isPdfOptionsDialogOpen, handleGeneratePreview]);

    const handleActualDownload = useCallback(() => {
        if (!gradesDataFromApi?.nilai_siswa || gradesDataFromApi.nilai_siswa.length === 0) { toast.warning("Data nilai belum dimuat atau kosong."); return; } setIsDownloadingPdf(true);
        setTimeout(() => {
            try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { const cN = gradesDataFromApi.kelas?.nama?.replace(/\s+/g, '_') || 'kls'; const dT = new Date().toISOString().slice(0, 10); doc.save(`Laporan_Nilai_${cN}_${dT}_${pdfOrientation}_${pdfPaperSize}.pdf`); toast.success("Unduhan dimulai..."); setIsPdfOptionsDialogOpen(false); } else { throw new Error("Gagal membuat PDF."); } }
            catch (pdfError) { console.error("[PDF Download] Error:", pdfError); toast.error(`Gagal unduh PDF: ${pdfError instanceof Error ? pdfError.message : 'Error'}`); } finally { setIsDownloadingPdf(false); }
        }, 50);
    }, [gradesDataFromApi, pdfOrientation, pdfPaperSize, generatePdfDocument]);


    const isLoading = isLoadingGrades || isLoadingAttendance;

    // --- Keep the main JSX structure ---
    return (
        <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 space-y-6">
            {/* === CORRECTED HEADER STRUCTURE === */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2 gap-x-4 mb-4"> {/* Added mb-4 for spacing */}
                {/* Left side: Title and Class Info */}
                <div className="flex-1 min-w-0 space-y-1"> {/* Allow shrinking and add space between title/subtitle */}
                    <h1 className="text-2xl font-bold truncate">Laporan Nilai & Kehadiran</h1>
                    {/* Display class info only if available */}
                    {gradesDataFromApi?.kelas && (
                        <p className="text-sm text-muted-foreground truncate">
                            Kelas: {gradesDataFromApi.kelas.nama} |
                            Tahun Ajaran: {gradesDataFromApi.kelas.tahun_ajaran} |
                            Angkatan: {gradesDataFromApi.kelas.angkatan ?? 'N/A'}
                        </p>
                    )}
                </div>

                {/* Right side: Download Button/Dialog */}
                {/* Ensure DialogTrigger and content are correctly placed */}
                <Dialog open={isPdfOptionsDialogOpen} onOpenChange={(open) => { setIsPdfOptionsDialogOpen(open); if (!open) setPdfPreviewUrl(null); }}>
                    <DialogTrigger asChild>
                        <Button
                            variant="secondary"
                            disabled={isLoadingGrades || !gradesDataFromApi?.nilai_siswa || gradesDataFromApi.nilai_siswa.length === 0}
                            className="flex-shrink-0" // Prevent button from shrinking too much
                        >
                            <Download className="mr-2 h-4 w-4" /> Unduh PDF
                        </Button>
                    </DialogTrigger>
                    {/* PDF Dialog Content */}
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader> <DialogTitle>Opsi Unduh PDF</DialogTitle> <DialogDescription>Pilih orientasi dan ukuran kertas.</DialogDescription> </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                            {/* PDF Options */}
                            <div className="space-y-4 md:col-span-1">
                                <div> <Label className="text-sm font-medium">Orientasi</Label> <RadioGroup value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as PdfOrientation)} className="mt-2 grid grid-cols-2 gap-2"> <div><RadioGroupItem value="p" id="pdf-p" className="peer sr-only" /><Label htmlFor="pdf-p" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"><GalleryHorizontal size={16} className='mr-1.5' /> Potrait</Label></div> <div><RadioGroupItem value="l" id="pdf-l" className="peer sr-only" /><Label htmlFor="pdf-l" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"><GalleryVertical size={16} className='mr-1.5' /> Lanskap</Label></div> </RadioGroup> </div>
                                <div> <Label htmlFor="pdf-paper-size" className="text-sm font-medium">Ukuran Kertas</Label> <Select value={pdfPaperSize} onValueChange={(v) => setPdfPaperSize(v as PdfPaperSize)}> <SelectTrigger id="pdf-paper-size" className="w-full mt-2"><SelectValue placeholder="Pilih..." /></SelectTrigger> <SelectContent> <SelectItem value="a4">A4</SelectItem> <SelectItem value="letter">Letter</SelectItem> <SelectItem value="legal">Legal</SelectItem> </SelectContent> </Select> </div>
                                <div className='pt-4'> <Button onClick={handleActualDownload} disabled={isDownloadingPdf || isPreviewLoading || !pdfPreviewUrl} className="w-full">{isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF Sekarang'}</Button> </div>
                            </div>
                            {/* PDF Preview */}
                            <div className="md:col-span-2 border rounded-md bg-muted/30 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                                {isPreviewLoading && (<div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className='text-sm text-muted-foreground mt-2'>Memuat pratinjau...</p></div>)}
                                {pdfPreviewUrl ? (<iframe src={pdfPreviewUrl} className="w-full h-[500px] md:h-[600px]" title="Pratinjau PDF" />) : !isPreviewLoading ? (<div className="text-center text-muted-foreground p-4"><p>Pratinjau PDF akan muncul di sini.</p><p className='text-xs mt-1'>(Ubah opsi untuk memuat ulang)</p></div>) : null}
                            </div>
                        </div>
                        <DialogFooter className="mt-4"> <DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose> </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            {/* === END CORRECTED HEADER STRUCTURE === */}


            {/* Error & Loading */}
            {overallError && (<Card className="border-destructive bg-destructive/10 text-destructive"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>{overallError}</p></CardContent></Card>)}
            {isLoading && !overallError && (<div className="flex justify-center items-center py-10 min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Memuat data...</span></div>)}

            {/* Main Content */}
            {!isLoading && !overallError && (
                <div className="space-y-6">
                    {/* Grades Section */}
                    {!gradesError ? (
                        <>
                            {(processedGradeDataForTable.umumSubjects.length > 0 || processedGradeDataForTable.minatSubjects.length > 0) ? (
                                <>
                                    <SubjectGradesTable title="Kelompok Mata Pelajaran Umum" subjects={processedGradeDataForTable.umumSubjects} />
                                    <SubjectGradesTable title="Kelompok Mata Pelajaran Minat" subjects={processedGradeDataForTable.minatSubjects} />
                                </>
                            ) : !isLoadingGrades ? (
                                <Card><CardHeader><CardTitle className="text-lg">Nilai Mata Pelajaran</CardTitle></CardHeader><CardContent><p className="text-center text-muted-foreground py-5">Tidak ada data nilai.</p></CardContent></Card>
                            ) : null}
                        </>
                    ) : (<Card className="border-destructive bg-destructive/10 text-destructive"><CardHeader><CardTitle className="text-lg">Error Memuat Nilai</CardTitle></CardHeader><CardContent><p>{gradesError}</p></CardContent></Card>)}

                    {/* Attendance Section */}
                    <AttendanceSummaryTable data={attendanceData} isLoading={isLoadingAttendance} error={attendanceError} />
                </div>
            )}
        </div>
    );
}
