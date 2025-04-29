// app/components/subject-list/subject-list-columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Activity, XCircle, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
// Impor schema yang sudah diupdate
import { ComponentSummary, SubjectStatusType, SubjectSummary } from "./schema";
import { DataTableColumnHeader } from "./sort";
import { SubjectListRowActions } from "./subject-list-row-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";

// Opsi untuk filter status (tetap bisa digunakan untuk helper render)
export const statusOptions = [
    { value: 'Terisi Penuh', label: 'Terisi Penuh', icon: CheckCircle, iconColorClass: "text-green-600" }, // Tambah warna ikon di sini
    { value: 'Dalam Proses', label: 'Dalam Proses', icon: LoaderIcon, iconColorClass: "text-primary" }, // Ganti Activity -> LoaderIcon jika mau, atau Activity
    { value: 'Belum Dimulai', label: 'Belum Dimulai', icon: XCircle, iconColorClass: "text-red-500" },
];

// Helper function untuk merender badge status tunggal
const renderStatusBadge = (status: SubjectStatusType | undefined | null, typeLabel: string) => {
    if (!status) {
        return <span className="text-xs text-muted-foreground">{typeLabel}: N/A</span>; // Tampilkan N/A jika status tidak ada
    }

    const option = statusOptions.find(opt => opt.value === status);
    if (!option) {
        // Tampilkan status mentah jika tidak ada di opsi (fallback)
        return <span className="text-xs">{typeLabel}: {status}</span>;
    }

    // Style badge bisa disamakan dengan yang lama atau disesuaikan
    return (
        <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-xs font-medium">{typeLabel}:</span>
            <Badge variant="outline" className="bg-white text-xs px-1.5 h-5 font-normal">
                 <option.icon className={cn("h-3 w-3", option.iconColorClass)} style={{ marginRight: '2px' }} />
                 <span>{option.label}</span>
            </Badge>
        </div>
    );
};

