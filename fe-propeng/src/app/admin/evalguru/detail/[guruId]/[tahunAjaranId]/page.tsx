'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Diperlukan untuk Dialog PDF
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Diperlukan untuk Dialog PDF
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Diperlukan untuk Dialog PDF
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog"; // Diperlukan untuk Dialog PDF
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardIcon, ListBulletIcon, StarIcon, ReaderIcon, GearIcon, CheckCircledIcon, ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { BookDown, ChevronDown, Download, Mail, Loader2, GalleryHorizontal, GalleryVertical } from "lucide-react"; // Tambahkan Loader2, GalleryHorizontal, GalleryVertical
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import jsPDF from 'jspdf'; // Import jsPDF
import autoTable, { RowInput } from 'jspdf-autotable'; // Import autoTable

// --- Tipe Data untuk PDF ---
type PdfOrientation = 'p' | 'l';
type PdfPaperSize = 'a4' | 'letter' | 'legal';


// --- Static mappings ---
const variabelDisplayNames: { [key: string]: string } = {
    "1": "Materi Pelajaran",
    "2": "Proses Pembelajaran",
    "3": "Sikap dan Kepribadian Guru",
    "4": "Evaluasi Pembelajaran"
};

const variabelIcons: { [key: string]: React.ElementType } = {
    "1": ReaderIcon,
    "2": GearIcon,
    "3": ListBulletIcon,
    "4": StarIcon,
};

const detailedIndikatorQuestionMap: { [variableId: string]: { [indicatorKey: string]: string } } = {

//   "1": { 
//     "Indikator 1": "MP_Q1: Guru menyampaikan rancangan pengajaran dengan jelas di awal semester.",
//     "Indikator 2": "MP_Q2: Guru menyediakan berbagai sumber pembelajaran yang memudahkan saya memahami materi.",
//     "Indikator 3": "MP_Q3: Materi yang diajarkan relevan dengan tujuan pembelajaran.",
//     "Indikator 4": "MP_Q4: Guru menguasai materi pelajaran yang diajarkan.",
//     "Indikator 5": "MP_Q5: Materi pelajaran disajikan secara sistematis dan mudah dipahami.",
//   },
  "1": { 
    "Indikator 1": "Guru menyampaikan rancangan pengajaran dengan jelas di awal semester",
    "Indikator 2": "Tersedia berbagai sumber pembelajaran yang memudahkan saya memahami materi.",
  },
//   "2": { 
//     "Indikator 1": "PP_Q1: Guru memulai dan mengakhiri pembelajaran tepat waktu.",
//     "Indikator 2": "PP_Q2: Guru menggunakan metode pembelajaran yang bervariasi dan menarik.",
//     "Indikator 3": "PP_Q3: Guru mendorong partisipasi aktif siswa dalam pembelajaran.",
//     "Indikator 4": "PP_Q4: Guru memberikan penjelasan yang jelas dan mudah dimengerti.",
//     "Indikator 5": "PP_Q5: Guru menggunakan media pembelajaran yang efektif.",
//   },
  "2": { 
    "Indikator 1": "Guru menyampaikan materi pelajaran dengan cara yang mudah dipahami.",
    "Indikator 2": "Guru menciptakan suasana kelas yang kondusif untuk belajar.",
    "Indikator 3": "Guru memberikan contoh yang membantu memahami konsep yang sulit.",
    "Indikator 4": "Guru menjawab pertanyaan siswa dengan jelas.",
    "Indikator 5": "Guru membantu siswa yang kesulitan dengan memberikan umpan balik yang konstruktif.",
    "Indikator 6": "Guru menggunakan metode pengajaran yang bervariasi dan menarik.",
    "Indikator 7": "Guru mendorong siswa untuk berpikir kritis dan mengembangkan kemampuan analitis.",
    "Indikator 8": "Guru menerima kritik dan saran dari siswa.",
  },
//   "3": { 
//     "Indikator 1": "PK_Q1: Guru menciptakan suasana kelas yang aman dan nyaman.",
//     "Indikator 2": "PK_Q2: Guru mengelola waktu pembelajaran di kelas secara efisien.",
//     "Indikator 3": "PK_Q3: Guru menegakkan aturan kelas secara adil dan konsisten.",
//     "Indikator 4": "PK_Q4: Guru mampu mengatasi gangguan belajar di kelas dengan baik.",
//     "Indikator 5": "PK_Q5: Guru memperhatikan semua siswa secara merata.",
//   },
  "3": { 
    "Indikator 1": "Guru menunjukkan sikap menghargai dan sopan terhadap siswa.",
    "Indikator 2": "Sikap dan Kepribadian Guru",
  },
//   "4": { 
//     "Indikator 1": "EP_Q1: Guru memberikan informasi yang jelas mengenai sistem penilaian.",
//     "Indikator 2": "EP_Q2: Soal atau tugas evaluasi sesuai dengan materi yang diajarkan.",
//     "Indikator 3": "EP_Q3: Guru melakukan penilaian secara objektif dan adil.",
//     "Indikator 4": "EP_Q4: Guru memberikan hasil evaluasi tepat waktu.",
//     "Indikator 5": "EP_Q5: Guru memberikan umpan balik yang jelas atas hasil evaluasi.",
//   },
  "4": { 
    "Indikator 1": "Materi penilaian (kuis, tugas, UTS, UAS, dll) sesuai dengan rancangan pengajaran yang disampaikan di awal semester.",
    "Indikator 2": "Bobot penilaian setiap komponen penilaian sesuai dengan beban pengerjaannya.",
    "Indikator 3": "Guru memberikan umpan balik terhadap tugas dan evaluasi.",
  }
};
// --- End of static mappings ---

