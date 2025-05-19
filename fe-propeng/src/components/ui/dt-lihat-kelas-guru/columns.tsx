import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {/* Handle in the page component */}}
          className="dashboard-button"
          data-id={kelas.id}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      )
    }
  }
]