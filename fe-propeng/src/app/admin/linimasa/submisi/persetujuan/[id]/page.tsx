// 'use client'

// import { useEffect, useState } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Textarea } from '@/components/ui/textarea'
// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectTrigger,
//   SelectItem,
//   SelectContent,
//   SelectValue,
// } from '@/components/ui/select'

// export default function PersetujuanPage() {
//   const { id } = useParams()
//   const router = useRouter()

//   const [data, setData] = useState<any>(null)
//   const [event, setEvent] = useState<any>(null)
//   const [statusList, setStatusList] = useState<Record<string, string>>({})
//   const [note, setNote] = useState('')

//   const eventId = useParams().id

//   const fetchData = async () => {
//     try {
//       const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
//       if (!token) {
//         router.push('/login')
//         return
//       }

//       // Fetch event list
//       const eventRes = await fetch('/api/linimasa', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       })

//       if (!eventRes.ok) throw new Error('Gagal mengambil data linimasa')
//       const eventData = await eventRes.json()
//       const activeEvent = eventData.data.find((e: any) => e.status === 'aktif')
//       setEvent(activeEvent)

//       // Fetch submission detail
//       const submissionRes = await fetch("/api/linimasa/submisi/detail", {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token} Id ${eventId}`, // <- sesuaikan ID-nya
//         },
//       });
      

//       if (!submissionRes.ok) {
//         const text = await submissionRes.text(); // lihat isi HTML error
//         console.error("Response body:", text);
//         throw new Error('Gagal mengambil data submisi');
//       }
      
//       if (!submissionRes.ok) throw new Error('Gagal mengambil data submisi')
//       const submissionData = await submissionRes.json()
//       const found = submissionData.data.find((s: any) => s.id.toString() === id)
//       setData(found)

//       setStatusList({
//         statustier1: found.statustier1 || '',
//         statustier2: found.statustier2 || '',
//         statustier3: found.statustier3 || '',
//         statustier4: found.statustier4 || '',
//       })
//     } catch (error) {
//       console.error('Error fetching data:', error)
//     }
//   }

//   useEffect(() => {
//     if (id) fetchData()
//   }, [id])

//   const matpelByTier = (tierKey: string) => {
//     const opt = data?.[tierKey]
//     if (!opt || !event?.matpel) return '-'
//     const optionName = `${tierKey}_${opt ? 'option2' : 'option1'}`
//     return event.matpel[optionName]?.nama || '-'
//   }

//   const handleChange = (tier: string, value: string) => {
//     setStatusList((prev) => ({ ...prev, [tier]: value }))
//   }

//   const handleSubmit = async () => {
//     try {
//       const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
//       if (!token) {
//         alert('Token tidak ditemukan')
//         return
//       }

//       await fetch(`http://203.194.113.127/api/linimasa/submisi/persetujuan/${id}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           ...statusList,
//           note,
//         }),
//       })

//       alert('Persetujuan berhasil dikirim')
//       router.push('/dt-lihat-submisi-minat')
//     } catch (err) {
//       console.error(err)
//       alert('Gagal menyimpan persetujuan')
//     }
//   }

//   if (!data || !event) return <div>Loading...</div>

//   return (
//     <div className="p-6 space-y-6">
//       <div className="grid grid-cols-2 gap-4">
//         <Card className="p-4">
//           <h2 className="font-bold text-lg mb-2">
//             Informasi Jumlah Kuota Penerimaan Mata Pelajaran Peminatan
//           </h2>
//           <table className="w-full text-sm">
//             <thead>
//               <tr>
//                 <th className="text-left">Mata Pelajaran</th>
//                 <th className="text-left">Sisa Kuota</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.values(event.matpel).map((m: any) => (
//                 <tr key={m.id}>
//                   <td>{m.nama}</td>
//                   <td>{m.capacity} Siswa</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>

//         <Card className="p-4">
//           <h2 className="font-bold text-lg mb-4">
//             Formulir Persetujuan Mata Pelajaran Peminatan
//           </h2>
//           <div className="space-y-4">
//             <div>
//               <Label>NISN</Label>
//               <Input disabled value={data.id_siswa} />
//             </div>
//             <div>
//               <Label>Nama Siswa</Label>
//               <Input disabled value={data.nama_siswa} />
//             </div>

//             {[1, 2, 3, 4].map((tier) => (
//               <div key={tier}>
//                 <Label>
//                   {tier}: {matpelByTier(`tier${tier}`)}
//                 </Label>
//                 <Select
//                   value={statusList[`statustier${tier}`]}
//                   onValueChange={(val) =>
//                     handleChange(`statustier${tier}`, val)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="diterima">Diterima</SelectItem>
//                     <SelectItem value="ditolak">Ditolak</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             ))}

//             <div>
//               <Label>Catatan</Label>
//               <Textarea
//                 value={note}
//                 onChange={(e) => setNote(e.target.value)}
//                 placeholder="Contoh: Siswa ditolak di mata pelajaran pilihan 2 karena ..."
//               />
//             </div>

//             <div className="flex gap-2">
//               <Button variant="outline" onClick={() => router.back()}>
//                 Kembali
//               </Button>
//               <Button onClick={handleSubmit}>Simpan</Button>
//             </div>
//           </div>
//         </Card>
//       </div>
//     </div>
//   )
// }

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function PersetujuanPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken')
      console.log("aaaaa")
      console.log('TOKEN:', token) // ← pastikan ini tidak null

      if (!token) return

      const res = await fetch('/api/linimasa/submisi/detail', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token} Id ${id}`,
        },
      })

      const json = await res.json()
      setData(json)
    }

    fetchData()
  }, [id])

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">Data Submisi</h1>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
