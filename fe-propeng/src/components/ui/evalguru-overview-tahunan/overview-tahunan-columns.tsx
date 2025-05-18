'use client';

import { ColumnDef, Column, Row, CellContext } from "@tanstack/react-table";
// Pastikan rentangNilaiOptions diimpor jika diperlukan di sini, meskipun lebih relevan untuk toolbar
import { FlattenedEvaluasiGuruOverview, variabelColumnsMap } from "./schema";
import { OverviewTahunanRowActions } from "./overview-tahunan-row-actions";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./sort"; // Pastikan path ini benar
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";
import { cn } from "@/lib/utils";

export const overviewTahunanColumns: ColumnDef<FlattenedEvaluasiGuruOverview>[] = [
    {
        accessorKey: "nama_guru",
        header: ({ column }: { column: Column<FlattenedEvaluasiGuruOverview, unknown> }) =>
            <DataTableColumnHeader column={column} title="Nama Guru" />,
        cell: ({ row }: CellContext<FlattenedEvaluasiGuruOverview, string>) => <div>{row.getValue("nama_guru")}</div>,
        size: 200,
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const rowValue = row.getValue(id) as string;
            return value.includes(rowValue);
        }
    },
    {
        accessorKey: "tahun_ajaran",
        header: ({ column }: { column: Column<FlattenedEvaluasiGuruOverview, unknown> }) =>
            <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
        cell: ({ row }: CellContext<FlattenedEvaluasiGuruOverview, string>) => <div className="text-center">{row.getValue("tahun_ajaran")}</div>,
        size: 120,
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const rowValue = row.getValue(id) as string;
            return value.includes(rowValue);
        }
    },
    {
        accessorKey: "mata_pelajaran_summary",
        header: ({ column }: { column: Column<FlattenedEvaluasiGuruOverview, unknown> }) =>
            <DataTableColumnHeader column={column} title="Mata Pelajaran" />,
        cell: ({ row }) => {
            const mapelList = row.getValue("mata_pelajaran_summary") as string[] | undefined | null;

            // Kasus 1: Tidak ada mapel atau daftar kosong
            if (!mapelList || mapelList.length === 0) {
                return <div className="text-center">-</div>; // Sesuai permintaan awal Anda untuk mapel kosong
            }

            // Siapkan string semua mapel untuk tooltip
            const allMapelTooltip = mapelList.join(", ");
            const firstMapelName = mapelList[0]; // Akan selalu ada karena sudah dicek mapelList.length > 0
            const remainingCount = mapelList.length - 1;

            return (
                <div className="flex items-center flex-wrap gap-x-1"> {/* Menggunakan flex-wrap dan gap seperti contoh Anda */}
                    <Badge
                        variant="outline"
                        // Menggunakan kelas styling dari contoh "Komponen Penilaian"
                        className="bg-white h-5 px-1.5 font-normal text-xs whitespace-nowrap"
                    >
                        {firstMapelName}
                    </Badge>

                    {remainingCount > 0 && (
                        <TooltipProvider delayDuration={100}> {/* delayDuration dari contoh */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        // Menggunakan kelas styling dari contoh "Komponen Penilaian" untuk badge +N
                                        className="bg-white h-5 px-1.5 text-xs whitespace-nowrap cursor-default"
                                    >
                                        +{remainingCount}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs"> {/* className dari contoh */}
                                    <p className="text-xs">{allMapelTooltip}</p> {/* className dari contoh */}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            );
        },
        enableHiding: false,
        enableSorting: false,
        filterFn: (row, id, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            const rowMapelList = row.getValue(id) as string[] | undefined | null;
            if (!rowMapelList || rowMapelList.length === 0) return false;
            return filterValue.some(selectedMapel => rowMapelList.includes(selectedMapel));
        }
    },

    {
        accessorKey: "nisp",
        header: "NISP",
        enableHiding: false,
        enableSorting: true,
        cell: ({ row }: CellContext<FlattenedEvaluasiGuruOverview, string | null>) => <div className="text-center">{row.getValue("nisp") || "-"}</div>,
        size: 130,
    },
   ...Object.keys(variabelColumnsMap).map((variabelId) => {
        const headerTitle = variabelColumnsMap[variabelId].replace("Rerata ", "");
        return {
            id: `skor_variabel_${variabelId}`,
            accessorFn: (row: FlattenedEvaluasiGuruOverview): string => row.skor_per_variabel[variabelId] || "- / 5.00",
            header: ({ column }: { column: Column<FlattenedEvaluasiGuruOverview, unknown> }) =>
                <DataTableColumnHeader column={column} title={headerTitle} />,
            cell: (info: CellContext<FlattenedEvaluasiGuruOverview, string>) => {
                const fullScoreString = info.getValue(); // Contoh: "4.50 / 5.00" atau "- / 5.00"

                let scoreValueDisplay = fullScoreString; // Bagian angka skor atau "-"
                let scoreBaseDisplay = ""; // Bagian " / 5.00"
                let valueColorClass = ""; // Kelas warna untuk angka skor

                const parts = fullScoreString.split(" / ");
                if (parts.length === 2) {
                    scoreValueDisplay = parts[0]; // Misal: "4.50" atau "-"
                    scoreBaseDisplay = " / " + parts[1]; // Misal: " / 5.00"
                }
                // Jika formatnya tidak "X / Y", scoreValueDisplay akan menjadi fullScoreString, scoreBaseDisplay kosong

                // Tentukan warna untuk angka skor jika bukan "-"
                if (scoreValueDisplay !== "-") {
                    try {
                        const numericScore = parseFloat(scoreValueDisplay);
                        if (!isNaN(numericScore)) {
                            if (numericScore >= 4.0) {
                                valueColorClass = "text-green-600";
                            } else if (numericScore >= 2.0) {
                                valueColorClass = "text-orange-500";
                            } else {
                                valueColorClass = "text-red-600";
                            }
                        }
                    } catch (e) {
                        console.warn(`Gagal mem-parse nilai skor: ${scoreValueDisplay}`, e);
                    }
                }

                // Gabungkan kelas warna dengan font-medium jika ada warna spesifik
                const scoreValueClasses = cn(
                    valueColorClass ? [valueColorClass, "font-medium"] : ""
                );

                return (
                    <div className="text-center">
                        <span className={scoreValueClasses}>{scoreValueDisplay}</span>
                        {scoreBaseDisplay && (
                            <span className="text-gray-500">{scoreBaseDisplay}</span>
                        )}
                    </div>
                );
            },
            enableSorting: true,
            sortingFn: (rowA: Row<FlattenedEvaluasiGuruOverview>, rowB: Row<FlattenedEvaluasiGuruOverview>) => {
                const valAStr = rowA.original.skor_per_variabel[variabelId];
                const valBStr = rowB.original.skor_per_variabel[variabelId];
                const valA = valAStr && !valAStr.startsWith("-") ? parseFloat(valAStr.split(" / ")[0]) : -1;
                const valB = valBStr && !valBStr.startsWith("-") ? parseFloat(valBStr.split(" / ")[0]) : -1;
                return valA - valB;
            },
            filterFn: (row: Row<FlattenedEvaluasiGuruOverview>, id: string, filterValues: string[]) => {
                if (!filterValues || filterValues.length === 0) return true;

                const scoreString = row.original.skor_per_variabel[variabelId];
                if (!scoreString || scoreString.startsWith("-")) return false;

                let currentScore: number;
                try {
                    currentScore = parseFloat(scoreString.split(" / ")[0]);
                } catch (e) {
                    console.warn(`Gagal mem-parse skor: ${scoreString} untuk kolom ${id}`);
                    return false;
                }

                return filterValues.some(rangeString => {
                    const [minStr, maxStr] = rangeString.split('-');
                    const min = parseFloat(minStr);
                    const max = parseFloat(maxStr);
                    if (isNaN(min) || isNaN(max)) return false;
                    return currentScore >= min && currentScore <= max;
                });
            },
            size: 150,
        } satisfies ColumnDef<FlattenedEvaluasiGuruOverview, any>;
    }),

    {
        id: "actions",
        header: () => <div className="text-left pl-1">Detail</div>,
        cell: ({ row }: CellContext<FlattenedEvaluasiGuruOverview, unknown>) => <OverviewTahunanRowActions row={row} />,
        enableSorting: false,
        enableHiding: false,
        size: 80,
    },
];