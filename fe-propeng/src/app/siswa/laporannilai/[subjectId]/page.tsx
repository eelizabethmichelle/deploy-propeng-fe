// src/app/siswa/laporannilai/[subjectId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { GradeDetailDataTable } from "@/components/ui/grade-details/grade-detail-data-table"
import type { ComponentGrade } from "@/components/ui/grade-details/schema"

// Define the API response types locally
interface SubjectGradeItemFromApi {
  id: string
  nama: string
  komponen: string
  bobot: number
  nilai: number
}

interface SubjectGradeFromApi {
  id: string
  nama: string
  capaian_keterampilan: string | null
  capaian_pengetahuan: string | null
  pengetahuan: SubjectGradeItemFromApi[] | null
  keterampilan: SubjectGradeItemFromApi[] | null
  rata_rata_pengetahuan: number | null
  rata_rata_keterampilan: number | null
}

interface StudentGradesDataFromApi {
  nilai_siswa: SubjectGradeFromApi[] | null
}

// Helper to format score
const formatScore = (score: number | null | undefined): string => {
  if (typeof score === "number" && !isNaN(score)) {
    return score.toFixed(2)
  }
  return "-"
}

export default function SubjectDetailPage() {
  const params = useParams()
  const subjectId = Array.isArray(params.subjectId) ? params.subjectId[0] : params.subjectId

  const [subjectData, setSubjectData] = useState<SubjectGradeFromApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId) {
      setError("ID Mata Pelajaran tidak valid atau tidak ditemukan di URL.")
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setSubjectData(null)
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")

      if (!accessToken) {
        setError("Autentikasi gagal. Silakan login kembali.")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/nilai/summarystudent`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        })

        const allGradesData: StudentGradesDataFromApi = await response.json()

        if (!response.ok) {
          throw new Error(`Gagal memuat data nilai: ${response.statusText}`)
        }

        const foundSubject = allGradesData.nilai_siswa?.find((subj) => subj.id === subjectId)

        if (foundSubject) {
          setSubjectData(foundSubject)
        } else {
          setError(`Data untuk Mata Pelajaran dengan ID ${subjectId} tidak ditemukan.`)
        }
      } catch (err) {
        console.error("Error fetching or processing subject details:", err)
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  // Map API data to component schema
  const mapToComponentGrade = (items: SubjectGradeItemFromApi[] | null): ComponentGrade[] => {
    if (!items) return []

    return items.map((item) => ({
      komponen: item.komponen,
      bobot: item.bobot,
      nilai: item.nilai,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto py-6 px-4 text-destructive text-center">{error}</div>
  }

  if (!subjectData) {
    return <div className="container mx-auto py-6 px-4 text-center">Data mata pelajaran tidak dapat ditampilkan.</div>
  }

  const pengetahuanComponents = mapToComponentGrade(subjectData.pengetahuan)
  const keterampilanComponents = mapToComponentGrade(subjectData.keterampilan)

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">

      {/* Subject Name */}
      <h1 className="text-xl font-bold mb-6">{subjectData.nama}</h1>

      {/* Capaian Kompetensi Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Capaian Kompetensi</h2>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="py-4 px-6 font-medium w-1/3">Capaian Kompetensi Keterampilan</td>
                <td className="py-4 px-6">{subjectData.capaian_keterampilan || "-"}</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium w-1/3">Capaian Kompetensi Pengetahuan</td>
                <td className="py-4 px-6">{subjectData.capaian_pengetahuan || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Nilai Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Detail Nilai</h2>

        {/* Nilai Pengetahuan */}
        <div className="mb-8">
          <h3 className="text-base font-medium mb-3">Nilai Pengetahuan</h3>
          <GradeDetailDataTable
            components={pengetahuanComponents}
            averageScore={subjectData.rata_rata_pengetahuan}
            averageLabel="Rata-Rata Nilai Pengetahuan"
          />
        </div>

        {/* Nilai Keterampilan */}
        <div>
          <h3 className="text-base font-medium mb-3">Nilai Keterampilan</h3>
          <GradeDetailDataTable
            components={keterampilanComponents}
            averageScore={subjectData.rata_rata_keterampilan}
            averageLabel="Rata-Rata Nilai Keterampilan"
          />
        </div>
      </div>
    </div>
  )
}
