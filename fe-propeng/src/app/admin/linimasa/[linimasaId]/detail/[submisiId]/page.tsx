'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { API_BASE_URL } from "@/lib/api";

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

export default function SubmisiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.linimasaId
  const submisiId = params?.submisiId
    console.log("Submisi ID:", submisiId)
console.log('params:', params)



  const [statusList, setStatusList] = useState<Record<string, string>>({
    statustier1: '',
    statustier2: '',
    statustier3: '',
    statustier4: '',
  })
  const [note, setNote] = useState('')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!eventId) return
    console.log("HELLO")

    const fetchData = async () => {
      const token = localStorage.getItem('accessToken')
    
      const res = await fetch(`http://${API_BASE_URL}/api/linimasa/submisi/${eventId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    
      const json = await res.json()
      console.log('ALL SUBMISSIONS:', json.data)
    
      // ✅ Cari data submisi yang id-nya sama dengan submisiId
      const selected = json.data.find((item: any) => item.id.toString() === submisiId)
      if (selected) {
        setData(selected)
      } else {
        alert('Submisi tidak ditemukan dalam event ini.')
      }
    }
    fetchData()
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
    }

    await fetch(`http://${API_BASE_URL}/api/linimasa/pilihan-siswa/update-status/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    alert('Persetujuan berhasil dikirim')
    router.back()
  }

  if (!data) return <div className="p-10">Loading...</div>

  const mapTier = (tier: number) => {
    return data[`tier${tier}`] ? data[`tier${tier}_nama_option2`] : data[`tier${tier}_nama_option1`]
  }

  return (
    <div className="p-10 grid md:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
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
            <Button variant="outline" onClick={() => router.back()}>
              Kembali
            </Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
