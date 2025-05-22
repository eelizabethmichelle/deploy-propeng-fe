
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DotsHorizontalIcon, ReaderIcon, GearIcon, ListBulletIcon, StarIcon } from "@radix-ui/react-icons"; // Tambahkan ikon yang mungkin dibutuhkan PDF
import { Row } from "@tanstack/react-table";
import Link from "next/link";
import { Eye, Download, Loader2, GalleryHorizontal, GalleryVertical } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { FlattenedEvaluasiGuruOverview } from "./schema";


// --- Tipe Data untuk PDF (bisa diletakkan di file tipe bersama) ---
type PdfOrientation = 'p' | 'l';
type PdfPaperSize = 'a4' | 'letter' | 'legal';

// --- Konstanta Pemetaan untuk PDF (Idealnya diimpor dari utilitas bersama) ---
const variabelDisplayNames: { [key: string]: string } = {
    "1": "Materi Pelajaran", "2": "Proses Pembelajaran", "3": "Pengelolaan Kelas", "4": "Evaluasi Pembelajaran"
};
const variabelIcons: { [key: string]: React.ElementType } = { // Digunakan jika PDF menampilkan ikon
    "1": ReaderIcon, "2": GearIcon, "3": ListBulletIcon, "4": StarIcon,
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

// --- Fungsi Generate PDF (Idealnya diimpor dari utilitas bersama) ---
const generateTeacherEvaluationPdfForRow = (
    dataKeseluruhan: any, // Akan berisi evaluasi_keseluruhan_rerata untuk guru/TA ini
    infoKonteks: any,     // Akan berisi info_konteks untuk guru/TA ini
    orientation: PdfOrientation,
    paperSize: PdfPaperSize
): jsPDF | null => {
    if (!dataKeseluruhan || !infoKonteks) {
        toast.error("Data evaluasi tidak lengkap untuk membuat PDF.");
        return null;
    }
    const doc = new jsPDF({ orientation, unit: 'mm', format: paperSize });
    const pageMargin = 15; const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); let currentY = pageMargin; const lineHeight = 7; const smallLineHeight = 5; const schoolName = "SMA Kristen Anglo";
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Laporan Evaluasi Guru Tahunan", pageWidth / 2, currentY, { align: 'center' }); currentY += lineHeight * 1.5;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const addHeaderInfo = (label: string, value: string | undefined) => { if (currentY > pageHeight - pageMargin) { doc.addPage(); currentY = pageMargin; } doc.text(label, pageMargin, currentY); doc.text(`: ${value || 'N/A'}`, pageMargin + 40, currentY); currentY += smallLineHeight; };
    addHeaderInfo("Nama Sekolah", schoolName); addHeaderInfo("Nama Guru", infoKonteks.nama_guru); addHeaderInfo("NISP", infoKonteks.nisp); const taDisplay = infoKonteks.tahun_ajaran ? `${infoKonteks.tahun_ajaran}/${parseInt(infoKonteks.tahun_ajaran) + 1}` : 'N/A'; addHeaderInfo("Tahun Ajaran", taDisplay); currentY += lineHeight * 0.5;
    const variables = dataKeseluruhan.detail_skor_rata_rata_per_indikator_gabungan;
    if (variables && Array.isArray(variables)) {
        variables.forEach((variableData: any) => {
            const variableId = String(variableData.variabel_id); const variableName = variabelDisplayNames[variableId] || `Variabel ${variableId}`; const variableAverageScore = dataKeseluruhan.ringkasan_skor_rata_rata_per_variabel_gabungan?.[variableId] || "- / 5.00";
            if (currentY > pageHeight - pageMargin - 30) { doc.addPage(); currentY = pageMargin; }
            doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text(variableName, pageMargin, currentY); currentY += lineHeight * 0.8;
            const tableHead: RowInput[] = [[{ content: 'Indikator Penilaian', styles: { fontStyle: 'bold', cellPadding: 1.5 } }, { content: 'Skor', styles: { fontStyle: 'bold', halign: 'right', cellPadding: 1.5 } }]]; const tableBody: RowInput[] = [];
            const allIndicatorEntries = Object.entries(variableData).filter(([key]) => key.startsWith("Indikator "));
            const visibleIndicatorEntries = allIndicatorEntries.filter(([indicatorJsonKey]) => detailedIndikatorQuestionMap[variableId] && detailedIndikatorQuestionMap[variableId].hasOwnProperty(indicatorJsonKey));
            visibleIndicatorEntries.forEach(([indicatorJsonKey, scoreValue]) => { const questionText = detailedIndikatorQuestionMap[variableId]![indicatorJsonKey]; tableBody.push([{ content: doc.splitTextToSize(questionText, pageWidth - pageMargin * 2 - 30), styles: { cellPadding: 1.5, fontSize: 9 } }, { content: String(scoreValue), styles: { halign: 'right', cellPadding: 1.5, fontSize: 9 } }]); });
            if (tableBody.length > 0) { autoTable(doc, { head: tableHead, body: tableBody, startY: currentY, theme: 'grid', headStyles: { fillColor: [240, 240, 240], textColor: 50, fontSize: 9.5, cellPadding: 1.5 }, columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 25, halign: 'right' } }, }); currentY = (doc as any).lastAutoTable.finalY + smallLineHeight;
            } else { doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.text("Tidak ada indikator.", pageMargin + 5, currentY); currentY += smallLineHeight; }
            doc.setFontSize(9.5); doc.setFont("helvetica", "bolditalic"); doc.text(`Rata-Rata ${variableName}`, pageMargin, currentY); doc.text(variableAverageScore, pageWidth - pageMargin, currentY, { align: 'right' }); currentY += lineHeight * 1.5;
        });
    }
    if (dataKeseluruhan.skor_grand_total_dari_variabel_gabungan) { if (currentY > pageHeight - pageMargin - 20) { doc.addPage(); currentY = pageMargin; } doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Skor Rata-Rata Keseluruhan Guru:", pageMargin, currentY); doc.text(dataKeseluruhan.skor_grand_total_dari_variabel_gabungan, pageWidth - pageMargin, currentY, { align: 'right' }); currentY += lineHeight * 2; }
    const kritikSaran = dataKeseluruhan.daftar_kritik_saran_gabungan;
    if (kritikSaran && Array.isArray(kritikSaran) && kritikSaran.length > 0 && !(kritikSaran.length === 1 && kritikSaran[0].includes("Tidak ada kritik"))) { if (currentY > pageHeight - pageMargin - 30) { doc.addPage(); currentY = pageMargin; } doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Kritik dan Saran Gabungan:", pageMargin, currentY); currentY += lineHeight; doc.setFontSize(9); doc.setFont("helvetica", "normal"); kritikSaran.forEach((kritik: string) => { if (currentY > pageHeight - pageMargin - 15) { doc.addPage(); currentY = pageMargin; } const splitText = doc.splitTextToSize(`• ${kritik}`, pageWidth - pageMargin * 2 - 5); doc.text(splitText, pageMargin + 5, currentY); currentY += (splitText.length * smallLineHeight) + (smallLineHeight * 0.5); }); }
    const pageCount = (doc as any).internal.getNumberOfPages(); for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150); doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - pageMargin, pageHeight - 10, { align: 'right' }); }
    return doc;
};
// --- End Fungsi Generate PDF ---