export const subjectListColumns: ColumnDef<SubjectSummary>[] = [
    // Kolom No.
    // {
    //     id: 'no',
    //     header: () => <div className="text-center">No.</div>,
    //     cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    //     enableSorting: false, enableHiding: false, size: 40,
    // },
    // Kolom Mata Pelajaran (Link ke input nilai)
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mata Pelajaran" />,
        cell: ({ row }) => (
            <Link href={`/guru/manajemennilai/inputnilai/${row.original.id}`} className="hover:underline font-medium">
                {row.original.name}
            </Link>
        ),
        enableSorting: true, enableHiding: false,
    },
    // Kolom Tahun Ajaran
 // --- Kolom Tahun Ajaran (Format diubah di cell) ---
    {
        accessorKey: "academicYear", // Data asli tetap "2024" (contoh)
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
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
                return <div className="text-center text-sm">TA {formattedYear}</div>; // Tampilkan format baru
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
    // {
    //     accessorKey: 'statusPengetahuan',
    //     header: 'Status Pengetahuan', // Header mungkin tidak perlu jika disembunyikan
    //     enableHiding: true, // Izinkan user menampilkannya jika mau 
    //     enableColumnFilter: false
    // },
    // {
    //     accessorKey: 'statusKeterampilan',
    //     header: 'Status Keterampilan', // Header mungkin tidak perlu jika disembunyikan
    //     enableHiding: true, // Izinkan user menampilkannya jika mau
      
    // },


    // --- Kolom Komponen Penilaian (Nama komponen pertama jadi Badge) ---
   // --- Kolom Komponen Penilaian (Style Badge disamakan dengan Status) ---
    {
        accessorKey: "components",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komponen Penilaian" />,
        cell: ({ row }) => {
        const components: ComponentSummary[] | undefined = row.original.components;

        // Check if components array itself is valid before proceeding
        if (!components || !Array.isArray(components) || components.length === 0) {
            // Handle case where there are NO components at all for the subject
            return <span className="text-xs text-muted-foreground">Belum Diatur</span>;
            // Alternatively, show Belum Dibuat for both explicitly:
            // return (
            //     <div className="flex flex-col gap-y-1">
            //         <div className="text-xs ..."><span className="font-medium">Pengetahuan:</span> <span className="text-muted-foreground italic">Belum Dibuat</span></div>
            //         <div className="text-xs ..."><span className="font-medium">Keterampilan:</span> <span className="text-muted-foreground italic">Belum Dibuat</span></div>
            //     </div>
            // );
             // Sticking with "Belum Diatur" is simpler if NO components exist at all.
        }

        // Filter components (existing logic)
        const knowledgeComponents = components.filter(c => c.type === 'Pengetahuan');
        const skillComponents = components.filter(c => c.type === 'Keterampilan');

        // Tooltip strings (existing logic)
        const knowledgeNames = knowledgeComponents.map(c => c.name).join(", ") || "-";
        const skillNames = skillComponents.map(c => c.name).join(", ") || "-";

        // MODIFIED Helper function
        const renderComponentGroup = (
            label: string,
            componentList: ComponentSummary[],
            allNamesTooltip: string,
            labelColorClass: string
        ) => {
            // --- MODIFICATION START ---
            // Check if the list for this specific type is empty
            if (componentList.length === 0) {
                // If empty, return the "Belum Dibuat" message for this type
                return (
                    <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                        <span className={cn("font-medium", labelColorClass)}>{label}:</span>
                        <span className="text-muted-foreground italic">Belum Dibuat</span>
                    </div>
                );
            }
            // --- MODIFICATION END ---

            // If not empty, proceed with the original logic
            const firstComponentName = componentList[0]?.name ?? 'N/A';
            const remainingCount = componentList.length - 1;

            return (
                <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                    <span className={cn("font-medium", labelColorClass)}>{label}:</span>
                    
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

        // Render both groups (calls the modified helper)
        return (
            <div className="flex flex-col gap-y-1">
                {renderComponentGroup(
                    'Pengetahuan',
                    knowledgeComponents,
                    knowledgeNames,
                    'text-foreground'
                )}
                {renderComponentGroup(
                    'Keterampilan',
                    skillComponents,
                    skillNames,
                    'text-foreground'
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

        // Kolom Status Pengisian (Agregat)
   {
        id: "detailedStatus",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pengisian" />,
        cell: ({ row }) => {
            const statusP = row.original.statusPengetahuan;
            const statusK = row.original.statusKeterampilan;
            return (
                <div className="flex flex-col gap-y-1 items-start">
                    {renderStatusBadge(statusP, 'Pengetahuan')}
                    {renderStatusBadge(statusK, 'Keterampilan')}
                </div>
            );
        },
        enableSorting: false, // Sorting tetap false

        // --- TAMBAHKAN INI ---
        enableColumnFilter: true, // Aktifkan kemampuan filter untuk kolom ini
        filterFn: (row, columnId, filterValue) => {
            // filterValue adalah array berisi status yang dipilih user (misal: ['Dalam Proses', 'Belum Dimulai'])
            const statusValues = Array.isArray(filterValue) ? filterValue : [];

            // Jika tidak ada filter yang dipilih, tampilkan semua baris
            if (statusValues.length === 0) {
                return true;
            }

            // Ambil status dari baris saat ini
            const statusP = row.original.statusPengetahuan;
            const statusK = row.original.statusKeterampilan;

            // Kembalikan true jika SALAH SATU status (P atau K) ada di dalam array filterValues
            return statusValues.includes(statusP) || statusValues.includes(statusK);
        },
        // --- AKHIR TAMBAHAN ---

        size: 150,
    },

    // --- Akhir Kolom Status Pengisian ---
    // Kolom Aksi
    {
        id: 'actions',
        header: () => <div className="text- pl-1">Aksi</div>,
        cell: ({ row }) => <div className="text-center"><SubjectListRowActions row={row} /></div>,
        enableSorting: false, enableHiding: false, size: 60,
    }
];