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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { useRouter } from "next/router"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [activeTab, setActiveTab] = useState("pengetahuan")


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

  const columns = useMemo<ColumnDef<GradeRow>[]>(
    () => [
      { 
        id: "no", 
        header: () => <div className="text-center">No</div>,
        accessorFn: (_r, idx) => idx + 1,
        cell: ({ getValue }) => <div className="flex justify-center">{getValue<number>()}</div>
      },
      { 
        accessorKey: "name", 
        header: "Nama Siswa" 
      },
      {
        accessorKey: "pengetahuan",
        header: () => <div className="text-center">Nilai Pengetahuan</div>,
        cell: ({ getValue }) => (
          <div className="flex justify-center w-full">
            {getValue<number>().toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "keterampilan",
        header: () => <div className="text-center">Nilai Keterampilan</div>,
        cell: ({ getValue }) => (
          <div className="flex justify-center w-full">
            {getValue<number>().toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="">Status</div>,
        cell: ({ getValue }) => {
          const value = getValue<string>()
          return (
            <div className="flex w-full">
              {value === "Di atas KKM" ? (
                <Badge variant="secondary">{value}</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">{value}</Badge>
              )}
            </div>
          )
        },        
      },
    ],
    []
  )

  const rows: GradeRow[] = gradeData
    ? gradeData.students
    .filter((stu) => studentIdsInClass.includes(stu.id)) 
    .map((stu, i) => {
        const grades = gradeData.initialGrades[stu.id] || {}
        
        // Get Pengetahuan components and their weights
        const penComponents = gradeData.assessmentComponents
          .filter(comp => comp.type === "Pengetahuan")
          .map(comp => ({
            id: comp.id,
            weight: comp.weight
          }))

        // Get Keterampilan components and their weights
        const ketComponents = gradeData.assessmentComponents
          .filter(comp => comp.type === "Keterampilan")
          .map(comp => ({
            id: comp.id,
            weight: comp.weight
          }))

        // Calculate weighted average for Pengetahuan
        let penTotal = 0
        let penWeightTotal = 0
        penComponents.forEach(comp => {
          const grade = grades[comp.id]
          if (grade !== null && grade !== undefined) {
            penTotal += grade * comp.weight
            penWeightTotal += comp.weight
          }
        })
        const pen = penWeightTotal > 0 ? Number((penTotal / penWeightTotal).toFixed(2)) : 0

        // Calculate weighted average for Keterampilan
        let ketTotal = 0
        let ketWeightTotal = 0
        ketComponents.forEach(comp => {
          const grade = grades[comp.id]
          if (grade !== null && grade !== undefined) {
            ketTotal += grade * comp.weight
            ketWeightTotal += comp.weight
          }
        })
        const ket = ketWeightTotal > 0 ? Number((ketTotal / ketWeightTotal).toFixed(2)) : 0

        const status = pen >= 75 && ket >= 75 ? "Di atas KKM" : "Di bawah KKM"
        
        return { 
          no: i + 1, 
          name: stu.name, 
          pengetahuan: pen, 
          keterampilan: ket, 
          status 
        }
      })
    : []

  const needsGuidanceCount = gradeData
    ? gradeData.students.filter((stu) => {
        const grades = gradeData.initialGrades[stu.id] || {}
        
        // Get Pengetahuan components and their weights
        const penComponents = gradeData.assessmentComponents
          .filter(comp => comp.type === "Pengetahuan")
          .map(comp => ({
            id: comp.id,
            weight: comp.weight
          }))

        // Get Keterampilan components and their weights
        const ketComponents = gradeData.assessmentComponents
          .filter(comp => comp.type === "Keterampilan")
          .map(comp => ({
            id: comp.id,
            weight: comp.weight
          }))

        // Calculate weighted average for Pengetahuan
        let penTotal = 0
        let penWeightTotal = 0
        penComponents.forEach(comp => {
          const grade = grades[comp.id]
          if (grade !== null && grade !== undefined) {
            penTotal += grade * comp.weight
            penWeightTotal += comp.weight
          }
        })
        const pen = penWeightTotal > 0 ? Number((penTotal / penWeightTotal).toFixed(2)) : 0

        // Calculate weighted average for Keterampilan
        let ketTotal = 0
        let ketWeightTotal = 0
        ketComponents.forEach(comp => {
          const grade = grades[comp.id]
          if (grade !== null && grade !== undefined) {
            ketTotal += grade * comp.weight
            ketWeightTotal += comp.weight
          }
        })
        const ket = ketWeightTotal > 0 ? Number((ketTotal / ketWeightTotal).toFixed(2)) : 0

        return pen < 75 || ket < 75
      }).length
    : 0

  console.log(studentIdsInClass)

  const getGradeDistribution = (rows: GradeRow[], type: string) => {
    const ranges = [
      { label: "0-10", min: 0, max: 10.99 },
      { label: "11-20", min: 11, max: 20.99 },
      { label: "21-30", min: 21, max: 30.99 },
      { label: "31-40", min: 31, max: 40.99 },
      { label: "41-50", min: 41, max: 50.99 },
      { label: "51-60", min: 51, max: 60.99 },
      { label: "61-70", min: 61, max: 70.99 },
      { label: "71-80", min: 71, max: 80.99 },
      { label: "81-90", min: 81, max: 90.99 },
      { label: "91-100", min: 91, max: 100 }
    ]
    return ranges.map((range) => {
      const count = rows.filter((r) => {
        if (type === "pengetahuan") {
          return r.pengetahuan >= range.min && r.pengetahuan <= range.max
        } else if (type === "keterampilan") {
          return r.keterampilan >= range.min && r.keterampilan <= range.max
        } else {
          const avg = (r.pengetahuan + r.keterampilan) / 2
          return avg >= range.min && avg <= range.max
        }
      }).length
      return { range: range.label, count }
    })
  }

  const chartConfig = {
    count: {
      label: "Jumlah Siswa",
      color: "hsl(var(--primary))",
    },
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
          {/* <h2 className="text-lg font-semibold mb-4">Grafik Persebaran Nilai</h2>   */}
          <div className="flex gap-10 items-start w-full max-w-6xl">
            {/* Chart */}
            <Card className="flex-1">
              <CardContent className="pt-6">
                <Tabs defaultValue="pengetahuan" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="bg-white border border-gray-200 rounded-lg p-1 w-[556px] h-[40px] mb-4">
                    <TabsTrigger
                      value="pengetahuan"
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-[#041765] transition-all data-[state=active]:bg-[#EEF1FB] data-[state=active]:text-[#041765] data-[state=active]:shadow-sm"
                    >
                      Pengetahuan
                    </TabsTrigger>
                    <TabsTrigger
                      value="keterampilan"
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-[#041765] transition-all data-[state=active]:bg-[#EEF1FB] data-[state=active]:text-[#041765] data-[state=active]:shadow-sm"
                    >
                      Keterampilan
                    </TabsTrigger>
                    <TabsTrigger
                      value="rata-rata"
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-[#041765] transition-all data-[state=active]:bg-[#EEF1FB] data-[state=active]:text-[#041765] data-[state=active]:shadow-sm"
                    >
                      Rata-rata
                    </TabsTrigger>
                  </TabsList>

                  <ChartContainer config={chartConfig}>
                    <BarChart
                      data={getGradeDistribution(rows, activeTab)}
                      margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis 
                        dataKey="range" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Range
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {payload[0].payload.range}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Jumlah
                                    </span>
                                    <span className="font-bold">
                                      {payload[0].value} siswa
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </Tabs>
              </CardContent>
            </Card>

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
