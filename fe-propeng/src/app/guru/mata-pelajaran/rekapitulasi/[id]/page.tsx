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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useParams } from "next/navigation"

// DTOs from your API
interface Subject { id: string; name: string }
interface Student { id: string; name: string; class: string }
interface Component { id: string; name: string; weight: number; type: string }

interface Kelas {
  id: number
  namaKelas: string
  tahunAjaran: number
  waliKelas: string
}

interface GradeData {
  students: Student[]
  assessmentComponents: Component[]
  academicYear: string
  teacherName: string
  teacherNisp: string
  initialGrades: Record<string, Record<string, number>>
}

type GradeRow = {
  name: string
  pengetahuan: number
  keterampilan: number
  status: string
}

export default function Page() {
  const params = useParams();
  const [subjectId, setSubjectId] = useState<string>("")
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [studentIdsInClass, setStudentIdsInClass] = useState<string[]>([])
  const [kelas, setKelas] = useState<Kelas>()

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""

  useEffect(() => {
    const matpelIdRaw = params.id;
    const matpelId = Array.isArray(matpelIdRaw)
      ? matpelIdRaw[matpelIdRaw.length - 1]
      : matpelIdRaw
  
    if (matpelId) {
      setSubjectId(matpelId)
    }
  }, [params.id])

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

  const { avgPengetahuan, avgKeterampilan } = useMemo(() => {
    if (!gradeData) return { avgPengetahuan: 0, avgKeterampilan: 0 }
  
    const penComponentIds = gradeData.assessmentComponents
      .filter((comp) => comp.type === "Pengetahuan")
      .map((comp) => comp.id)
  
    const ketComponentIds = gradeData.assessmentComponents
      .filter((comp) => comp.type === "Keterampilan")
      .map((comp) => comp.id)
  
    const penScores: number[] = []
    const ketScores: number[] = []
  
    gradeData.students.forEach((student) => {
      const grades = gradeData.initialGrades[student.id] || {}
  
      penComponentIds.forEach((id) => {
        if (grades[id] != null) penScores.push(grades[id])
      })
  
      ketComponentIds.forEach((id) => {
        if (grades[id] != null) ketScores.push(grades[id])
      })
    })
  
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0)
  
    return {
      avgPengetahuan: avg(penScores),
      avgKeterampilan: avg(ketScores),
    }
  }, [gradeData])
  console.log ("T")
  console.log(gradeData)

  const needsGuidanceCount = gradeData
  ? gradeData.students.filter((stu) => {
      const grades = gradeData.initialGrades[stu.id] || {}

      // Cari semua nilai Pengetahuan untuk siswa ini
      const penScores = gradeData.assessmentComponents
        .filter(comp => comp.type === "Pengetahuan")
        .map(comp => grades[comp.id] ?? 0)

      // Cari semua nilai Keterampilan untuk siswa ini
      const ketScores = gradeData.assessmentComponents
        .filter(comp => comp.type === "Keterampilan")
        .map(comp => grades[comp.id] ?? 0)

      // Hitung rata-rata Pengetahuan dan Keterampilan siswa tersebut
      const avgPen = penScores.length ? penScores.reduce((a,b) => a+b, 0) / penScores.length : 0
      const avgKet = ketScores.length ? ketScores.reduce((a,b) => a+b, 0) / ketScores.length : 0

      // Return true kalau nilai siswa di bawah rata-rata kelas (avgPengetahuan & avgKeterampilan global)
      return avgPen < 75 || avgKet < 75
    }).length
  : 0

  console.log(needsGuidanceCount)
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
        cell: ({ getValue }) => {
          const value = getValue<string>()
          return value === "Di atas KKM" ? (
            <Badge variant="secondary">{value}</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">{value}</Badge>
          )
        },        
      },
    ],
    []
  )

  console.log(studentIdsInClass)
  const rows: GradeRow[] = gradeData
  ? gradeData.students.map((stu) => {
      const grades = gradeData.initialGrades[stu.id] || {}

      const penComponentIds = gradeData.assessmentComponents
        .filter((comp) => comp.type === "Pengetahuan")
        .map((comp) => comp.id)

      const ketComponentIds = gradeData.assessmentComponents
        .filter((comp) => comp.type === "Keterampilan")
        .map((comp) => comp.id)

      const penScores = penComponentIds
        .map((id) => grades[id])
        .filter((val): val is number => val !== undefined)

      const ketScores = ketComponentIds
        .map((id) => grades[id])
        .filter((val): val is number => val !== undefined)

      const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

      const pen = avg(penScores)
      const ket = avg(ketScores)
      console.log("sss")
      console.log(pen)
      console.log(ket)

      const status = pen >= 75 && ket >= 75 ? "Di atas KKM" : "Di bawah KKM"

      return {
        id: stu.id,
        name: stu.name,
        class: stu.class,
        pengetahuan: pen,
        keterampilan: ket,
        status,
      }
    })
  : []

  const getGradeDistribution = (rows: GradeRow[]) => {
    const ranges = [
      { label: "<51", min: 0, max: 50 },
      { label: "51-75", min: 51, max: 75 },
      { label: "76-83", min: 76, max: 83 },
      { label: "84-92", min: 84, max: 92 },
      { label: "93-100", min: 93, max: 100 },
    ]
    return ranges.map((range) => {
      const keterampilan = rows.filter((r) =>
        r.keterampilan >= range.min && r.keterampilan <= range.max
      ).length
      const pengetahuan = rows.filter((r) =>
        r.pengetahuan >= range.min && r.pengetahuan <= range.max
      ).length
      return { range: range.label, keterampilan, pengetahuan }
    })
  }

  const getGradeBins = (grades: number[]) => {
    const bins = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0
    }
  
    for (const g of grades) {
      if (g <= 20) bins["0-20"]++
      else if (g <= 40) bins["21-40"]++
      else if (g <= 60) bins["41-60"]++
      else if (g <= 80) bins["61-80"]++
      else bins["81-100"]++
    }
  
    return bins
  }

  const penGrades: number[] = gradeData?.students.map(stu => {
    const grades = gradeData.initialGrades[stu.id] || {}
    const penComponents = gradeData.assessmentComponents.filter(c => c.type === 'Pengetahuan').map(c => c.id)
    const values = penComponents.map(id => grades[id]).filter((v): v is number => typeof v === 'number')
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }) ?? []
  
  const ketGrades: number[] = gradeData?.students.map(stu => {
    const grades = gradeData.initialGrades[stu.id] || {}
    const ketComponents = gradeData.assessmentComponents.filter(c => c.type === 'Keterampilan').map(c => c.id)
    const values = ketComponents.map(id => grades[id]).filter((v): v is number => typeof v === 'number')
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }) ?? []
  
  const penBins = getGradeBins(penGrades)
  const ketBins = getGradeBins(ketGrades)

  const intervals = [
    { label: '0–20', min: 0, max: 20 },
    { label: '21–40', min: 21, max: 40 },
    { label: '41–60', min: 41, max: 60 },
    { label: '61–80', min: 61, max: 80 },
    { label: '81–100', min: 81, max: 100 },
  ]
  
  const penComponents = gradeData?.assessmentComponents.filter(c => c.type === 'Pengetahuan').map(c => c.id)
  
  const studentAverages = gradeData?.students.map((stu) => {
    const grades = gradeData?.initialGrades[stu.id] || {}
    const values = penComponents?.map(id => grades[id]).filter((v): v is number => typeof v === 'number')
    const avg = values?.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    return avg
  })
  
  const intervalCounts = intervals.map(({ min, max }) => ({
    label: `${min}–${max}`,
    count: studentAverages?.filter(avg => avg >= min && avg <= max).length ?? 0, 
  }))
  
  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />
  
      {/* Title + Subtext + Filter */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rekapitulasi Nilai Siswa</h1>
          <div className="text-sm text-gray-600 mt-1">
            <p>
              <strong>Tahun Ajaran:</strong> {gradeData?.academicYear} |{' '}
              <strong>Nama Guru:</strong> {gradeData?.teacherName}
            </p>
          </div>
        </div>
        <Select value={subjectId} onValueChange={setSubjectId} disabled={loadingSubjects}>
          {/* options here */}
        </Select>
      </div>
  
      {loadingGrades ? (
        <div className="text-center py-10">Memuat nilai…</div>
      ) : (
        <>
         <h2 className="text-lg font-semibold mb-4">Grafik Persebaran Nilai</h2>  
         <div className="flex gap-10 items-start w-full max-w-6xl">
  {/* Chart */}
  <div className="relative flex-1 h-[300px]">
    {/* Y-axis labels */}
    <div className="absolute left-0 top-0 bottom-10 w-12 flex flex-col justify-between text-xs text-gray-500 select-none">
      {[5, 4, 3, 2, 1, 0].map((n) => (
        <div key={n} className="h-0 leading-none">
          {n}
        </div>
      ))}
    </div>

    {/* Horizontal grid lines */}
    <div className="absolute top-0 left-12 right-0 bottom-10 flex flex-col justify-between pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border-t border-gray-200 h-0"></div>
      ))}
    </div>

    {/* Histogram bars */}
    <div className="absolute bottom-10 left-12 right-0 flex items-end justify-around h-[90%] px-2 gap-2">
      {intervalCounts.map((bin, index) => {
        const maxCount = Math.max(...intervalCounts.map((b) => b.count))
        const barHeight = maxCount > 0 ? (bin.count / maxCount) * 200 : 0

        return (
          <div key={index} className="flex flex-col items-center gap-1 w-12 relative group cursor-pointer">
            <div
              className="bg-blue-600 rounded-t-md w-full transition-all duration-300 ease-in-out group-hover:bg-blue-800"
              style={{ height: `${barHeight}px` }}
            />
            {/* Tooltip */}
            <div className="absolute -top-6 bg-blue-900 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
              {bin.count} siswa
            </div>
          </div>
        )
      })}
    </div>

    {/* X-axis labels */}
    <div className="absolute bottom-0 left-12 right-0 flex justify-around text-xs text-gray-600 px-2 gap-2">
      {intervalCounts.map((bin, index) => (
        <div key={index} className="w-12 text-center">
          {bin.label}
        </div>
      ))}
    </div>
  </div>

  {/* Scorecards */}
  <div className="flex flex-col gap-6 w-80">
    <Card className="bg-red-50 shadow-md rounded-lg">
      <CardContent className="flex items-center justify-start gap-6 px-8 py-6">
        <ArrowRight className="w-10 h-10 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-700">Siswa Butuh Bimbingan</p>
          <p className="text-3xl font-bold">{needsGuidanceCount} Siswa</p>
        </div>
      </CardContent>
    </Card>
    <Card className="bg-blue-50 shadow-md rounded-lg">
      <CardContent className="flex items-center justify-start gap-6 px-8 py-6">
        <Users className="w-10 h-10 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-700">Total Siswa</p>
          <p className="text-3xl font-bold">{rows.length} Siswa</p>
        </div>
      </CardContent>
    </Card>
  </div>
</div>

  
          {/* Table */}
          <div className="mt-6">
            <DataTable columns={columns} data={rows} />
          </div>
        </>
      )}
    </div>
  ) } 