interface OverviewTahunanRowActionsProps {
  row: Row<FlattenedEvaluasiGuruOverview>;
}

export function OverviewTahunanRowActions({ row }: OverviewTahunanRowActionsProps) {
  const evaluasi = row.original; // Berisi guru_id, tahun_ajaran (string), nama_guru, dll.
  const detailPageUrl = `/admin/evalguru/detail/${evaluasi.guru_id}/${evaluasi.tahun_ajaran}`;

  // State untuk dialog PDF per baris
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('p');
  const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>('a4');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [detailedDataForPdf, setDetailedDataForPdf] = useState<any>(null); // Untuk menyimpan data fetch

  // Fungsi untuk fetch data detail evaluasi untuk guru/TA spesifik
// Inside OverviewTahunanRowActions component
const fetchDetailedDataForPdf = useCallback(async (guruId: string, tahunAjaran: string) => {
    // setLoading(true); // Consider a local loading for this fetch if needed
    try {
        const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!accessToken) { 
            toast.error("Sesi tidak valid."); 
            throw new Error("Token otentikasi tidak ditemukan."); 
        }
        
        const response = await fetch(`/api/evalguru/admin/detail-tahunan?guru_id=${guruId}&tahun_ajaran_id=${tahunAjaran}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }, 
            cache: 'no-store'
        });
        const fetchedData = await response.json();
        if (!response.ok || fetchedData.status !== 200) {
            throw new Error(fetchedData.message || "Gagal mengambil data detail evaluasi.");
        }
        return fetchedData; // Return data
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil detail data");
        return null;
    } finally {
        // setLoading(false);
    }
}, []); // Empty dependency array makes this function stable


  const handleGeneratePreviewForRow = useCallback(async (orientation: PdfOrientation, paperSize: PdfPaperSize) => {
    if (!detailedDataForPdf && !isPreviewLoading) { // Fetch data jika belum ada atau tidak sedang loading
        const fetched = await fetchDetailedDataForPdf(evaluasi.guru_id.toString(), evaluasi.tahun_ajaran);
        if (!fetched) { setIsPreviewLoading(false); return; }
         // Data sudah ada di detailedDataForPdf via state update, atau gunakan `Workspaceed`
         const doc = generateTeacherEvaluationPdfForRow(fetched.evaluasi_keseluruhan_rerata, fetched.info_konteks, orientation, paperSize);
         if (doc) setPdfPreviewUrl(doc.output('datauristring')); else setPdfPreviewUrl(null);
    } else if (detailedDataForPdf) { // Jika data sudah ada, langsung generate
        setIsPreviewLoading(true); // Set loading di sini sebelum generate
        await new Promise(resolve => setTimeout(resolve, 10)); // UI update
        const doc = generateTeacherEvaluationPdfForRow(detailedDataForPdf.evaluasi_keseluruhan_rerata, detailedDataForPdf.info_konteks, orientation, paperSize);
        if (doc) setPdfPreviewUrl(doc.output('datauristring')); else setPdfPreviewUrl(null);
    }
    setIsPreviewLoading(false); // Pastikan loading preview di-set false setelah selesai
  }, [detailedDataForPdf, evaluasi.guru_id, evaluasi.tahun_ajaran, fetchDetailedDataForPdf, isPreviewLoading]);

  // Effect untuk auto-generate preview saat dialog terbuka atau opsi berubah
// Inside OverviewTahunanRowActions component

useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    if (isPdfDialogOpen) {
        const generatePreview = async () => {
            if (!isMounted) return;

            setIsPreviewLoading(true);
            setPdfPreviewUrl(null); // Clear previous preview

            // Fetch data ONLY if it's not already fetched for this specific row's dialog session
            // or if essential identifiers (guru_id, tahun_ajaran) have somehow changed (though they shouldn't for a row action)
            let currentDetailedData = detailedDataForPdf;

            if (!currentDetailedData || 
                currentDetailedData.info_konteks?.guru_id !== evaluasi.guru_id || 
                currentDetailedData.info_konteks?.tahun_ajaran !== evaluasi.tahun_ajaran) {
                
                const fetchedData = await fetchDetailedDataForPdf(evaluasi.guru_id.toString(), evaluasi.tahun_ajaran);
                
                if (!isMounted) return; // Check again after await

                if (!fetchedData) {
                    setIsPreviewLoading(false);
                    // Optionally set an error state for detailedDataForPdf or show a toast
                    return;
                }
                setDetailedDataForPdf(fetchedData); // Store it for this dialog session
                currentDetailedData = fetchedData;
            }
            
            // Ensure data is valid before generating PDF
            if (!currentDetailedData || !currentDetailedData.evaluasi_keseluruhan_rerata || !currentDetailedData.info_konteks) {
                if(isMounted) setIsPreviewLoading(false);
                return;
            }

            const doc = generateTeacherEvaluationPdfForRow( // Assuming this function is stable (defined outside or useCallback with stable deps)
                currentDetailedData.evaluasi_keseluruhan_rerata,
                currentDetailedData.info_konteks,
                pdfOrientation,
                pdfPaperSize
            );

            if (isMounted) {
                if (doc) {
                    setPdfPreviewUrl(doc.output('datauristring'));
                } else {
                    setPdfPreviewUrl(null);
                    // toast.error("Gagal membuat pratinjau PDF."); // generate function might already toast
                }
                setIsPreviewLoading(false);
            }
        };

        generatePreview();
    } else {
        // When dialog is closed, reset related states
        // This check is important because onOpenChange might also trigger this useEffect
        // if isPdfDialogOpen is in its dependency array.
        if (pdfPreviewUrl !== null) setPdfPreviewUrl(null);
        if (detailedDataForPdf !== null) setDetailedDataForPdf(null);
        if (isPreviewLoading) setIsPreviewLoading(false); // Reset loading if dialog closed during load
    }
    
    return () => {
        isMounted = false; // Cleanup function
    };
// Dependencies: Only include values that, when changed, should trigger a re-fetch or re-generation.
// evaluasi.guru_id and evaluasi.tahun_ajaran are from row.original, they are stable for a given row instance.
// fetchDetailedDataForPdf is memoized with useCallback.
}, [isPdfDialogOpen, pdfOrientation, pdfPaperSize, evaluasi.guru_id, evaluasi.tahun_ajaran, fetchDetailedDataForPdf]); 
// Removed detailedDataForPdf and isPreviewLoading from this dependency array as they are managed inside.

  // Inside OverviewTahunanRowActions component
const handleActualDownloadForRow = useCallback(async () => {
    setIsDownloadingPdf(true);
    
    let dataToUse = detailedDataForPdf;

    if (!dataToUse || 
        dataToUse.info_konteks?.guru_id !== evaluasi.guru_id || 
        dataToUse.info_konteks?.tahun_ajaran !== evaluasi.tahun_ajaran) {
        // toast.info("Mengambil data terbaru untuk PDF..."); // Optional user feedback
        dataToUse = await fetchDetailedDataForPdf(evaluasi.guru_id.toString(), evaluasi.tahun_ajaran);
    }

    if (!dataToUse || !dataToUse.evaluasi_keseluruhan_rerata || !dataToUse.info_konteks) {
        toast.error("Data evaluasi tidak lengkap untuk mengunduh PDF.");
        setIsDownloadingPdf(false);
        return;
    }
    
    // Generate PDF after a short timeout to allow UI update
    setTimeout(() => {
        try {
            const doc = generateTeacherEvaluationPdfForRow(
                dataToUse.evaluasi_keseluruhan_rerata, 
                dataToUse.info_konteks, 
                pdfOrientation, 
                pdfPaperSize
            );
            if (doc) {
                const teacherNameSafe = dataToUse.info_konteks.nama_guru?.replace(/[^a-zA-Z0-9]/g, '_') || 'Guru';
                const taSafe = dataToUse.info_konteks.tahun_ajaran?.replace(/[^a-zA-Z0-9]/g, '_') || 'TA';
                doc.save(`Laporan_Evaluasi_${teacherNameSafe}_${taSafe}.pdf`);
                toast.success("Unduhan PDF dimulai...");
                setIsPdfDialogOpen(false); // Close dialog after successful download
            } else { 
                throw new Error("Gagal membuat dokumen PDF untuk diunduh."); 
            }
        } catch (err) { 
            toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF.");
            console.error("PDF Download Error:", err);
        } finally { 
            setIsDownloadingPdf(false); 
        }
    }, 50);
}, [detailedDataForPdf, evaluasi.guru_id, evaluasi.tahun_ajaran, pdfOrientation, pdfPaperSize, fetchDetailedDataForPdf]);
  return (
    <Dialog open={isPdfDialogOpen} onOpenChange={(open) => {
        setIsPdfDialogOpen(open);
        if (!open) { // Saat dialog ditutup
            setPdfPreviewUrl(null);
            setDetailedDataForPdf(null); // Reset data
        }
    }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]"> {/* Lebarkan sedikit */}
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={detailPageUrl} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail Evaluasi
            </Link>
          </DropdownMenuItem>
          
          <DialogTrigger asChild>
            <DropdownMenuItem 
                onSelect={(e) => { 
                    e.preventDefault(); // Mencegah menu tertutup otomatis
                    setIsPdfDialogOpen(true); // Buka dialog secara manual
                }}
                className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh Laporan PDF
            </DropdownMenuItem>
          </DialogTrigger>

        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
            <DialogTitle>Opsi Unduh PDF Laporan Evaluasi</DialogTitle>
            <DialogDescription>
                Untuk Guru: {evaluasi.nama_guru} - Tahun Ajaran: {evaluasi.tahun_ajaran} <br/>
                Pilih orientasi dan ukuran kertas.
            </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="space-y-4 md:col-span-1">
                <div>
                    <Label className="text-sm font-medium">Orientasi</Label>
                    <RadioGroup value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as PdfOrientation)} className="mt-2 grid grid-cols-2 gap-2">
                        {[ {value: 'p', label: 'Potrait', icon: GalleryHorizontal}, {value: 'l', label: 'Lanskap', icon: GalleryVertical} ].map(opt => {
                            const Icon = opt.icon;
                            return (<div key={opt.value}><RadioGroupItem value={opt.value} id={`row-pdf-${opt.value}-${evaluasi.guru_id}-${evaluasi.tahun_ajaran}`} className="peer sr-only" /><Label htmlFor={`row-pdf-${opt.value}-${evaluasi.guru_id}-${evaluasi.tahun_ajaran}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"><Icon size={16} className='mr-2 text-primary'/> {opt.label}</Label></div>);
                        })}
                    </RadioGroup>
                </div>
                <div>
                    <Label htmlFor={`row-pdf-paper-size-${evaluasi.guru_id}-${evaluasi.tahun_ajaran}`} className="text-sm font-medium">Ukuran Kertas</Label>
                    <Select value={pdfPaperSize} onValueChange={(v) => setPdfPaperSize(v as PdfPaperSize)}>
                        <SelectTrigger id={`row-pdf-paper-size-${evaluasi.guru_id}-${evaluasi.tahun_ajaran}`} className="w-full mt-2"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                        <SelectContent><SelectItem value="a4">A4</SelectItem><SelectItem value="letter">Letter</SelectItem><SelectItem value="legal">Legal</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className='pt-4'>
                    <Button onClick={handleActualDownloadForRow} disabled={isDownloadingPdf || isPreviewLoading} className="w-full">
                        {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} 
                        Unduh PDF Sekarang
                    </Button>
                </div>
            </div>
            <div className="md:col-span-2 border rounded-md bg-muted/30 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                {isPreviewLoading && (<div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Memuat Pratinjau...</div>)}
                {pdfPreviewUrl ? (<iframe src={pdfPreviewUrl} className="w-full h-[500px] md:h-[600px]" title="Pratinjau PDF Laporan Evaluasi" />) 
                 : !isPreviewLoading && (<div className="text-center text-muted-foreground p-4"><p>Pratinjau PDF akan muncul di sini.</p><p className='text-xs mt-1'>(Mengubah opsi akan memuat ulang)</p></div>)}
            </div>
        </div>
        <DialogFooter className="mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}