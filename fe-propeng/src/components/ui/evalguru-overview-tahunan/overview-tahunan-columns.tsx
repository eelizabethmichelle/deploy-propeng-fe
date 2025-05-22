'use client';

import { ColumnDef, Column, Row, CellContext } from "@tanstack/react-table";
import { FlattenedEvaluasiGuruOverview, variabelColumnsMap } from "./schema"; // Pastikan schema diperbarui
import { OverviewTahunanRowActions } from "./overview-tahunan-row-actions";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./sort";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckCircledIcon, ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons"; // Ikon untuk ParticipationChip

// --- Komponen ParticipationChip ---
interface ParticipationChipDisplayProps {
  pengisi?: number;
  totalSiswa?: number;
  className?: string;
}
const ParticipationChip: React.FC<ParticipationChipDisplayProps> = ({ pengisi, totalSiswa, className }) => {
  if (typeof pengisi !== 'number' || typeof totalSiswa !== 'number' || totalSiswa === 0) {
    return (
        <div className={cn("flex", className)}>
             <Badge variant="outline" className="text-xs px-2 py-0.5 border-dashed text-muted-foreground">
                <InfoCircledIcon className="mr-1 h-3 w-3" /> Partisipasi N/A
            </Badge>
        </div>
    );
  }

  const percentage = (pengisi / totalSiswa) * 100;
  const roundedPercentage = Math.round(percentage);

  let colorClasses = "";
  let chipText = `${roundedPercentage}% Partisipasi`;
  let IconComponent: React.ElementType | null = null;

  if (roundedPercentage < 50) {
    colorClasses = "bg-red-100 text-red-700 border-red-200 hover:bg-red-100/90 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
    chipText = `${roundedPercentage}% Partisipasi`;
    IconComponent = ExclamationTriangleIcon;
  } else if (roundedPercentage < 100) {
    colorClasses = "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100/90 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
    IconComponent = InfoCircledIcon;
  } else { // 100%
    colorClasses = "bg-green-100 text-green-700 border-green-200 hover:bg-green-100/90 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600";
    chipText = `${roundedPercentage}% Partisipasi`;
    IconComponent = CheckCircledIcon;
  }

  return (
    <div className={cn("flex", className)}>
      <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-medium", colorClasses)}>
        {IconComponent && <IconComponent className="mr-1 h-3 w-3" />}
        {chipText}
      </Badge>
    </div>
  );
};
// --- Akhir Komponen ParticipationChip ---


