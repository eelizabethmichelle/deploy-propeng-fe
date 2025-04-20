'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { API_BASE_URL } from "@/lib/api"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

export default function SubmisiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.linimasaId
  const submisiId = params?.submisiId

  const [statusList, setStatusList] = useState<Record<string, string>>({
    statustier1: '',
    statustier2: '',
    statustier3: '',
    statustier4: '',
  })
  const [note, setNote] = useState('')
  const [data, setData] = useState<any>(null)
  const [kuotaMatpel, setKuotaMatpel] = useState<any[]>([])

  useEffect(() => {
    if (!eventId) return

    const token = localStorage.getItem('accessToken')

    const fetchSubmisiData = async () => {
      const res = await fetch(`http://${API_BASE_URL}/api/linimasa/submisi/${eventId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      const selected = json.data.find((item: any) => item.id.toString() === submisiId)
      if (selected) {
        setData(selected)
      } else {
        toast.error('Submisi tidak ditemukan dalam event ini.')
      }
    }

    const fetchKuotaMatpel = async () => {
      const [eventRes, matpelRes] = await Promise.all([
        fetch(`/api/linimasa`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/mata-pelajaran/view-all`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const eventJson = await eventRes.json()
      const matpelJson = await matpelRes.json()

      const event = eventJson.data.find((e: any) => e.status === 'aktif')
      if (!event) return

      const allMatpel = Object.values(event.matpel)

      const enriched = allMatpel.map((m: any) => {
        const found = matpelJson.data.find((mp: any) => mp.id === m.id)
        const jumlah = found?.jumlah_siswa || 0
        return {
          id: m.id,
          nama: m.nama,
          sisa: m.capacity - jumlah,
        }
      })

      setKuotaMatpel(enriched)
    }

    fetchSubmisiData()
    fetchKuotaMatpel()
  }, [submisiId])

  const handleChange = (tier: string, value: string) => {
    setStatusList((prev) => ({ ...prev, [tier]: value }))
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem('accessToken')
    const body = {
      pilihan_id: data.id,
      tier1: statusList.statustier1 === 'diterima',
      tier2: statusList.statustier2 === 'diterima',
      tier3: statusList.statustier3 === 'diterima',
      tier4: statusList.statustier4 === 'diterima',
      note: note,
    }

    await fetch(`http://${API_BASE_URL}/api/linimasa/pilihan-siswa/update-status/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    toast.success('Persetujuan berhasil dikirim')
    router.back()
  }

  if (!data) return <div className="p-10">Loading...</div>

  const mapTier = (tier: number) => {
    return data[`tier${tier}`] ? data[`tier${tier}_nama_option2`] : data[`tier${tier}_nama_option1`]
  }

  return (
    <div className="p-6 grid md:grid-cols-3 gap-6">
      {/* Form Persetujuan */}
      <Card className="p-6 space-y-4 col-span-2">
        <h2 className="text-center font-semibold">Formulir Persetujuan</h2>

        <div className="space-y-4">
          <div>
            <Label>NISN</Label>
            <Input disabled value={data.id_siswa} />
          </div>

          <div>
            <Label>Nama Siswa</Label>
            <Input disabled value={data.nama_siswa} />
          </div>

          <div>
            <Label>Mata Pelajaran yang Dipilih</Label>
            {[1, 2, 3, 4].map((tier) => (
              <div key={tier} className="flex items-center justify-between gap-4">
                <span className="font-medium text-foreground">
                  {tier}: {mapTier(tier)}
                </span>
                <Select
                  value={statusList[`statustier${tier}`]}
                  onValueChange={(val) => handleChange(`statustier${tier}`, val)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diterima">Diterima</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div>
            <Label>Catatan</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Siswa ditolak di mata pelajaran pilihan 2 karena ..."
            />
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={() => router.back()}>
              Kembali
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Simpan</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Ubah Status</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin mengubah status submisi ini?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>Ya, Ubah</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Kuota Matpel */}
      <Card className="p-4 rounded-xl border shadow-sm h-fit">
        <div className="text-center font-semibold text-base mb-4">
          Informasi Jumlah Kuota Penerimaan <br /> Mata Pelajaran Peminatan
        </div>

        <div className="grid grid-cols-2 text-sm font-semibold bg-gray-100 px-4 py-2 text-gray-600 border-b">
          <div>Mata Pelajaran</div>
          <div className="text-right">Sisa Kuota</div>
        </div>

        {kuotaMatpel.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-2 px-4 py-2 text-sm text-gray-700 border-b last:border-none"
          >
            <div>{item.nama}</div>
            <div className="text-right">{item.sisa} Siswa</div>
          </div>
        ))}
      </Card>
    </div>
  )
}
