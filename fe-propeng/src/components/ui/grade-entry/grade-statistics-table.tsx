// Lokasi: app/components/grade-statistics-table.tsx
'use client';

import React, { useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'; // Reuse shadcn Table components
import { AssessmentComponent, Student, GradesState } from '@/components/ui/grade-entry/schema'; // Impor tipe dari DataTable

// --- Helper Function ---
const formatNumberOrDash = (value: number | null | undefined, decimals: number = 1): string => {
    if (typeof value === 'number' && !isNaN(value)) {
        return value.toFixed(decimals);
    }
    return '-';
};

// --- Tipe Props ---
interface GradeStatisticsTableProps {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    grades: GradesState; // Gunakan initialGrades dari page
    finalScoreCalculator: (studentId: string, gradesSource: GradesState, components: AssessmentComponent[]) => number | null;
    finalScoreLabel?: string; // Label untuk kolom nilai akhir (misal: "NA (P)")
}

export function GradeStatisticsTable({
    students,
    assessmentComponents,
    grades,
    finalScoreCalculator,
    finalScoreLabel = "Nilai Akhir", // Default label
}: GradeStatisticsTableProps) {

    // --- Kalkulasi Statistik ---
    const statistics = useMemo(() => {
        console.log("[StatsTable] Calculating statistics...");
        if (!students || students.length === 0 || !assessmentComponents) {
            return null;
        }

        const componentScores: Record<string, number[]> = {};
        assessmentComponents.forEach(comp => { componentScores[comp.id] = []; });
        const finalScoresList: number[] = [];

        // Kumpulkan semua nilai valid
        students.forEach(student => {
            const studentGrades = grades[student.id];
            if (studentGrades) {
                assessmentComponents.forEach(comp => {
                    const score = studentGrades[comp.id];
                    if (typeof score === 'number' && !isNaN(score)) {
                        componentScores[comp.id].push(score);
                    }
                });
            }
            // Hitung & kumpulkan nilai akhir
            const finalScore = finalScoreCalculator(student.id, grades, assessmentComponents);
            if (finalScore !== null) {
                finalScoresList.push(finalScore);
            }
        });

        // Hitung statistik
        const stats = {
            avg: {} as Record<string, number | null>,
            min: {} as Record<string, number | null>,
            max: {} as Record<string, number | null>
        };

        assessmentComponents.forEach(comp => {
            const scores = componentScores[comp.id];
            stats.avg[comp.id] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
            stats.min[comp.id] = scores.length > 0 ? Math.min(...scores) : null;
            stats.max[comp.id] = scores.length > 0 ? Math.max(...scores) : null;
        });

        // Statistik Nilai Akhir
        stats.avg['final'] = finalScoresList.length > 0 ? finalScoresList.reduce((a, b) => a + b, 0) / finalScoresList.length : null;
        stats.min['final'] = finalScoresList.length > 0 ? Math.min(...finalScoresList) : null;
        stats.max['final'] = finalScoresList.length > 0 ? Math.max(...finalScoresList) : null;

        console.log("[StatsTable] Stats:", stats);
        return stats;

    }, [students, assessmentComponents, grades, finalScoreCalculator]);

    // Jangan render jika tidak ada komponen atau statistik
    if (!assessmentComponents || assessmentComponents.length === 0 || !statistics) {
        return null; // Atau tampilkan pesan jika perlu
    }

    // --- Render Tabel Statistik ---
    return (
        <div className="mt-4 border rounded-md overflow-hidden">
            <Table className="min-w-full text-xs">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        {/* Kolom label statistik */}
                        <TableHead className="w-[100px] px-3 py-2 font-semibold text-muted-foreground">Statistik</TableHead>
                        {/* Kolom kosong untuk align dengan kelas (opsional) */}
                        {/* <TableHead className="w-[100px] px-3 py-2"></TableHead> */}
                        {/* Kolom untuk setiap komponen */}
                        {assessmentComponents.map(comp => (
                            <TableHead key={comp.id} className="px-2 py-2 text-center font-semibold">
                                {comp.name}
                            </TableHead>
                        ))}
                        {/* Kolom Nilai Akhir */}
                        <TableHead className="px-3 py-2 text-right font-semibold">{finalScoreLabel}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* Baris Rata-rata */}
                    <TableRow>
                        <TableCell className="px-3 py-1.5 font-medium">Rata-rata</TableCell>
                        {/* <TableCell></TableCell> */}
                        {assessmentComponents.map(comp => (
                            <TableCell key={`avg-${comp.id}`} className="px-2 py-1.5 text-center">
                                {formatNumberOrDash(statistics.avg[comp.id], 1)}
                            </TableCell>
                        ))}
                        <TableCell className="px-3 py-1.5 text-right font-medium">
                            {formatNumberOrDash(statistics.avg['final'], 1)}
                        </TableCell>
                    </TableRow>
                    {/* Baris Minimum */}
                    <TableRow>
                        <TableCell className="px-3 py-1.5 font-medium">Minimum</TableCell>
                        {/* <TableCell></TableCell> */}
                        {assessmentComponents.map(comp => (
                            <TableCell key={`min-${comp.id}`} className="px-2 py-1.5 text-center">
                                {formatNumberOrDash(statistics.min[comp.id], 0)}
                            </TableCell>
                        ))}
                        <TableCell className="px-3 py-1.5 text-right font-medium">
                            {formatNumberOrDash(statistics.min['final'], 0)}
                        </TableCell>
                    </TableRow>
                    {/* Baris Maksimum */}
                    <TableRow>
                        <TableCell className="px-3 py-1.5 font-medium">Maksimum</TableCell>
                        {/* <TableCell></TableCell> */}
                        {assessmentComponents.map(comp => (
                            <TableCell key={`max-${comp.id}`} className="px-2 py-1.5 text-center">
                                {formatNumberOrDash(statistics.max[comp.id], 0)}
                            </TableCell>
                        ))}
                        <TableCell className="px-3 py-1.5 text-right font-medium">
                            {formatNumberOrDash(statistics.max['final'], 0)}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}