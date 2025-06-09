// src/components/ui/summarystudent/subject-grades-data-table.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// --- Use the updated schema ---
import { SubjectGradeFromApi } from './schema'; // Adjust path
// --- Import row actions ---
import { StaticTableRowActions } from './student-grades-row-actions'; // Adjust path

interface SubjectGradesTableProps {
  title: string;

  // --- Update prop type ---
  subjects: SubjectGradeFromApi[];
  kelasId: string;
}

// Keep formatScore helper
const formatScore = (score: number | null | undefined): string => {
    if (typeof score === 'number' && !isNaN(score)) {
        // Use 2 decimal places for averages, 0 for components if needed elsewhere
        return score.toFixed(2); // Display average with 2 decimals
    }
    return '-';
};

export function SubjectGradesTable({ title, subjects, kelasId }: SubjectGradesTableProps) {
  if (!subjects || subjects.length === 0) { return null; }

  return (
    <div className='mt-6 mb-4'>
        <h2 className="text-lg font-semibold mb-3 px-1">{title}</h2>
        <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[50px] text-center h-10 px-2">No</TableHead>
                        <TableHead className="px-3">Mata Pelajaran</TableHead>
                        {/* Updated Header Text */}
                        <TableHead className="w-[150px] text-center px-2">Rata-Rata Pengetahuan</TableHead>
                        <TableHead className="w-[150px] text-center px-2">Rata-Rata Keterampilan</TableHead>
                        <TableHead className="w-[80px] text-center px-2">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subjects.map((subject, index) => (
                        <TableRow key={subject.id || index}>
                            <TableCell className="font-medium text-center px-2">{index + 1}</TableCell>
                            <TableCell className="px-2">{subject.nama}</TableCell>
                            {/* --- Use rata_rata fields from backend --- */}
                            <TableCell className="text-center px-2 font-medium">
                                {formatScore(subject.rata_rata_pengetahuan)}
                            </TableCell>
                            <TableCell className="text-center px-2 font-medium">
                                {formatScore(subject.rata_rata_keterampilan)}
                            </TableCell>
                            {/* --- --- --- --- --- --- --- --- --- --- --- */}
                            <TableCell className="text-center px-2">
                                <StaticTableRowActions subjectId={subject.id} kelasId={kelasId} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
