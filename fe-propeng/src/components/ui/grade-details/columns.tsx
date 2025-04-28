// components/ui/grade-details/columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { ComponentGradeWithNo } from "./schema"

// Helper function to format the score
const formatScore = (score: number | null | undefined): string => {
  if (typeof score === "number" && !isNaN(score)) {
    return score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)
  }
  return "-"
}

// Helper function to format the weight (bobot) as percentage
const formatBobot = (bobot: number | null | undefined): string => {
  if (typeof bobot === "number" && !isNaN(bobot)) {
    return `${bobot}%`
  }
  return "-"
}

// Define the columns for the DataTable
export const gradeDetailColumns: ColumnDef<ComponentGradeWithNo>[] = [
  {
    accessorKey: "no",
    header: () => <div className="text-center">No</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.getValue("no")}</div>,
    size: 50,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "komponen",
    header: "Komponen",
    cell: ({ row }) => <div>{row.getValue("komponen")}</div>,
    enableSorting: false,
  },
  {
    accessorKey: "bobot",
    header: () => <div className="text-center">Bobot</div>,
    cell: ({ row }) => <div className="text-center">{formatBobot(row.getValue("bobot"))}</div>,
    size: 100,
    enableSorting: false,
  },
  {
    accessorKey: "nilai",
    header: () => <div className="text-center">Nilai</div>,
    cell: ({ row }) => <div className="text-center font-medium">{formatScore(row.getValue("nilai"))}</div>,
    size: 100,
    enableSorting: false,
  },
]