const renderScore = (scoreString: string) => {
    if (!scoreString || !scoreString.includes('/') || scoreString.trim() === "- / 5.00" || scoreString.trim() === "-") {
        return <span className="text-muted-foreground">{scoreString || "-"}</span>;
    }

    const parts = scoreString.split('/');
    const scoreValueStr = parts[0].trim();
    const numericScore = parseFloat(scoreValueStr);

    let valueColorClass = "font-semibold"; // Default jika tidak numerik atau kondisi tidak terpenuhi

    if (!isNaN(numericScore)) {
        if (numericScore >= 4.0) {
            valueColorClass = "text-green-600 dark:text-green-400 font-semibold";
        } else if (numericScore >= 2.0) { // Skor antara 2.0 dan 3.99
            valueColorClass = "text-orange-500 dark:text-orange-400 font-semibold";
        } else { // Skor di bawah 2.0
            valueColorClass = "text-red-600 dark:text-red-400 font-semibold";
        }
    } else if (scoreValueStr === "-") {
         valueColorClass = "text-muted-foreground font-normal"; // Atau class lain untuk strip
    }


    return (
        <>
            <span className={valueColorClass}>{scoreValueStr}</span>
            <span className="text-muted-foreground"> / {parts[1] ? parts[1].trim() : "5.00"}</span>
        </>
    );
};

