'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComponentSummary, SubjectSummary } from '@/components/ui/subject-list/schema';
import { SubjectListDataTable } from '@/components/ui/subject-list/subject-list-data-table';

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
    }, []); 
    
    const uniqueComponentOptions = useMemo(() => {
        if (!subjects || subjects.length === 0) {
            return [];
        }
        const allComponentNames = new Set<string>();
        subjects.forEach(subject => {
            if (Array.isArray(subject.components)) {
                subject.components.forEach((component: ComponentSummary) => {
                    if (component?.name) {
                        allComponentNames.add(component.name);
                    }
                });
            }
        });
        return Array.from(allComponentNames).sort().map(name => ({
            label: name,
            value: name, 
        }));
    }, [subjects]);

    const uniqueAcademicYearOptions = useMemo(() => {
        if (!subjects || subjects.length === 0) return [];
        const allYears = new Set<string>();
        subjects.forEach(subject => {
            if (subject.academicYear && subject.academicYear !== "N/A" && !subject.academicYear.includes('/')) {
                allYears.add(subject.academicYear);
            } else if (subject.academicYear && subject.academicYear !== "N/A") {
                allYears.add(subject.academicYear);
            }
        });
        return Array.from(allYears).sort().map(yearValue => {
            let displayLabel = yearValue;
            const startYear = parseInt(yearValue, 10); 
            if (!isNaN(startYear) && yearValue !== "N/A" && !yearValue.includes('/')) {
                displayLabel = `${startYear}/${startYear + 1}`; 
            }

            return {
                label: displayLabel, 
                value: yearValue 
            };
        });
    }, [subjects]);

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
                    {!isLoading && !error && subjects && (
                        
                        <SubjectListDataTable
                            data={subjects}
                            uniqueComponentOptions={uniqueComponentOptions}
                            uniqueAcademicYearOptions={uniqueAcademicYearOptions}
                        />
                    )}
                    {!isLoading && !error && (!subjects || subjects.length === 0) && (
                        <div className="text-center text-muted-foreground py-10">
                            Tidak ada data mata pelajaran untuk ditampilkan.
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}