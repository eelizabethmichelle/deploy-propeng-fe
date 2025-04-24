// app/components/subject-list/subject-list-columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Activity, XCircle, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
// Impor schema yang sudah diupdate
import { ComponentSummary, SubjectSummary } from "./schema";
import { DataTableColumnHeader } from "./sort";
import { SubjectListRowActions } from "./subject-list-row-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";

// Opsi untuk filter status
export const statusOptions = [
    { value: 'Terisi Penuh', label: 'Terisi Penuh', icon: CheckCircle },
    { value: 'Dalam Proses', label: 'Dalam Proses', icon: LoaderIcon },
    { value: 'Belum Dimulai', label: 'Belum Dimulai', icon: XCircle },
];

export const subjectListColumns: ColumnDef<SubjectSummary>[] = [
    // Kolom No.
    {
        id: 'no',
        header: () => <div className="text-center">No.</div>,
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
        enableSorting: false, enableHiding: false, size: 40,
    },
    // Kolom Mata Pelajaran (Link ke input nilai)
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mata Pelajaran" />,
        cell: ({ row }) => (
            <Link href={`/guru/input-nilai/${row.original.id}`} className="hover:underline font-medium">
                {row.original.name}
            </Link>
        ),
        enableSorting: true, enableHiding: false,
    },
    // Kolom Tahun Ajaran
 // --- Kolom Tahun Ajaran (Format diubah di cell) ---
    {
        accessorKey: "academicYear", // Data asli tetap "2024" (contoh)
        header: ({ column }) => <DataTableColumnHeader column={column} title="Thn. Ajaran" />,
        cell: ({ row }) => {
            // Ambil nilai asli dari data (misal "2024" atau "N/A")
            const originalValue = row.getValue("academicYear") as string;

            // Cek jika nilainya valid dan bukan format yang sudah benar atau N/A
            if (!originalValue || originalValue === "N/A" || originalValue.includes('/')) {
                // Jika sudah ada '/' atau "N/A", tampilkan apa adanya
                return <div className="text-center text-sm">{originalValue || 'N/A'}</div>;
            }

            // Coba ubah ke angka (integer)
            const startYear = parseInt(originalValue, 10);

            // Jika berhasil diubah ke angka
            if (!isNaN(startYear)) {
                const endYear = startYear + 1; // Hitung tahun akhir
                const formattedYear = `${startYear}/${endYear}`; // Buat format YYYY/YYYY
                return <div className="text-center text-sm">{formattedYear}</div>; // Tampilkan format baru
            }

            // Jika gagal diubah ke angka (misal teks lain), tampilkan nilai asli
            return <div className="text-center text-sm">{originalValue}</div>;
        },
        enableSorting: true, // Sorting akan tetap berdasarkan tahun awal ("2024")
        // Filter juga akan berdasarkan tahun awal ("2024")
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
        size: 120,
    },
    // Kolom Bobot Pengetahuan
  // --- Kolom Bobot Pengetahuan (dengan warna kondisional) ---
    {
        id: 'knowledgeWeightCalc',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bobot Pengetahuan" />,
        cell: ({ row }) => {
            const components = row.original.components;
            const knowledgeWeight = components
                ?.filter(comp => comp.type === 'Pengetahuan')
                .reduce((sum, comp) => sum + (comp.weight ?? 0), 0)
                ?? 0;

            // Terapkan kelas kondisional menggunakan cn
            return (
                <div className={cn(
                    "text-center", // Kelas dasar
                    knowledgeWeight !== 100 && "text-yellow-600 font-semibold" // Kelas jika tidak 100%
                )}>
                    {knowledgeWeight}%
                </div>
            );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const weightA = rowA.original.components?.filter(c=>c.type === 'Pengetahuan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            const weightB = rowB.original.components?.filter(c=>c.type === 'Pengetahuan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            return weightA - weightB;
        },
        size: 130, // Sesuaikan size jika perlu agar tidak wrap
    },

    // --- Kolom Bobot Keterampilan (dengan warna kondisional) ---
    {
        id: 'skillWeightCalc',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bobot Keterampilan" />,
        cell: ({ row }) => {
            const components = row.original.components;
            const skillWeight = components
                ?.filter(comp => comp.type === 'Keterampilan')
                .reduce((sum, comp) => sum + (comp.weight ?? 0), 0)
                ?? 0;

             // Terapkan kelas kondisional menggunakan cn
            return (
                <div className={cn(
                    "text-center", // Kelas dasar
                    skillWeight !== 100 && "text-yellow-600 font-semibold" // Kelas jika tidak 100%
                )}>
                    {skillWeight}%
                </div>
            );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const weightA = rowA.original.components?.filter(c=>c.type === 'Keterampilan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            const weightB = rowB.original.components?.filter(c=>c.type === 'Keterampilan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            return weightA - weightB;
        },
        size: 130, // Sesuaikan size jika perlu agar tidak wrap
    },

    // Kolom Status Pengisian (Agregat)
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pengisian" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const option = statusOptions.find(option => option.value === status);
            if (!option) return null;
             let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
             let iconColorClass = "text-gray-500";
             if (status === 'Terisi Penuh') iconColorClass = "text-primary";
             else if (status === 'Dalam Proses') iconColorClass = "text-green-500";
             else if (status === 'Belum Dimulai') iconColorClass = "text-red-500";
            return (
                 <Badge variant={badgeVariant} className="bg-white text-xs whitespace-nowrap">
                     <option.icon className={cn("mr-1 h-3 w-3", iconColorClass)} />{option.label}
                 </Badge>
            );
        },
        enableSorting: true, filterFn: (row, id, value) => value.includes(row.getValue(id)), size: 150,
    },
    // --- Kolom Komponen Penilaian (Nama komponen pertama jadi Badge) ---
   // --- Kolom Komponen Penilaian (Style Badge disamakan dengan Status) ---
    {
        accessorKey: "components",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komponen Penilaian" />,
        cell: ({ row }) => {
            const components: ComponentSummary[] | undefined = row.original.components;
            if (!components || components.length === 0) {
                return <span className="text-xs text-muted-foreground">Belum Diatur</span>;
            }

            const knowledgeComponents = components.filter(c => c.type === 'Pengetahuan');
            const skillComponents = components.filter(c => c.type === 'Keterampilan');

            const knowledgeNames = knowledgeComponents.map(c => c.name).join(", ") || "-";
            const skillNames = skillComponents.map(c => c.name).join(", ") || "-";

            // Fungsi helper untuk merender satu grup tipe komponen
            const renderComponentGroup = (
                label: string,
                componentList: ComponentSummary[],
                allNamesTooltip: string,
                labelColorClass: string // Kita masih bisa bedakan warna label jika mau
            ) => {
                if (componentList.length === 0) return null;

                const firstComponentName = componentList[0]?.name ?? 'N/A';
                const remainingCount = componentList.length - 1;

                return (
                    <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                        {/* Label Tipe */}
                        <span className={cn("font-medium", labelColorClass)}>{label}:</span>

                        {/* Nama Komponen Pertama (Style seperti Status) */}
                        <Badge
                            variant="outline" // Samakan variant
                            // Samakan kelas dasar: bg-white, ukuran teks, dll.
                            // Hapus kelas warna spesifik tipe (bg-blue-50, dll.)
                            className="bg-white h-5 px-1.5 font-normal text-xs whitespace-nowrap"
                        >
                             {firstComponentName}
                        </Badge>

                        {/* Badge "+N" (Style seperti Status) */}
                        {remainingCount > 0 && (
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="outline" // Samakan variant
                                            // Samakan kelas dasar: bg-white, ukuran teks, dll.
                                            className="bg-white h-5 px-1.5 text-xs whitespace-nowrap cursor-default"
                                        >
                                            +{remainingCount}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="text-xs">{allNamesTooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            };

            // Render kedua grup
            return (
                <div className="flex flex-col gap-y-1">
                    {renderComponentGroup(
                        'Pengetahuan',
                        knowledgeComponents,
                        knowledgeNames,
                        'text-foreground' // Warna label bisa tetap beda atau disamakan (misal: 'text-gray-700')
                    )}
                    {renderComponentGroup(
                        'Keterampilan',
                        skillComponents,
                        skillNames,
                        'text-foreground'// Warna label bisa tetap beda atau disamakan
                    )}
                </div>
            );
        },
        enableSorting: false,
        filterFn: (row, id, value: string[]) => {
            const components = row.original.components;
            if (!components || value.length === 0) return true;
            return components.some(comp => value.includes(comp.name));
        },
    },
    // --- Akhir Kolom Komponen Penilaian ---

    // Kolom Aksi
    {
        id: 'actions',
        header: () => <div className="text- pl-1">Aksi</div>,
        cell: ({ row }) => <div className="text-center"><SubjectListRowActions row={row} /></div>,
        enableSorting: false, enableHiding: false, size: 60,
    }
];