interface ParticipationChipDisplayProps {
  pengisi?: number;
  totalSiswa?: number;
  className?: string;
}
const ParticipationChip: React.FC<ParticipationChipDisplayProps> = ({ pengisi, totalSiswa, className }) => {
  if (typeof pengisi !== 'number' || typeof totalSiswa !== 'number' || totalSiswa === 0) {
    return (<div className={cn("mt-1.5", className)}><Badge variant="outline" className="text-xs px-2 py-0.5 border-dashed text-muted-foreground"><InfoCircledIcon className="mr-1 h-3 w-3" /> Partisipasi N/A</Badge></div>);
  }
  const percentage = (pengisi / totalSiswa) * 100;
  const roundedPercentage = Math.round(percentage);
  let colorClasses = ""; let chipText = `${roundedPercentage}% Partisipasi`; let IconComponent: React.ElementType | null = null;
  if (roundedPercentage < 50) { colorClasses = "bg-red-100 text-red-700 border-red-200 hover:bg-red-100/90 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"; chipText = `${roundedPercentage}% Partisipasi Rendah`; IconComponent = ExclamationTriangleIcon;
  } else if (roundedPercentage < 100) { colorClasses = "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100/90 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600"; IconComponent = InfoCircledIcon;
  } else { colorClasses = "bg-green-100 text-green-700 border-green-200 hover:bg-green-100/90 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600"; chipText = `${roundedPercentage}% Partisipasi Lengkap`; IconComponent = CheckCircledIcon; }
  return (<div className={cn("mt-1.5", className)}><Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-medium", colorClasses)}>{IconComponent && <IconComponent className="mr-1 h-3 w-3" />}{chipText}</Badge></div>);
};

export default function DetailEvaluasiGuruPage() {
    const params = useParams();
    const router = useRouter();
    const guruId = params.guruId as string;
    const tahunAjaranId = params.tahunAjaranId as string;
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- State untuk PDF ---
    const [isPdfOptionsDialogOpen, setIsPdfOptionsDialogOpen] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('p');
    const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>('a4');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    // --- End State untuk PDF ---

    const fetchDetailEvaluasi = useCallback(async () => {
        // ... (fetch logic sama seperti sebelumnya)
        if (!guruId || !tahunAjaranId) {
            setError("ID Guru atau Tahun Ajaran tidak valid."); setIsLoading(false); return;
        }
        setIsLoading(true); setError(null);
        try {
            const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!accessToken) {
                setError("Token otentikasi tidak ditemukan."); setIsLoading(false); toast.error("Sesi tidak valid."); return;
            }
            const fetchUrl = `/api/evalguru/admin/detail-tahunan?guru_id=${guruId}&tahun_ajaran_id=${tahunAjaranId}`;
            const response = await fetch(fetchUrl, { method: "GET", headers: { "Authorization": `Bearer ${accessToken}` }, cache: 'no-store' });
            const rawData = await response.json();
            if (!response.ok) throw new Error(rawData.message || `Gagal memuat data (Status: ${response.status})`);
            if (rawData.status !== 200 || !rawData.info_konteks || !Array.isArray(rawData.evaluasi_per_matapelajaran)) {
                throw new Error(rawData.message || "Format data tidak sesuai.");
            }
            setData(rawData);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Kesalahan tidak diketahui.";
            setError(msg); toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [guruId, tahunAjaranId, router]);

    useEffect(() => { fetchDetailEvaluasi(); }, [fetchDetailEvaluasi]);

    // --- Fungsi Generate PDF ---
    const generateTeacherEvaluationPdf = useCallback((
        dataKeseluruhan: any,
        infoKonteks: any,
        orientation: PdfOrientation,
        paperSize: PdfPaperSize
    ): jsPDF | null => {
        if (!dataKeseluruhan || !infoKonteks) {
            toast.error("Data evaluasi tidak lengkap untuk membuat PDF.");
            return null;
        }

        const doc = new jsPDF({ orientation, unit: 'mm', format: paperSize });
        const pageMargin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = pageMargin;
        const lineHeight = 7;
        const smallLineHeight = 5;
        const schoolName = "SMA Kristen Anglo"; // Ganti dengan nama sekolah

        doc.setFontSize(16); doc.setFont("helvetica", "bold");
        doc.text("Laporan Evaluasi Guru Tahunan", pageWidth / 2, currentY, { align: 'center' });
        currentY += lineHeight * 1.5;

        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        const addHeaderInfo = (label: string, value: string | undefined) => {
            if (currentY > pageHeight - pageMargin) { doc.addPage(); currentY = pageMargin; }
            doc.text(label, pageMargin, currentY);
            doc.text(`: ${value || 'N/A'}`, pageMargin + 40, currentY);
            currentY += smallLineHeight;
        };
        addHeaderInfo("Nama Sekolah", schoolName);
        addHeaderInfo("Nama Guru", infoKonteks.nama_guru);
        addHeaderInfo("NISP", infoKonteks.nisp);
        const taDisplay = infoKonteks.tahun_ajaran ? `${infoKonteks.tahun_ajaran}/${parseInt(infoKonteks.tahun_ajaran) + 1}` : 'N/A';
        addHeaderInfo("Tahun Ajaran", taDisplay);
        currentY += lineHeight * 0.5;

        const variables = dataKeseluruhan.detail_skor_rata_rata_per_indikator_gabungan;
        if (variables && Array.isArray(variables)) {
            variables.forEach((variableData: any) => {
                const variableId = String(variableData.variabel_id);
                const variableName = variabelDisplayNames[variableId] || `Variabel ${variableId}`;
                const variableAverageScore = dataKeseluruhan.ringkasan_skor_rata_rata_per_variabel_gabungan?.[variableId] || "- / 5.00";

                if (currentY > pageHeight - pageMargin - 30) { doc.addPage(); currentY = pageMargin; }

                doc.setFontSize(11); doc.setFont("helvetica", "bold");
                doc.text(variableName, pageMargin, currentY);
                currentY += lineHeight * 0.8;

                const tableHead: RowInput[] = [[
                    { content: 'Indikator Penilaian', styles: { fontStyle: 'bold', cellPadding: 1.5 } },
                    { content: 'Skor', styles: { fontStyle: 'bold', halign: 'right', cellPadding: 1.5 } }
                ]];
                const tableBody: RowInput[] = [];
                const allIndicatorEntries = Object.entries(variableData).filter(([key]) => key.startsWith("Indikator "));
                const visibleIndicatorEntries = allIndicatorEntries.filter(([indicatorJsonKey]) =>
                    detailedIndikatorQuestionMap[variableId] && detailedIndikatorQuestionMap[variableId].hasOwnProperty(indicatorJsonKey)
                );

                visibleIndicatorEntries.forEach(([indicatorJsonKey, scoreValue]) => {
                    const questionText = detailedIndikatorQuestionMap[variableId]![indicatorJsonKey];
                    tableBody.push([
                        { content: doc.splitTextToSize(questionText, pageWidth - pageMargin * 2 - 30), styles: { cellPadding: 1.5, fontSize: 9 } },
                        { content: String(scoreValue), styles: { halign: 'right', cellPadding: 1.5, fontSize: 9 } }
                    ]);
                });

                if (tableBody.length > 0) {
                    autoTable(doc, {
                        head: tableHead, body: tableBody, startY: currentY, theme: 'grid',
                        headStyles: { fillColor: [240, 240, 240], textColor: 50, fontSize: 9.5, cellPadding: 1.5 },
                        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 25, halign: 'right' } },
                    });
                    currentY = (doc as any).lastAutoTable.finalY + smallLineHeight;
                } else {
                    doc.setFontSize(9); doc.setFont("helvetica", "italic");
                    doc.text("Tidak ada indikator untuk variabel ini.", pageMargin + 5, currentY); currentY += smallLineHeight;
                }

                doc.setFontSize(9.5); doc.setFont("helvetica", "bolditalic");
                doc.text(`Rata-Rata ${variableName}`, pageMargin, currentY);
                doc.text(variableAverageScore, pageWidth - pageMargin, currentY, { align: 'right' });
                currentY += lineHeight * 1.5;
            });
        }

        if (dataKeseluruhan.skor_grand_total_dari_variabel_gabungan) {
            if (currentY > pageHeight - pageMargin - 20) { doc.addPage(); currentY = pageMargin; }
            doc.setFontSize(11); doc.setFont("helvetica", "bold");
            doc.text("Skor Rata-Rata Keseluruhan Guru:", pageMargin, currentY);
            doc.text(dataKeseluruhan.skor_grand_total_dari_variabel_gabungan, pageWidth - pageMargin, currentY, { align: 'right' });
            currentY += lineHeight * 2;
        }

        const kritikSaran = dataKeseluruhan.daftar_kritik_saran_gabungan;
        if (kritikSaran && Array.isArray(kritikSaran) && kritikSaran.length > 0 && !(kritikSaran.length === 1 && kritikSaran[0].includes("Tidak ada kritik"))) {
            if (currentY > pageHeight - pageMargin - 30) { doc.addPage(); currentY = pageMargin; }
            doc.setFontSize(11); doc.setFont("helvetica", "bold");
            doc.text("Kritik dan Saran Gabungan:", pageMargin, currentY); currentY += lineHeight;
            doc.setFontSize(9); doc.setFont("helvetica", "normal");
            kritikSaran.forEach((kritik: string) => {
                if (currentY > pageHeight - pageMargin - 15) { doc.addPage(); currentY = pageMargin; }
                const splitText = doc.splitTextToSize(`• ${kritik}`, pageWidth - pageMargin * 2 - 5);
                doc.text(splitText, pageMargin + 5, currentY);
                currentY += (splitText.length * smallLineHeight) + (smallLineHeight * 0.5);
            });
        }

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8); doc.setTextColor(150);
            doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - pageMargin, pageHeight - 10, { align: 'right' });
        }
        return doc;
    }, []);
    // --- End Fungsi Generate PDF ---

    // --- Handler untuk PDF ---
    const handleGeneratePreview = useCallback(async () => {
        if (!data?.evaluasi_keseluruhan_rerata || !data?.info_konteks || !isPdfOptionsDialogOpen) {
            setPdfPreviewUrl(null); return;
        }
        setIsPreviewLoading(true); setPdfPreviewUrl(null);
        await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to update
        try {
            const doc = generateTeacherEvaluationPdf(data.evaluasi_keseluruhan_rerata, data.info_konteks, pdfOrientation, pdfPaperSize);
            if (doc) { setPdfPreviewUrl(doc.output('datauristring')); }
            else { throw new Error("Gagal membuat dokumen PDF."); }
        } catch (err) {
            toast.error("Gagal membuat pratinjau PDF."); setPdfPreviewUrl(null);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [data, pdfOrientation, pdfPaperSize, generateTeacherEvaluationPdf, isPdfOptionsDialogOpen]);

    useEffect(() => {
        if (isPdfOptionsDialogOpen) { handleGeneratePreview(); }
         else { setPdfPreviewUrl(null); }
    }, [pdfOrientation, pdfPaperSize, isPdfOptionsDialogOpen, handleGeneratePreview]);

    const handleActualDownload = useCallback(() => {
        if (!data?.evaluasi_keseluruhan_rerata || !data?.info_konteks) {
            toast.error("Data evaluasi belum dimuat."); return;
        }
        setIsDownloadingPdf(true);
        setTimeout(() => {
            try {
                const doc = generateTeacherEvaluationPdf(data.evaluasi_keseluruhan_rerata, data.info_konteks, pdfOrientation, pdfPaperSize);
                if (doc) {
                    const teacherNameSafe = data.info_konteks.nama_guru?.replace(/[^a-zA-Z0-9]/g, '_') || 'Guru';
                    const timestamp = new Date().toISOString().slice(0,10);
                    doc.save(`Laporan_Evaluasi_${teacherNameSafe}_${timestamp}.pdf`);
                    toast.success("Unduhan PDF dimulai...");
                    setIsPdfOptionsDialogOpen(false);
                } else { throw new Error("Gagal membuat dokumen PDF."); }
            } catch (err) { toast.error("Gagal mengunduh PDF.");
            } finally { setIsDownloadingPdf(false); }
        }, 50);
    }, [data, pdfOrientation, pdfPaperSize, generateTeacherEvaluationPdf]);
    // --- End Handler untuk PDF ---


    if (isLoading) return <div className="container mx-auto p-4 text-center">Memuat data evaluasi...</div>;
    if (error) return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
    if (!data) return <div className="container mx-auto p-4 text-center">Data tidak ditemukan.</div>;

    const { info_konteks, evaluasi_per_matapelajaran, evaluasi_keseluruhan_rerata } = data;
    const tahunAjaranDisplay = info_konteks?.tahun_ajaran;
    const parsedTA = tahunAjaranDisplay ? parseInt(tahunAjaranDisplay) : NaN;
    const nextTADisplay = !isNaN(parsedTA) ? (parsedTA + 1).toString() : 'N/A';
    const mapelOptions = evaluasi_per_matapelajaran.map((item: any) => ({
        label: item.nama_matapelajaran, value: item.matapelajaran_id.toString(),
    })) || [];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-x-6 gap-y-3">
                <div className='space-y-1'>
                    <h2 className="text-xl font-semibold">Data Evaluasi Guru Tahunan</h2>
                    {info_konteks && (
                        <div className="pt-4 text-sm">
                            <p className="pb-1"><strong>Nama Guru:</strong> {info_konteks.nama_guru || "N/A"}</p>
                            <p className="pb-1 text-muted-foreground"><strong>NISP:</strong> {info_konteks.nisp || "N/A"}</p>
                            {(info_konteks.daftar_matapelajaran_diajar?.length > 0 && !info_konteks.daftar_matapelajaran_diajar.includes("Tidak ada mata pelajaran dengan evaluasi untuk tahun ini.")) ? (
                                <p className="pb-1 text-muted-foreground"><strong>Mapel Terevaluasi:</strong> {info_konteks.daftar_matapelajaran_diajar.join(', ')}</p>
                            ) : (<p className="pb-1 text-muted-foreground">Tidak ada mapel terevaluasi.</p>)}
                            <p className="pb-1 text-muted-foreground"><strong>T.A.:</strong> {tahunAjaranDisplay ?? 'N/A'} / {nextTADisplay}</p>
                        </div>
                    )}
                </div>
                <div className='flex items-center gap-2 flex-shrink-0 self-start pt-1'>
                    {/* Tombol Unduh PDF dengan Dialog */}
                    <Dialog open={isPdfOptionsDialogOpen} onOpenChange={(open) => { setIsPdfOptionsDialogOpen(open); if (!open) setPdfPreviewUrl(null); }}>
                        <DialogTrigger asChild>
                            <Button variant="secondary"><Download className="mr-2 h-4 w-4" /> Unduh PDF</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Opsi Unduh PDF Laporan Evaluasi</DialogTitle>
                                <DialogDescription>Pilih orientasi dan ukuran kertas untuk laporan evaluasi guru.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                                <div className="space-y-4 md:col-span-1">
                                    <div>
                                        <Label className="text-sm font-medium">Orientasi</Label>
                                        <RadioGroup value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as PdfOrientation)} className="mt-2 grid grid-cols-2 gap-2">
                                            {[ {value: 'p', label: 'Potrait', icon: GalleryHorizontal}, {value: 'l', label: 'Lanskap', icon: GalleryVertical} ].map(opt => {
                                                const Icon = opt.icon;
                                                return (<div key={opt.value}><RadioGroupItem value={opt.value} id={`pdf-${opt.value}`} className="peer sr-only" /><Label htmlFor={`pdf-${opt.value}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"><Icon size={16} className='mr-2 text-primary'/> {opt.label}</Label></div>);
                                            })}
                                        </RadioGroup>
                                    </div>
                                    <div>
                                        <Label htmlFor="pdf-paper-size" className="text-sm font-medium">Ukuran Kertas</Label>
                                        <Select value={pdfPaperSize} onValueChange={(v) => setPdfPaperSize(v as PdfPaperSize)}>
                                            <SelectTrigger id="pdf-paper-size" className="w-full mt-2"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                            <SelectContent><SelectItem value="a4">A4</SelectItem><SelectItem value="letter">Letter</SelectItem><SelectItem value="legal">Legal</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className='pt-4'>
                                        <Button onClick={handleActualDownload} disabled={isDownloadingPdf || isPreviewLoading} className="w-full">{isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh PDF Sekarang</Button>
                                    </div>
                                </div>
                                <div className="md:col-span-2 border rounded-md bg-muted/30 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                                    {isPreviewLoading && (<div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}
                                    {pdfPreviewUrl ? (<iframe src={pdfPreviewUrl} className="w-full h-[500px] md:h-[600px]" title="Pratinjau PDF" />)
                                    : (<div className="text-center text-muted-foreground p-4"><p>Pratinjau PDF akan muncul di sini...</p>{!isPreviewLoading && <p className='text-xs mt-1'>(Mengubah opsi akan memuat ulang)</p>}</div>)}
                                </div>
                            </div>
                            <DialogFooter className="mt-4"><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>


            <Tabs defaultValue="ringkasan" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-8 bg-white dark:bg-slate-900 border-0 p-0">
                    <TabsTrigger value="ringkasan" className={cn("flex items-center justify-center rounded-md border-2 border-muted p-3", "hover:bg-white hover:text-accent-foreground dark:hover:bg-slate-800", "data-[state=active]:border-primary data-[state=active]:text-accent-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-primary", "focus-visible:ring-0 focus-visible:ring-offset-0", "text-sm font-medium bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400")}>
                        <DashboardIcon className="mr-2 h-4 w-4 text-primary" /> Ringkasan Evaluasi
                    </TabsTrigger>
                    <TabsTrigger value="detailevaluasi" className={cn("flex items-center justify-center rounded-md border-2 border-muted p-3", "hover:bg-white hover:text-accent-foreground dark:hover:bg-slate-800", "data-[state=active]:border-primary data-[state=active]:text-accent-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-primary", "focus-visible:ring-0 focus-visible:ring-offset-0", "text-sm font-medium bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400")}>
                        <BookDown className="mr-2 h-4 w-4 text-primary" /> Detail per Mapel
                    </TabsTrigger>
                    <TabsTrigger value="kritikdansaran" className={cn("flex items-center justify-center rounded-md border-2 border-muted p-3", "hover:bg-white hover:text-accent-foreground dark:hover:bg-slate-800", "data-[state=active]:border-primary data-[state=active]:text-accent-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-primary", "focus-visible:ring-0 focus-visible:ring-offset-0", "text-sm font-medium bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400")}>
                        <Mail className="mr-2 h-4 w-4 text-primary" /> Kritik dan Saran
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ringkasan"><div className="bg-card p-0 rounded-lg"><RingkasanEvaluasiGuru dataKeseluruhan={evaluasi_keseluruhan_rerata} /></div></TabsContent>
                <TabsContent value="detailevaluasi"><div className="bg-card p-0 rounded-lg"><DetailEvaluasiGuru mataPelajaranOptions={mapelOptions} evaluasiData={evaluasi_per_matapelajaran} /></div></TabsContent>
                <TabsContent value="kritikdansaran"><div className="bg-card p-0 rounded-lg"><KritikDanSaranGuru dataKeseluruhan={evaluasi_keseluruhan_rerata} mataPelajaranOptions={mapelOptions} evaluasiData={evaluasi_per_matapelajaran} /></div></TabsContent>
            </Tabs>
        </div>
    );
}

function VariableTabsComponent({ variablesData, summaryData, context }: { variablesData: any[], summaryData: any, context: string }) {
    // ... (VariableTabsComponent unchanged from previous full code)
    if (!variablesData || variablesData.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">Tidak ada variabel penilaian yang tersedia.</div>;
    }
    const defaultTabValue = variablesData[0]?.variabel_id?.toString() || `var-${context}-0`;

    return (
        <Tabs defaultValue={defaultTabValue} className="w-full mt-4">
            <TabsList className="flex flex-wrap sm:flex-nowrap items-stretch justify-start gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-auto overflow-x-auto">
                {variablesData.map((variableData: any) => {
                    const variableId = String(variableData.variabel_id);
                    const variableName = variabelDisplayNames[variableId] || `Variabel ${variableId}`;
                    const IconComponent = variabelIcons[variableId] || ListBulletIcon;
                    return (
                        <TabsTrigger
                            key={`trigger-${context}-${variableId}`}
                            value={variableId}
                            className={cn(
                                "flex-1 sm:flex-auto flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
                                "data-[state=inactive]:text-slate-600 data-[state=inactive]:dark:text-slate-300 data-[state=inactive]:bg-transparent hover:data-[state=inactive]:bg-slate-200 hover:data-[state=inactive]:dark:bg-slate-700"
                            )}
                            style={{ minWidth: '120px' }}
                        >
                            <IconComponent className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-4 sm:w-4" />
                            <span className="truncate">{variableName}</span>
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            {variablesData.map((variableData: any) => {
                const variableId = String(variableData.variabel_id);
                const variableName = variabelDisplayNames[variableId] || `Variabel ${variableId}`;
                const variableAverageScore = summaryData?.[variableId] || "- / 5.00";
                
                const allIndicatorEntries = Object.entries(variableData).filter(([key]) => key.startsWith("Indikator "));
                const visibleIndicatorEntries = allIndicatorEntries.filter(([indicatorJsonKey]) =>
                    detailedIndikatorQuestionMap[variableId] && detailedIndikatorQuestionMap[variableId].hasOwnProperty(indicatorJsonKey)
                );

                return (
                    <TabsContent key={`content-${context}-${variableId}`} value={variableId} className="mt-4">
                        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="px-4 py-3 text-sm font-semibold text-muted-foreground">Indikator Penilaian</TableHead>
                                        <TableHead className="text-right w-[120px] px-4 py-3 text-sm font-semibold text-muted-foreground">Skor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleIndicatorEntries.length > 0 ? visibleIndicatorEntries.map(([indicatorJsonKey, scoreValue]) => {
                                        const questionText = detailedIndikatorQuestionMap[variableId]![indicatorJsonKey]; 
                                        return (
                                            <TableRow key={`ind-${context}-${variableId}-${indicatorJsonKey}`} className="hover:bg-muted/20">
                                                <TableCell className="px-4 py-3 align-top text-sm text-foreground/90">
                                                    {questionText}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right align-top text-sm">
                                                    {renderScore(String(scoreValue))}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow><TableCell colSpan={2} className="text-center h-20 text-muted-foreground">Tidak ada indikator yang ditampilkan.</TableCell></TableRow>
                                    )}
                                    <TableRow className="bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20">
                                        <TableCell className="px-4 py-3 font-semibold italic text-primary/90 text-sm">
                                            Rata-Rata {variableName}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right font-semibold italic text-sm">
                                            {renderScore(variableAverageScore)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                );
            })}
        </Tabs>
    );
}

function RingkasanEvaluasiGuru({ dataKeseluruhan }: { dataKeseluruhan: any }) {
    if (!dataKeseluruhan || dataKeseluruhan.jumlah_form_evaluasi_terisi === 0) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold flex items-center"><DashboardIcon className="mr-2 h-5 w-5 text-primary" /> Ringkasan Evaluasi Gabungan</h4>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow-sm text-center">
                     <p className="text-sm text-muted-foreground">Data ringkasan evaluasi gabungan tidak tersedia atau belum ada evaluasi.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h4 className="text-lg font-semibold flex items-center"><DashboardIcon className="mr-2 h-5 w-5 text-primary" /> Ringkasan Evaluasi Gabungan</h4>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 border rounded-lg shadow-sm bg-card">
                <div>
                    <h3 className="text-xl font-bold text-primary">Gabungan (Semua Mata Pelajaran)</h3>
                    <p className="text-sm text-muted-foreground mt-1">Kelas: {dataKeseluruhan.daftar_kelas_evaluasi_unik_gabungan || 'N/A'}</p>
                    {dataKeseluruhan.skor_grand_total_dari_variabel_gabungan && (
                        <p className="text-md font-semibold mt-2 text-gray-700 dark:text-gray-300">
                            Skor Rata-Rata Total: {renderScore(dataKeseluruhan.skor_grand_total_dari_variabel_gabungan)}
                        </p>
                    )}
                </div>
                <div className="text-left sm:text-right mt-3 sm:mt-0">
                    <div className="flex items-end justify-start sm:justify-end space-x-1">
                        <span className="text-5xl font-bold text-primary leading-none">{dataKeseluruhan.jumlah_form_evaluasi_terisi ?? '0'}</span>
                        <span className="text-3xl font-medium text-muted-foreground leading-none pb-1">/</span>
                        <span className="text-4xl font-medium text-muted-foreground leading-none pb-0.5">{dataKeseluruhan.total_siswa_diajar_di_matapelajaran_terevaluasi ?? '0'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 text-left sm:text-right">Total Siswa Pengisi / Terdaftar</p>
                    <ParticipationChip 
                        pengisi={dataKeseluruhan.jumlah_form_evaluasi_terisi} 
                        totalSiswa={dataKeseluruhan.total_siswa_diajar_di_matapelajaran_terevaluasi}
                        className="sm:justify-end justify-start flex" // Ensure alignment
                    />
                </div>
            </div>
            <VariableTabsComponent
                variablesData={dataKeseluruhan.detail_skor_rata_rata_per_indikator_gabungan}
                summaryData={dataKeseluruhan.ringkasan_skor_rata_rata_per_variabel_gabungan}
                context="ringkasan"
            />
        </div>
    );
}

function DetailEvaluasiGuru({ mataPelajaranOptions, evaluasiData }: { mataPelajaranOptions: Array<{ label: string, value: string }>, evaluasiData: any[] }) {
    const [selectedMapelValue, setSelectedMapelValue] = useState(mataPelajaranOptions?.[0]?.value || "");
    useEffect(() => {
        if (mataPelajaranOptions?.length > 0) {
            if (!selectedMapelValue || !mataPelajaranOptions.some(opt => opt.value === selectedMapelValue)) {
                setSelectedMapelValue(mataPelajaranOptions[0].value);
            }
        } else if (selectedMapelValue) setSelectedMapelValue("");
    }, [mataPelajaranOptions, selectedMapelValue]);

    const currentSelectedLabel = mataPelajaranOptions?.find(opt => opt.value === selectedMapelValue)?.label || "Pilih Mata Pelajaran";
    const selectedMapelDetails = evaluasiData?.find(item => item.matapelajaran_id.toString() === selectedMapelValue);

    if (!mataPelajaranOptions || mataPelajaranOptions.length === 0) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold flex items-center"><BookDown className="mr-2 h-5 w-5 text-primary" /> Detail Evaluasi per Mata Pelajaran</h4>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow-sm text-center">
                    <p className="text-muted-foreground">Tidak ada mata pelajaran yang dievaluasi untuk guru ini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                 <h4 className="text-lg font-semibold flex items-center shrink-0"><BookDown className="mr-2 h-5 w-5 text-primary" /> Detail Evaluasi per Mata Pelajaran</h4>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-9 w-full sm:w-auto min-w-[240px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"><span className="truncate">{currentSelectedLabel}</span><ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                        {mataPelajaranOptions.map(mapel => (<DropdownMenuItem key={mapel.value} onSelect={() => setSelectedMapelValue(mapel.value)}>{mapel.label}</DropdownMenuItem>))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {selectedMapelValue && selectedMapelDetails ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 border rounded-lg shadow-sm bg-card">
                        <div><h3 className="text-xl font-bold text-primary">{selectedMapelDetails.nama_matapelajaran || currentSelectedLabel}</h3><p className="text-sm text-muted-foreground mt-1">Kelas: {selectedMapelDetails.daftar_kelas_evaluasi || 'N/A'}</p></div>
                        <div className="text-left sm:text-right mt-3 sm:mt-0">
                            <div className="flex items-end justify-start sm:justify-end space-x-1">
                                <span className="text-5xl font-bold text-primary leading-none">{selectedMapelDetails.total_pengisi_evaluasi ?? '0'}</span>
                                <span className="text-3xl font-medium text-muted-foreground leading-none pb-1">/</span>
                                <span className="text-4xl font-medium text-muted-foreground leading-none pb-0.5">{selectedMapelDetails.total_siswa_di_matapelajaran ?? '0'}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 text-left sm:text-right">Total Siswa Pengisi / Terdaftar</p>
                            <ParticipationChip 
                                pengisi={selectedMapelDetails.total_pengisi_evaluasi} 
                                totalSiswa={selectedMapelDetails.total_siswa_di_matapelajaran}
                                className="sm:justify-end justify-start flex"
                            />
                        </div>
                    </div>
                    <VariableTabsComponent
                        variablesData={selectedMapelDetails.detail_skor_per_indikator}
                        summaryData={selectedMapelDetails.ringkasan_skor_per_variabel}
                        context={`detail-${selectedMapelDetails.matapelajaran_id}`}
                    />
                </>
            ) : selectedMapelValue ? (
                <div className="mt-4 p-4 border rounded-lg bg-card shadow-sm text-center"><p className="text-muted-foreground">Detail untuk <span className="font-medium">{currentSelectedLabel}</span> tidak ditemukan.</p></div>
            ) : ( <div className="mt-4 p-4 border rounded-lg bg-card shadow-sm text-center"><p className="text-muted-foreground">Pilih mata pelajaran.</p></div>)}
        </div>
    );
}

function KritikDanSaranGuru({ dataKeseluruhan, mataPelajaranOptions, evaluasiData }: { dataKeseluruhan: any, mataPelajaranOptions: Array<{ label: string, value: string }>, evaluasiData: any[] }) {
    const [selectedView, setSelectedView] = useState<'gabungan' | string>(mataPelajaranOptions?.[0]?.value || 'gabungan');
    useEffect(() => {
        if (selectedView !== 'gabungan' && mataPelajaranOptions?.length > 0) {
            if (!mataPelajaranOptions.some(opt => opt.value === selectedView)) setSelectedView(mataPelajaranOptions[0].value);
        } else if ((!mataPelajaranOptions || mataPelajaranOptions.length === 0) && selectedView !== 'gabungan') setSelectedView('gabungan');
    }, [mataPelajaranOptions, selectedView]);

    const currentSelectionLabel = selectedView === 'gabungan' ? "Gabungan (Semua Mata Pelajaran)" : mataPelajaranOptions.find(opt => opt.value === selectedView)?.label || "Pilih Tampilan";
    
    let cardTitle = "Gabungan (Semua Mata Pelajaran)";
    let cardKelas = dataKeseluruhan?.daftar_kelas_evaluasi_unik_gabungan || 'N/A';
    let cardPengisi = dataKeseluruhan?.jumlah_form_evaluasi_terisi;
    let cardTotalSiswa = dataKeseluruhan?.total_siswa_diajar_di_matapelajaran_terevaluasi;

    if (selectedView !== 'gabungan') {
        const selectedMapelDetails = evaluasiData?.find(item => item.matapelajaran_id.toString() === selectedView);
        if (selectedMapelDetails) {
            cardTitle = selectedMapelDetails.nama_matapelajaran || currentSelectionLabel;
            cardKelas = selectedMapelDetails.daftar_kelas_evaluasi || 'N/A';
            cardPengisi = selectedMapelDetails.total_pengisi_evaluasi;
            cardTotalSiswa = selectedMapelDetails.total_siswa_di_matapelajaran;
        } else {
             cardTitle = currentSelectionLabel; 
             cardKelas = 'N/A';
             cardPengisi = undefined; // Set to undefined if no details
             cardTotalSiswa = undefined;
        }
    }
    
    const kritikSaranList = selectedView === 'gabungan' ? (dataKeseluruhan?.daftar_kritik_saran_gabungan || []) : (evaluasiData?.find(item => item.matapelajaran_id.toString() === selectedView)?.daftar_kritik_saran || []);
    const noKritikMessage = selectedView === 'gabungan' ? "Tidak ada kritik/saran gabungan." : `Tidak ada kritik/saran untuk mapel ini.`;

    return (
        <div className="container mx-auto"> {/* Removed p-4 border rounded-lg bg-card shadow-sm to apply to sub-elements */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h4 className="text-lg font-semibold flex items-center"><Mail className="mr-2 h-5 w-5 text-primary" /> Kritik dan Saran</h4>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-9 w-full sm:w-auto min-w-[240px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"><span className="truncate">{currentSelectionLabel}</span><ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuItem onSelect={() => setSelectedView('gabungan')}>Gabungan (Semua Mata Pelajaran)</DropdownMenuItem>
                        {mataPelajaranOptions.map(mapel => (<DropdownMenuItem key={mapel.value} onSelect={() => setSelectedView(mapel.value)}>{mapel.label}</DropdownMenuItem>))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 border rounded-lg shadow-sm bg-card">
                <div>
                    <h3 className="text-xl font-bold text-primary">{cardTitle}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Kelas: {cardKelas}</p>
                </div>
                <div className="text-left sm:text-right mt-3 sm:mt-0">
                    <div className="flex items-end justify-start sm:justify-end space-x-1">
                        <span className="text-5xl font-bold text-primary leading-none">{cardPengisi ?? '0'}</span>
                        <span className="text-3xl font-medium text-muted-foreground leading-none pb-1">/</span>
                        <span className="text-4xl font-medium text-muted-foreground leading-none pb-0.5">{cardTotalSiswa ?? '0'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 text-left sm:text-right">Total Siswa Pengisi / Terdaftar</p>
                    <ParticipationChip pengisi={cardPengisi} totalSiswa={cardTotalSiswa} className="sm:justify-end justify-start flex"/>
                </div>
            </div>

            {kritikSaranList.length > 0 && !(kritikSaranList.length === 1 && kritikSaranList[0] === noKritikMessage && noKritikMessage.includes("Tidak ada kritik")) ? (
                 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">{kritikSaranList.map((item: string, index: number) => (<div key={index} className="p-3 border rounded-md bg-background text-sm text-foreground/90"><p>{item}</p></div>))}</div>
            ) : (<p className="text-sm text-muted-foreground p-3 bg-background rounded-md">{noKritikMessage}</p>)}
        </div>
    );
}