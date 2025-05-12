"use client"

import React, { useState, useEffect, useMemo } from "react"
import { DataTable } from "@/components/ui/dt-distribusi-nilai/data-table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

// DTOs from your API
interface Subject { id: string; name: string }
interface Student { id: string; name: string; class: string }
interface Component { id: string; weight: number }
interface GradeData {
  students: Student[]
  assessmentComponents: Component[]
  initialGrades: Record<string, Record<string, number>>
}

type GradeRow = {
  no: number
  name: string
  pengetahuan: number
  keterampilan: number
  status: string
}

export default function Page() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<string>("")
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""

  useEffect(() => {
    if (!token) {
      toast.error("Token otentikasi tidak ditemukan.")
      setLoadingSubjects(false)
      return
    }
    fetch("/api/nilai/subjects", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || `(${res.status})`)
        }
        return res.json() as Promise<Subject[]>
      })
      .then((data) => {
        setSubjects(data)
        if (data[0]) setSubjectId(data[0].id)
      })
      .catch((e: any) => toast.error(e.message || "Gagal memuat daftar mata pelajaran"))
      .finally(() => setLoadingSubjects(false))
  }, [token])

  useEffect(() => {
    if (!subjectId || !token) return
    setLoadingGrades(true)
    fetch(`/api/nilai/gradedata?subjectId=${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || `(${res.status})`)
        }
        return res.json() as Promise<GradeData>
      })
      .then(setGradeData)
      .catch((e: any) => toast.error(e.message || "Gagal memuat data nilai"))
      .finally(() => setLoadingGrades(false))
  }, [subjectId, token])

  // Calculate per-component averages
  const { avgPengetahuan, avgKeterampilan } = useMemo(() => {
    if (!gradeData) return { avgPengetahuan: 0, avgKeterampilan: 0 }
    const penScores: number[] = []
    const ketScores: number[] = []
    gradeData.students.forEach((stu) => {
      const grades = gradeData.initialGrades[stu.id] || {}
      penScores.push(grades["1"] ?? 0)
      ketScores.push(grades["2"] ?? 0)
    })
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0)
    return {
      avgPengetahuan: avg(penScores),
      avgKeterampilan: avg(ketScores),
    }
  }, [gradeData])

  // Status counts
  const needsGuidanceCount = gradeData
    ? gradeData.students.filter((stu) => {
        const grades = gradeData.initialGrades[stu.id] || {}
        return (grades["1"] ?? 0) < avgPengetahuan || (grades["2"] ?? 0) < avgKeterampilan
      }).length
    : 0

  const columns = useMemo<ColumnDef<GradeRow>[]>(
    () => [
      { id: "no", header: "No", accessorFn: (_r, idx) => idx + 1 },
      { accessorKey: "name", header: "Nama Siswa" },
      {
        accessorKey: "pengetahuan",
        header: "Nilai Pengetahuan",
        cell: ({ getValue }) => getValue<number>().toFixed(0),
      },
      {
        accessorKey: "keterampilan",
        header: "Nilai Keterampilan",
        cell: ({ getValue }) => getValue<number>().toFixed(0),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) =>
          getValue<string>().includes("atas") ? (
            <Badge variant="secondary">{getValue<string>()}</Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">{getValue<string>()}</Badge>
          ),
      },
    ],
    []
  )

  const rows: GradeRow[] = gradeData
    ? gradeData.students.map((stu, i) => {
        const grades = gradeData.initialGrades[stu.id] || {}
        const pen = grades["1"] ?? 0
        const ket = grades["2"] ?? 0
        const status = pen >= avgPengetahuan && ket >= avgKeterampilan
          ? "Di atas Rata-Rata"
          : "Di bawah Rata-Rata"
        return { no: i + 1, name: stu.name, pengetahuan: pen, keterampilan: ket, status }
      })
    : []

  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-yellow-50">
          <CardContent className="flex items-center justify-start gap-4 px-6 py-4">
            <ArrowRight className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-yellow-700">Siswa Butuh Bimbingan</p>
              <p className="text-2xl font-semibold">{needsGuidanceCount} Siswa</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="flex items-center justify-start gap-4 px-6 py-4">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-blue-700">Total Siswa</p>
              <p className="text-2xl font-semibold">{rows.length} Siswa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Table */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Daftar Nilai Siswa</h1>
        <Select
          value={subjectId}
          onValueChange={setSubjectId}
          disabled={loadingSubjects}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue
              placeholder={loadingSubjects ? "Memuat…" : "Pilih Mata Pelajaran"}
            />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingGrades ? (
        <div className="text-center py-10">Memuat nilai…</div>
      ) : (
        <>
          <DataTable columns={columns} data={rows} />
          <div className="mt-4 text-sm text-gray-600">
            <p>Rata-rata Nilai Pengetahuan: {avgPengetahuan.toFixed(0)}</p>
            <p>Rata-rata Nilai Keterampilan: {avgKeterampilan.toFixed(0)}</p>
          </div>
        </>
      )}
    </div>
  )
}
