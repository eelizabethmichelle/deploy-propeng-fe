'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api'

export default function Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [submisi, setSubmisi] = useState<any>(null)
  const [isEligible, setIsEligible] = useState<boolean | null>(null)
  const [hasActiveEvent, setHasActiveEvent] = useState<boolean>(true)


  const currentYear = new Date().getFullYear()

  const getAuthToken = () => {
    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken') ||
      ''
    if (!token) {
      router.push('/login')
      return null
    }
    return token
  }

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken()
      if (!token) return

      try {
        // 1. Ambil data siswa
        const studentRes = await fetch('/api/auth/detail', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const studentData = await studentRes.json()
        const siswa = studentData.data_user
        setStudent(siswa)

        // 2. Cek kelayakan angkatan
        const isValidAngkatan =
          siswa.angkatan === currentYear - 1 ||
          siswa.angkatan === currentYear - 2
        setIsEligible(isValidAngkatan)

        if (!isValidAngkatan) return

        // 3. Cek status submisi di event aktif
        const statusRes = await fetch('/api/linimasa/active-event/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const statusData = await statusRes.json()

        if (!statusData.data?.is_active) {
          setHasActiveEvent(false)
          setSubmisi(null)
          return
        }

        setHasActiveEvent(true)
        const hasSubmitted = statusData.data?.has_submitted
        const eventId = statusData.data?.event_id

        if (hasSubmitted) {
          const submisiRes = await fetch("/api/linimasa/submisi/detail", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token} Id ${eventId}`,
            },
          })
          const { data } = await submisiRes.json()
          const currentUserSubmission = data.find((s: any) => s.id_siswa === siswa.id)
          setSubmisi(currentUserSubmission)
        } else {
          setSubmisi(null)
        }

      } catch (error) {
        console.error('Gagal mengambil data:', error)
        toast.error('Gagal memuat data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statusText = (val: boolean | null) => {
    if (val === true) return '✅ Diterima'
    if (val === false) return '❌ Ditolak'
    return '⏳ Belum Diproses'
  }

  if (loading) return <p className="p-4">Loading...</p>

  if (isEligible === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border border-gray-300 shadow-md rounded-xl p-6 bg-white">
          <CardContent>
            <h2 className="text-xl font-semibold text-[#041765] mb-2">
              Angkatan Anda belum berhak memilih Mata Pelajaran Peminatan
            </h2>
            <p className="text-base text-gray-600 font-medium">
              Fitur ini hanya tersedia untuk siswa kelas 11 dan 12. Hubungi wali kelas Anda jika ini adalah kesalahan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // console.log ("----------")
  // console.log(hasActiveEvent)
  if (!hasActiveEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 ">
        <Card className="max-w-md w-full text-center border border-gray-300 shadow-md rounded-xl p-6 bg-white">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Tidak ada pendaftaran mata pelajaran peminatan yang sedang dibuka.
            </h2>
            <p className="text-base text-gray-600 font-medium">
              Silakan cek kembali saat periode pendaftaran dibuka oleh pihak sekolah.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 ">
      <Card className="max-w-md w-full shadow-md rounded-2xl p-6 text-center">
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Pendaftaran Mata Pelajaran Peminatan
            </h1>
            <p className="text-sm text-gray-500">
              Halaman ini digunakan oleh siswa kelas 11 & 12 untuk memilih 4 mata pelajaran peminatan dalam periode linimasa yang aktif.
            </p>
          </div>

          <div className="text-left text-sm text-gray-600 border rounded-lg p-4 bg-gray-100">
            <p><strong>Nama:</strong> {student?.username}</p>
            <p><strong>NISN:</strong> {student?.nisn || '-'}</p>
          </div>

          

          {!submisi ? (
            <>
              <p className="text-base font-medium text-yellow-600">
                Anda belum mengajukan mata pelajaran peminatan.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push('/siswa/mata-pelajaran-peminatan/daftar')}
              >
                Daftarkan Mata Pelajaran Peminatan
              </Button>
              <div className="text-xs text-left text-gray-500 mt-2">
                <p>✅ Pilih 4 mata pelajaran peminatan.</p>
                <p>📆 Pastikan linimasa pendaftaran masih aktif.</p>
                <p>📝 Setelah memilih, tekan tombol "Daftar".</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-left text-sm text-gray-600 border rounded-lg p-4 bg-white space-y-2">
                <p><strong>Tanggal Pendaftaran:</strong> {new Date(submisi.submitted_at).toLocaleString()}</p>
                <p><strong>Mata pelajaran yang dipilih</strong> </p>
                <p><strong>1:</strong> {submisi.tier1 ? submisi.tier1_nama_option2 : submisi.tier1_nama_option1} — {statusText(submisi.statustier1)}</p>
                <p><strong>2:</strong> {submisi.tier2 ? submisi.tier2_nama_option2 : submisi.tier2_nama_option1} — {statusText(submisi.statustier2)}</p>
                <p><strong>3:</strong> {submisi.tier3 ? submisi.tier3_nama_option2 : submisi.tier3_nama_option1} — {statusText(submisi.statustier3)}</p>
                <p><strong>4:</strong> {submisi.tier4 ? submisi.tier4_nama_option2 : submisi.tier4_nama_option1} — {statusText(submisi.statustier4)}</p>
              </div>



              {[submisi.statustier1, submisi.statustier2, submisi.statustier3, submisi.statustier4].some((s) => s === null) ? (
                <p className="text-yellow-600 mt-2">Pendaftaran Anda sedang diulas oleh wali kelas.</p>
              ) : (
                <>
                  <div className="text-left text-sm text-gray-600 border rounded-lg p-4 bg-white space-y-2 mt-2">
                    <p className="font-semibold">Catatan dari Wali Kelas:</p>
                    <p>{submisi.note ? submisi.note : "Tidak ada catatan."}</p>
                  </div>
                  <p className="text-green-600 mt-2">
                    Pendaftaran Anda telah diulas dan Anda telah terdaftar ke mata pelajaran yang bersangkutan.
                  </p>

                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
