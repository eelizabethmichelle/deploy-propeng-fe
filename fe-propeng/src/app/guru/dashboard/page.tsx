"use client"

import React, { useState, useEffect, useMemo,  } from "react"
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
import { useRouter } from "next/router"
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
   const params = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<string>("")
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [studentIdsInClass, setStudentIdsInClass] = useState<string[]>([])
  const [kelas, setKelas] = useState<Kelas>()


  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""

  useEffect(() => {
    const classIdRaw = params.id;
    const classId = Array.isArray(classIdRaw)
      ? classIdRaw[classIdRaw.length - 1]
      : classIdRaw
  
    if (!token) {
      toast.error("Token otentikasi tidak ditemukan.")
      setLoadingSubjects(false)
      return
    }
  
    if (!classId) {
      toast.error("ID kelas tidak ditemukan di URL.")
      setLoadingSubjects(false)
      return
    }
  
    fetch("/api/kelas/detailBaru", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token} id ${classId}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || `(${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        const kelasList = data.data
        if (!kelasList) {
          throw new Error("Tidak ada data kelas.")
        }
  
const kelasData = kelasList.find((k: any) => String(k.id) === String(classId))

if (!kelasData) {
  throw new Error("Kelas dengan ID tersebut tidak ditemukan.")
}

        const matpelUnik = kelasData.mata_pelajaran_unik || []
        setSubjects(
          matpelUnik.map((m: any) => ({
            id: String(m.id),
            name: m.nama,
            kode: m.kode,
            kategori: m.kategori,
          }))
        )
        setKelas({
          namaKelas: kelasData.namaKelas,
          tahunAjaran: kelasData.tahunAjaran,
          waliKelas: kelasData.waliKelas,
          id: kelasData.id,
        })
        const siswaInKelas = (kelasData.siswa || []).map((s: any) => String(s.id))
        setStudentIdsInClass(siswaInKelas)
        console.log("Mata Pelajaran Unik:", kelasData.mata_pelajaran_unik)

        console.log("A")
        console.log(matpelUnik[0].id)
        if (matpelUnik[0]) setSubjectId(String(matpelUnik[0].id))
      })
      .catch((e: any) => toast.error(e.message || "Gagal memuat data kelas"))
      .finally(() => setLoadingSubjects(false))
  }, [token])

  
  console.log("T"  )
  console.log(subjectId)
  
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
    ? gradeData.students
    .filter((stu) => studentIdsInClass.includes(stu.id)) 
    .map((stu, i) => {
        const grades = gradeData.initialGrades[stu.id] || {}
        const pen = grades["1"] ?? 0
        const ket = grades["2"] ?? 0
        // const status = pen >= avgPengetahuan && ket >= avgKeterampilan
        //   ? "Di atas Rata-Rata"
        //   : "Di bawah Rata-Rata"
        const status = pen >= 75 && ket >= 75
  ? "Di atas KKM"
  : "Di bawah KKM"
        return { no: i + 1, name: stu.name, pengetahuan: pen, keterampilan: ket, status }
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

  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />
  
      {/* Title + Subtext + Filter */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rekapitulasi Nilai Siswa</h1>
          <div className="text-sm text-gray-600 mt-1">
            <p><strong>Nama Kelas:</strong> {kelas?.namaKelas} | <strong>Tahun Ajaran:</strong> {kelas?.tahunAjaran} | <strong>Wali Kelas:</strong> {kelas?.waliKelas}</p>
            {/* <p>Rata-rata Pengetahuan: {avgPengetahuan.toFixed(0)} | Rata-rata Keterampilan: {avgKeterampilan.toFixed(0)}</p> */}
          </div>
        </div>
        <Select
          value={subjectId}
          onValueChange={setSubjectId}
          disabled={loadingSubjects}
        >
         <SelectTrigger className="w-[240px]">
            <SelectValue
              placeholder={
                loadingSubjects
                  ? "Memuat…"
                  : subjects.length === 0
                  ? "Tidak ada mata pelajaran"
                  : "Pilih Mata Pelajaran"
              }
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
                {getGradeDistribution(rows).map((bin, index) => {
                  const maxCount = Math.max(...getGradeDistribution(rows).map((b) => b.pengetahuan + b.keterampilan))
                  const barHeight = maxCount > 0 ? ((bin.pengetahuan + bin.keterampilan) / maxCount) * 200 : 0

                  return (
                    <div key={index} className="flex flex-col items-center gap-1 w-12 relative group cursor-pointer">
                      <div
                        className="bg-blue-600 rounded-t-md w-full transition-all duration-300 ease-in-out group-hover:bg-blue-800"
                        style={{ height: `${barHeight}px` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-6 bg-blue-900 text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                        {bin.pengetahuan + bin.keterampilan} siswa
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-12 right-0 flex justify-around">
                {getGradeDistribution(rows).map((bin, index) => (
                  <div key={index} className="w-12 text-center text-xs text-gray-500">
                    {bin.range}
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
  )  
}
