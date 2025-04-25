// src/components/ui/summarystudent/subject-grades-table.tsx (REVISED - Whitespace Fix)
import React from 'react';
import {
  Table, // Import shadcn Table
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust path
import { SubjectGradeForTable } from './schema'; // Adjust path
import { StaticTableRowActions } from './student-grades-row-actions';

interface SubjectGradesTableProps {
  title: string;
  subjects: SubjectGradeForTable[];
}

const formatScore = (score: number | null | undefined): string => {
    if (typeof score === 'number' && !isNaN(score)) { return score.toFixed(0); } return '-';
};

export function SubjectGradesTable({ title, subjects }: SubjectGradesTableProps) {
  if (!subjects || subjects.length === 0) { return null; }

  return (
    <div className='mt-6 mb-4'>
        <h2 className="text-lg font-semibold mb-3 px-1">{title}</h2>
        <div className="rounded-md border overflow-x-auto">
            {/* Ensure no whitespace directly inside <Table> */}
            <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[50px] text-center h-10 px-2">No</TableHead>
                        <TableHead className="px-3">Mata Pelajaran</TableHead>
                        <TableHead className="w-[150px] text-center px-2">Nilai Pengetahuan</TableHead>
                        <TableHead className="w-[150px] text-center px-2">Nilai Keterampilan</TableHead>
                        <TableHead className="w-[80px] text-center px-2">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subjects.map((subject, index) => (
                        <TableRow key={subject.id || index}>
                            <TableCell className="font-medium text-center px-2">{index + 1}</TableCell>
                            <TableCell className="px-2">{subject.nama}</TableCell>
                            <TableCell className="text-center px-2">
                                {formatScore(subject.calculatedNilaiPengetahuan)}
                            </TableCell>
                            <TableCell className="text-center px-2">
                                {formatScore(subject.calculatedNilaiKeterampilan)}
                            </TableCell>
                            <TableCell className="text-center px-2">
                                <StaticTableRowActions subjectId={subject.id} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table> {/* Ensure no trailing whitespace here either */}
        </div>
    </div>
  );
}