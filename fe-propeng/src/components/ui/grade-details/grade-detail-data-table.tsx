// components/ui/grade-details/grade-detail-data-table.tsx
"use client"

import React from "react"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { gradeDetailColumns } from "./columns"
import type { ComponentGradeWithNo, GradeDetailTableProps } from "./schema"

export function GradeDetailDataTable({
  title,
  components,
  averageScore,
  averageLabel = "Rata-Rata Nilai",
}: GradeDetailTableProps) {
  // Transform the data: Add the 'no' field for row numbering
  const dataWithNo: ComponentGradeWithNo[] = React.useMemo(
    () =>
      components.map((comp, index) => ({
        ...comp,
        no: index + 1,
      })),
    [components],
  )

  // Initialize the table instance
  const table = useReactTable({
    data: dataWithNo,
    columns: gradeDetailColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Format score for display
  const formatScore = (score: number | null | undefined): string => {
    if (typeof score === "number" && !isNaN(score)) {
      return score.toFixed(2)
    }
    return "-"
  }

  return (
    <div className="space-y-0">
      {title && <h3 className="text-md font-semibold px-1 mb-2">{title}</h3>}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-[80px]">No</TableHead>
              <TableHead>Komponen</TableHead>
              <TableHead className="text-center">Bobot</TableHead>
              <TableHead className="text-center">Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Tidak ada data komponen nilai.
                </TableCell>
              </TableRow>
            )}

            {/* Average Score Row */}
            {averageScore !== undefined && (
              <TableRow className="bg-slate-50 border-t">
                <TableCell colSpan={3} className="font-medium">
                  {averageLabel}
                </TableCell>
                <TableCell className="text-center font-bold">{formatScore(averageScore)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
