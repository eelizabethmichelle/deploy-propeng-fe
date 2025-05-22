import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export type Kelas = {
  id: number
  namaKelas: string
  tahunAjaran: number | string
  totalSiswa: number
  status: string
}

export const kelasColumns: ColumnDef<Kelas>[] = [
  {
    accessorKey: "namaKelas",
    header: "Nama Kelas",
  },
  {
    accessorKey: "tahunAjaran",
    header: "Tahun Ajaran",
  },
  {
    accessorKey: "totalSiswa",
    header: "Total Siswa",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const kelas = row.original
      
      return (
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="dashboard-button">
            <Link href={`/guru/kelas/dashboard/${kelas.id}`}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Dashboard Absensi
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="dashboard-button">
            <Link href={`/guru/kelas/dashboard-nilai/${kelas.id}`}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Dashboard Nilai
            </Link>
          </Button>
        </div>
      )
    }
  }
]