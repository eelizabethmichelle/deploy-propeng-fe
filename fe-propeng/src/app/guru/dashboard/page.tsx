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
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<string>("")
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [studentIdsInClass, setStudentIdsInClass] = useState<string[]>([])
  const [kelas, setKelas] = useState<Kelas>()


  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""

  useEffect(() => {
    if (!token) {
      toast.error("Token otentikasi tidak ditemukan.")
      setLoadingSubjects(false)
      return
    }
  
    fetch("/api/kelas/saya", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || `(${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        const kelasData = data.data?.[0] // ambil kelas pertama
        if (!kelasData) {
          throw new Error("Tidak ada data kelas.")
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
          namaKelas: data.data[0].namaKelas,
          tahunAjaran: data.data[0].tahunAjaran,
          waliKelas: data.data[0].waliKelas,
          id: data.data[0].id,
        })
        const siswaInKelas = (kelasData.siswa || []).map((s: any) => String(s.id))
        setStudentIdsInClass(siswaInKelas)
        if (matpelUnik[0]) setSubjectId(String(matpelUnik[0].id))
      })
      .catch((e: any) => toast.error(e.message || "Gagal memuat mata pelajaran unik"))
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
          <h1 className="text-2xl font-semibold">Daftar Nilai Siswa</h1>
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
          {/* Chart */}
          {rows.length > 0 && (
            <div className="mt-2">
              <h2 className="text-lg font-semibold mb-4">Grafik Persebaran Nilai</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getGradeDistribution(rows)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pengetahuan" fill="#3b82f6" name="Nilai Pengetahuan" />
                  <Bar dataKey="keterampilan" fill="#facc15" name="Nilai Keterampilan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
  
          {/* Score cards */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-red-50">
              <CardContent className="flex items-center justify-start gap-4 px-6 py-4">
                <ArrowRight className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-red-700">Siswa Butuh Bimbingan</p>
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
  
          {/* Table */}
          <div className="mt-6">
            <DataTable columns={columns} data={rows} />
          </div>
        </>
      )}
    </div>
  )  
}