export const overviewTahunanColumns: ColumnDef<FlattenedEvaluasiGuruOverview>[] = [
    {
        accessorKey: "nama_guru",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Guru" />,
        cell: ({ row }) => <div>{row.getValue("nama_guru")}</div>,
        size: 200,
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const rowValue = row.getValue(id) as string;
            return value.includes(rowValue);
        }
    },
    {
        accessorKey: "tahun_ajaran",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
        cell: ({ row }) => {
            const yearString = row.getValue("tahun_ajaran") as string;
            if (yearString && /^\d{4}$/.test(yearString)) {
                const startYear = parseInt(yearString, 10);
                return <div className="text-center whitespace-nowrap">{`TA ${startYear}/${startYear + 1}`}</div>;
            }
            return <div className="text-center">{yearString || "-"}</div>;
        },
        size: 130,
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const rowValue = row.getValue(id) as string;
            return value.includes(rowValue);
        }
    },
    // --- Kolom Baru: Partisipasi Total ---
    {
        id: "partisipasi_total_kumulatif", // ID unik untuk kolom
        header: ({ column }) => <DataTableColumnHeader column={column} title="Partisipasi Total" />,
        accessorFn: (row) => { // Accessor untuk sorting dan filtering jika diperlukan
            const pengisi = row.jumlah_pengisi_kumulatif;
            const total = row.jumlah_siswa_kumulatif;
            if (typeof pengisi === 'number' && typeof total === 'number' && total > 0) {
                return (pengisi / total) * 100;
            }
            return -1; // Nilai default untuk data tidak valid agar bisa diurutkan
        },
        cell: ({ row }) => {
            const pengisi = row.original.jumlah_pengisi_kumulatif;
            const totalSiswa = row.original.jumlah_siswa_kumulatif;
            
            const displayValue = (typeof pengisi === 'number' && typeof totalSiswa === 'number') 
                ? `${pengisi}/${totalSiswa}` 
                : '-/-';

            return (
                <div className="text-center space-y-0.5">
                    <div className="font-medium">{displayValue}</div>
                    <ParticipationChip pengisi={pengisi} totalSiswa={totalSiswa} className="justify-center"/>
                </div>
            );
        },
        enableSorting: true, // Jika Anda ingin mengaktifkan sorting berdasarkan persentase
        size: 180,
    },
    // --- Akhir Kolom Baru ---
    {
        accessorKey: "mata_pelajaran_summary",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mata Pelajaran Diajar" />,
        cell: ({ row }) => {
            const mapelList = row.getValue("mata_pelajaran_summary") as string[] | undefined | null;
            if (!mapelList || mapelList.length === 0) { return <div className="text-center">-</div>; }
            const allMapelTooltip = mapelList.join(", "); const firstMapelName = mapelList[0]; const remainingCount = mapelList.length - 1;
            return (<div className="flex items-center flex-wrap gap-x-1"><Badge variant="outline" className="bg-white dark:bg-slate-950 dark:border-slate-800 h-5 px-1.5 font-normal text-xs whitespace-nowrap">{firstMapelName}</Badge>{remainingCount > 0 && (<TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild><Badge variant="outline" className="bg-white dark:bg-slate-950 dark:border-slate-800 h-5 px-1.5 text-xs whitespace-nowrap cursor-default">+{remainingCount}</Badge></TooltipTrigger><TooltipContent className="max-w-xs"><p className="text-xs">{allMapelTooltip}</p></TooltipContent></Tooltip></TooltipProvider>)}</div>);
        },
        enableHiding: true,
        enableSorting: false, // Sorting berdasarkan list string mungkin tidak intuitif
        filterFn: (row, id, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            const rowMapelList = row.getValue(id) as string[] | undefined | null;
            if (!rowMapelList || rowMapelList.length === 0) return false;
            return filterValue.some(selectedMapel => rowMapelList.includes(selectedMapel));
        }
    },
    {
        accessorKey: "nisp",
        header: ({ column }) => <DataTableColumnHeader column={column} title="NISP" />,
        enableHiding: true,
        enableSorting: true,
        cell: ({ row }) => <div className="text-center">{row.getValue("nisp") || "-"}</div>,
        size: 130,
    },
   ...Object.keys(variabelColumnsMap).map((variabelId) => {
    const headerTitle = variabelColumnsMap[variabelId].replace("Rerata ", "");
    const columnIdForTable = `skor_variabel_${variabelId}`;

    return {
        id: columnIdForTable,
        accessorFn: (row: FlattenedEvaluasiGuruOverview): string => row.skor_per_variabel[variabelId] || "- / 5.00",
        header: ({ column }: { column: Column<FlattenedEvaluasiGuruOverview, unknown> }) =>
            <DataTableColumnHeader column={column} title={headerTitle} />,
        cell: (info: CellContext<FlattenedEvaluasiGuruOverview, string>) => {
            const fullScoreString = info.getValue();
            let scoreValueDisplay = "-"; // Default jika tidak ada skor valid
            let scoreBaseDisplay = "/ 5.00"; // Default base
            let valueColorClass = "text-muted-foreground"; // Default color untuk '-'

            if (fullScoreString && !fullScoreString.startsWith("-")) {
                 const parts = fullScoreString.split(" / ");
                 if (parts.length === 2) {
                     scoreValueDisplay = parts[0];
                     scoreBaseDisplay = " / " + parts[1];
                     try {
                         const numericScore = parseFloat(scoreValueDisplay);
                         if (!isNaN(numericScore)) {
                             if (numericScore >= 4.0) valueColorClass = "text-green-600 dark:text-green-400";
                             else if (numericScore >= 2.0) valueColorClass = "text-orange-500 dark:text-orange-400";
                             else valueColorClass = "text-red-600 dark:text-red-400";
                         } else {
                             valueColorClass = "text-muted-foreground"; // Jika parsing gagal tapi bukan strip
                         }
                     } catch (e) { valueColorClass = "text-muted-foreground"; }
                 } else { // Jika format tidak "X / Y" tapi bukan "-"
                    scoreValueDisplay = fullScoreString;
                    scoreBaseDisplay = ""; // Tidak ada base jika format aneh
                    valueColorClass = "text-muted-foreground";
                 }
            } else {
                 // scoreValueDisplay sudah "-"
                 scoreBaseDisplay = " / 5.00"; // Pastikan base tetap ada untuk "-"
            }
            const scoreValueClasses = cn(valueColorClass, "font-semibold");

            return (
                <div className="text-center">
                    <span className={scoreValueClasses}>{scoreValueDisplay}</span>
                    <span className="text-gray-500 dark:text-gray-400">{scoreBaseDisplay}</span>
                </div>
            );
        },
        enableSorting: true,
        sortingFn: (rowA: Row<FlattenedEvaluasiGuruOverview>, rowB: Row<FlattenedEvaluasiGuruOverview>) => {
            const valAStr = rowA.original.skor_per_variabel[variabelId];
            const valBStr = rowB.original.skor_per_variabel[variabelId];
            const valA = valAStr && !valAStr.startsWith("-") ? parseFloat(valAStr.split(" / ")[0]) : -Infinity; // -Infinity agar N/A di bawah
            const valB = valBStr && !valBStr.startsWith("-") ? parseFloat(valBStr.split(" / ")[0]) : -Infinity;
            return valA - valB;
        },
        filterFn: (row: Row<FlattenedEvaluasiGuruOverview>, columnId: string, filterValues: string[]) => {
            if (!filterValues || filterValues.length === 0) return true;
            const scoreString = row.getValue(columnId) as string;
            const isNiaScore = scoreString.startsWith("-");
            let matches = false;
            filterValues.forEach(filterValue => {
                if (filterValue === "N/A_SCORE") { if (isNiaScore) matches = true;
                } else { if (isNiaScore) return; let currentScoreNum: number;
                    try { const scorePart = scoreString.split(" / ")[0]; currentScoreNum = parseFloat(scorePart); if (isNaN(currentScoreNum)) return;
                    } catch (e) { return; }
                    const [minStr, maxStr] = filterValue.split('-'); const min = parseFloat(minStr); const max = parseFloat(maxStr);
                    if (!isNaN(min) && !isNaN(max)) { if (currentScoreNum >= min && currentScoreNum <= max) { matches = true; } }
                }
            });
            return matches;
        },
        size: 150,
    } satisfies ColumnDef<FlattenedEvaluasiGuruOverview, any>;
}),
    {
        id: "actions",
        header: () => <div className="text-left pl-1">Aksi</div>,
        cell: ({ row }) => <OverviewTahunanRowActions row={row} />,
        enableSorting: false,
        enableHiding: false,
        size: 80,
    },
];