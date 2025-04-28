import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AttendanceSummaryData } from "./schema"

interface AttendanceSummaryTableProps {
  data: AttendanceSummaryData | null
  isLoading: boolean
  error?: string | null
}

export function AttendanceSummaryTable({ data, isLoading, error }: AttendanceSummaryTableProps) {
  const isAvailable = !isLoading && !error && data?.rekap_kehadiran

  // Get values for each attendance type, or empty string if not present or zero
  const getSafeValue = (type: string): string => {
    if (!isAvailable) return ""
    const value = (data?.rekap_kehadiran as any)[type]
    return value && value > 0 ? value.toString() : ""
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
                <TableCell className="font-medium">Sakit</TableCell>
                <TableCell className="text-left">{sakitValue && `${sakitValue} hari`}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Izin</TableCell>
                <TableCell className="text-left">{izinValue && `${izinValue} hari`}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tanpa Keterangan</TableCell>
                <TableCell className="text-left">{alfaValue && `${alfaValue} hari`}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
