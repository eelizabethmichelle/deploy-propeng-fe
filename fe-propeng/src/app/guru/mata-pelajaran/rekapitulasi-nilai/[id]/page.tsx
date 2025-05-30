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
import { ArrowRight, Users, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import type { ColumnDef } from "@tanstack/react-table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  subjectName: string
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
  const [activeTab, setActiveTab] = useState("pengetahuan")

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
      .then((data) => {
        setGradeData(data)
        if (!data.students || data.students.length === 0) {
          toast.error("Belum ada data siswa", {
            description: "Silakan tambahkan data siswa terlebih dahulu",
            duration: 5000,
          })
        } else if (Object.keys(data.initialGrades).length === 0) {
          toast.error("Belum ada data nilai", {
            description: "Silakan input nilai siswa terlebih dahulu",
            duration: 5000,
          })
        }
      })
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
        header: () => <div className="text-center">Nilai Pengetahuan</div>,
        cell: ({ getValue }) => <div className="text-center">{getValue<number>().toFixed(2)}</div>,
      },
      {
        accessorKey: "keterampilan",
        header: () => <div className="text-center">Nilai Keterampilan</div>,
        cell: ({ getValue }) => <div className="text-center">{getValue<number>().toFixed(2)}</div>,
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }) => {
          const value = getValue<string>()
          return (
            <div className="flex justify-center">
              {value === "Di atas KKM" ? (
                <Badge className="bg-green-100 text-green-800 w-[120px] text-center flex items-center justify-center">Di atas KKM</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 w-[120px] text-center flex items-center justify-center">Di bawah KKM</Badge>
              )}
            </div>
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

      const pen = Number(avg(penScores).toFixed(2))
      const ket = Number(avg(ketScores).toFixed(2))
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

  const getGradeDistribution = (rows: GradeRow[], type: string) => {
    // Get all values for the selected type
    const values = rows.map(r => {
      if (type === "pengetahuan") return r.pengetahuan
      if (type === "keterampilan") return r.keterampilan
      return (r.pengetahuan + r.keterampilan) / 2
    }).filter(v => !isNaN(v))

    if (values.length === 0) return []

    // Create static ranges with 10-unit intervals, from lowest to highest
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

    // Count values in each bin
    return ranges.map(range => {
      const count = values.filter(v => v >= range.min && v <= range.max).length
      return { range: range.label, count }
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
  
  const chartConfig = {
    count: {
      label: "Jumlah Siswa",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <div className="p-6 space-y-8">
      <Toaster />
      {/* Title + Subtext + Filter */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rekapitulasi Nilai Siswa Mata Pelajaran {gradeData?.subjectName}</h1>
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
         {/* <h2 className="text-lg font-semibold mb-1">Grafik Persebaran Nilai</h2>   */}
         <div className="flex gap-10 items-start w-full">
            {/* Chart Card */}
            <Card className="flex-[1] shadow-md h-[600px]">
              <CardContent className="p-6 h-full">
                {(!gradeData?.students || gradeData.students.length === 0) ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-lg">Belum ada data siswa</p>
                  </div>
                ) : Object.keys(gradeData.initialGrades).length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-lg">Belum ada data nilai</p>
                  </div>
                ) : (
                  <Tabs defaultValue="pengetahuan" className="w-full h-full" onValueChange={setActiveTab}>
                    <TabsList className="bg-white border border-gray-200 rounded-lg p-1 w-full h-[40px] mb-4">
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
                        Rata-rata Pengetahuan dan Keterampilan
                      </TabsTrigger>
                    </TabsList>

                    <ChartContainer config={chartConfig} className="h-[calc(100%-60px)]">
                      <BarChart
                        data={getGradeDistribution(rows, activeTab)}
                        margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                        barSize={70}
                      >
                        <CartesianGrid 
                          horizontal={true} 
                          vertical={false} 
                          strokeDasharray="3 3" 
                          className="stroke-border/70" 
                        />
                        <XAxis 
                          dataKey="range" 
                          tickLine={{ stroke: '#000' }}
                          axisLine={{ stroke: '#000' }}
                          tickMargin={20}
                          interval={0}
                          width={100}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tickLine={{ stroke: '#000' }}
                          axisLine={{ stroke: '#000' }}
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
                )}
              </CardContent>
            </Card>

            {/* Scorecards Card */}
            <Card className="w-[1000px] shadow-md h-[600px]">
              <CardContent className="p-6 h-full">
                {rows.length > 0 && (
                  <div className="flex flex-col gap-6 h-full">
                    <Card className="bg-blue-50 shadow-md rounded-lg">
                      <CardContent className="flex items-center justify-start gap-6 px-8 py-6">
                        <Users className="w-10 h-10 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Total Siswa</p>
                          <p className="text-3xl font-bold">{rows.length} Siswa</p>
                        </div>
                      </CardContent>
                    </Card>

                    {needsGuidanceCount === 0 ? (
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="bg-green-50 shadow-md rounded-lg">
                              <CardContent className="flex items-center justify-start gap-6 px-8 py-6">
                                <Star className="w-10 h-10 text-green-500" />
                                <div>
                                  <p className="text-xl font-bold text-green-700">Performa siswa sudah memuaskan!</p>
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>Semua siswa telah mencapai target dengan nilai rerata pengetahuan dan keterampilan di atas 75</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    ) : (
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="bg-red-50 shadow-md rounded-lg">
                              <CardContent className="flex items-center justify-start gap-6 px-8 py-6">
                                <ArrowRight className="w-10 h-10 text-red-500" />
                                <div>
                                  <p className="text-sm font-medium text-red-700">Siswa Butuh Bimbingan</p>
                                  <p className="text-3xl font-bold">{needsGuidanceCount} Siswa</p>
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>Siswa yang membutuhkan bimbingan adalah siswa dengan nilai rerata pengetahuan &lt; 75 dan rerata keterampilan &lt; 75</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    )}

                    <Card className="bg-purple-50 shadow-md rounded-lg">
                      <CardContent className="flex items-center justify-start gap-6 px-8 py-6">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-purple-600">KKM</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-700">Kriteria Ketuntasan Minimal</p>
                          <p className="text-3xl font-bold text-purple-600">75</p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2 mt-auto">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Siswa yang membutuhkan bimbingan adalah siswa dengan nilai rerata pengetahuan &lt; 75 dan rerata keterampilan &lt; 75
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Semua siswa telah mencapai target dengan nilai rerata pengetahuan dan keterampilan di atas 75
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
  
          {/* Table */}
          <div className="mt-1">
            <DataTable columns={columns} data={rows} />
          </div>
        </>
      )}
    </div>
  )
} 