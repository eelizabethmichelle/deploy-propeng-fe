// File: src/app/api/nilai/student/by-class/[kelasId]/route.tsx
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type { AttendanceSummaryData } from "./schema"

interface AttendanceSummaryTableProps {
  data: AttendanceSummaryData | null
  isLoading: boolean
  error?: string | null
}

export function AttendanceSummaryTable({ data, isLoading, error }: AttendanceSummaryTableProps) {
  const isAvailable = !isLoading && !error && data?.rekap_kehadiran

  // Get values for each attendance type, defaulting to "0" if not present or zero
  const getSafeValue = (type: string): string => {
    if (!isAvailable) return "0"
    const value = (data?.rekap_kehadiran as any)[type]
    return value && value > 0 ? value.toString() : "0"
  }

  const sakitValue = getSafeValue("Sakit")
  const izinValue = getSafeValue("Izin")
  const alfaValue = getSafeValue("Alfa")

  return (
    <div className="mt-6 border-t pt-6">
      <h2 className="text-lg font-semibold mb-4">Kehadiran</h2>

      {isLoading && <p className="text-sm text-muted-foreground mb-4">Memuat data kehadiran...</p>}
      {error && !isLoading && <p className="text-sm text-destructive mb-4">{error}</p>}
      {!isLoading && !error && !isAvailable && (
        <p className="text-sm text-muted-foreground mb-4">Data kehadiran tidak tersedia.</p>
      )}

      {isAvailable && (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="flex justify-between items-center">
                  <span className="font-medium">Sakit</span>
                  <span>{sakitValue} hari</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex justify-between items-center">
                  <span className="font-medium">Izin</span>
                  <span>{izinValue} hari</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex justify-between items-center">
                  <span className="font-medium">Tanpa Keterangan</span>
                  <span>{alfaValue} hari</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
