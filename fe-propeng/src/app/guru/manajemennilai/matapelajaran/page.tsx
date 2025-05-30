// app/guru/mata-pelajaran/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
// Impor tipe dari schema (lebih baik daripada mendefinisikan ulang)
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComponentSummary, SubjectSummary } from '@/components/ui/subject-list/schema';
import { SubjectListDataTable } from '@/components/ui/subject-list/subject-list-data-table';

// Tipe opsi filter (bisa juga dipindah ke schema atau file terpisah)
interface FilterOption { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; }

export default function DaftarMataPelajaranPage() {
    const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    

    useEffect(() => {
        const fetchSubjects = async () => {
        const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");
            setIsLoading(true); setError(null);
            
            try {
                const response = await fetch("/api/nilai/subjects", {
                    method: "GET",
                    headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    let errorData; try { errorData = await response.json(); } catch {/**/}
                    throw new Error(errorData?.message || `Gagal memuat data (${response.status})`);
                }
                const data: SubjectSummary[] = await response.json();
                setSubjects(data);
            } catch (err) {
                console.error("Failed to fetch subjects:", err);
                setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubjects();
    }, []); // Jalankan sekali saat komponen mount

    // Generate opsi unik untuk filter komponen
    const uniqueComponentOptions = useMemo(() => {
        if (!subjects || subjects.length === 0) {
            return [];
        }
        const allComponentNames = new Set<string>();
        subjects.forEach(subject => {
            // Pastikan subject.components adalah array sebelum iterasi
            if (Array.isArray(subject.components)) {
                subject.components.forEach((component: ComponentSummary) => {
                    // Pastikan component dan component.name ada
                    if (component?.name) {
                        allComponentNames.add(component.name);
                    }
                });
            }
        });
        // Ubah Set menjadi array objek untuk Faceted Filter
        return Array.from(allComponentNames).sort().map(name => ({
            label: name,
            value: name, // Gunakan nama sebagai value filter
        }));
    }, [subjects]); // Hitung ulang jika data subjects berubah

     // --- Memo untuk menghitung opsi filter unik TAHUN AJARAN ---
     // --- Memo untuk menghitung opsi filter unik TAHUN AJARAN (dengan label diformat) ---
     const uniqueAcademicYearOptions = useMemo(() => {
        if (!subjects || subjects.length === 0) return [];
        const allYears = new Set<string>();
        subjects.forEach(subject => {
            if (subject.academicYear && subject.academicYear !== "N/A" && !subject.academicYear.includes('/')) {
                 // Hanya tambahkan tahun awal ke Set untuk diolah
                allYears.add(subject.academicYear);
            } else if (subject.academicYear && subject.academicYear !== "N/A") {
                // Jika sudah terformat atau format lain, tambahkan apa adanya (opsional)
                // Atau coba ekstrak tahun awal jika memungkinkan
                 allYears.add(subject.academicYear); // Tambahkan saja dulu
            }
        });
        // Ubah Set menjadi array objek { label (format YYYY/YYYY), value (format YYYY) }
        return Array.from(allYears).sort().map(yearValue => {
            let displayLabel = yearValue; // Label default adalah nilai asli
            const startYear = parseInt(yearValue, 10); // Coba parse tahun awal

            // Jika parsing berhasil dan nilai asli BUKAN N/A atau sudah ada '/'
            if (!isNaN(startYear) && yearValue !== "N/A" && !yearValue.includes('/')) {
                 displayLabel = `${startYear}/${startYear + 1}`; // Format labelnya
            }

            return {
                label: displayLabel, // Tampilkan YYYY/YYYY di dropdown
                value: yearValue     // Gunakan YYYY (nilai asli) untuk filtering
            };
        });
     }, [subjects]); // Hitung ulang hanya jika state 'subjects' berubah

    return (
        <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
             <h1 className="text-2xl font-bold mb-6">Manajemen Nilai</h1>

            
             <Card className='border-0 shadow-none p-0 m-0'>
                 <CardHeader className='p-0'>
                     <CardTitle>Ringkasan Mata Pelajaran</CardTitle>
                     <CardDescription className='pb-4'>Pilih mata pelajaran untuk melihat detail atau mengelola nilai.</CardDescription>
                 </CardHeader>
                 <CardContent className='p-0'>
                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Memuat data...</span>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-600 py-10">
                            Error: {error}
                        </div>
                    )}
                    {/* Pastikan data sudah ada sebelum merender tabel */}
                    {!isLoading && !error && subjects && (
                        
                        <SubjectListDataTable
                            data={subjects}
                            // Teruskan opsi filter unik ke DataTable
                            // DataTable kemungkinan akan meneruskannya lagi ke Toolbar
                            uniqueComponentOptions={uniqueComponentOptions}
                            uniqueAcademicYearOptions={uniqueAcademicYearOptions}
                         />
                    )}
                    {/* Kondisi jika tidak loading, tidak error, tapi data kosong */}
                     {!isLoading && !error && (!subjects || subjects.length === 0) && (
                        <div className="text-center text-muted-foreground py-10">
                            Tidak ada data mata pelajaran untuk ditampilkan.
                        </div>
                     )}
                 </CardContent>
             </Card>

             {/* <Card>
                 <CardHeader>
                     <CardTitle>Ringkasan Mata Pelajaran</CardTitle>
                     <CardDescription>Pilih mata pelajaran untuk melihat detail atau mengelola nilai.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Memuat data...</span>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-600 py-10">
                            Error: {error}
                        </div>
                    )}
                    {!isLoading && !error && subjects && (
                        <SubjectListDataTable
                            data={subjects}
                            uniqueComponentOptions={uniqueComponentOptions}
                         />
                    )}
                     {!isLoading && !error && (!subjects || subjects.length === 0) && (
                        <div className="text-center text-muted-foreground py-10">
                            Tidak ada data mata pelajaran untuk ditampilkan.
                        </div>
                     )}
                 </CardContent>
             </Card> */}

        </div>
    );
}