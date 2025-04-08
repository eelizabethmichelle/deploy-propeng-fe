// Lokasi: app/components/grade-entry-columns.tsx
'use client';

import { ColumnDef, CellContext, SortingFn, HeaderContext, FilterFn, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Impor ikon yang benar-benar dipakai
import { Pencil, Trash2, Save, XCircle, Loader2, Check, Ban, LucideEdit, ArrowUpDown } from "lucide-react";
import { AssessmentComponent, GradeTableRowData, GradesState, GradeTableMeta } from "./schema"; // Impor tipe
import { DataTableColumnHeader } from "./sort"; // Pastikan path ini benar
import { toast } from "sonner";


// --- TAMBAHKAN DEFINISI HELPER FUNCTION DI SINI ---
const formatNumberOrDash = (value: number | null | undefined, decimals: number = 0): string => {
    // Pastikan value adalah angka dan bukan NaN sebelum formatting
    if (typeof value === 'number' && !isNaN(value)) {
        // Gunakan toFixed jika decimals > 0, atau Math.round jika decimals = 0 untuk integer
        return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    }
    return '-'; // Kembalikan strip jika null, undefined, atau NaN
};
// ------------------------------------------------

// --- Komponen Cell Nilai (menggunakan formatNumberOrDash) ---
const GradeCell = ({ row, column, table }: CellContext<GradeTableRowData, unknown>) => {
    const meta = table.options.meta as GradeTableMeta;
    const studentId = row.original.id;
    const componentId = column.id;
    const isEditable = meta.isEditingAll || meta.editingRowId === studentId;
    const isSaving = meta.isSavingRow === studentId || meta.isSavingAll;
    const currentValue = meta.grades?.[studentId]?.[componentId];
    const displayValueForInput = currentValue === null || currentValue === undefined ? '' : currentValue.toString();
    // Gunakan formatNumberOrDash untuk tampilan read-only
    const displayValueReadonly = formatNumberOrDash(currentValue as number | null | undefined, 0); // Tampilkan tanpa desimal di tabel

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        meta.handleGradeChange(studentId, componentId, value); // Validasi ada di handleGradeChange di DataTable
    };


    return (
        <div className="text-center min-w-[70px]">
            {isEditable ? (
                <Input
                    type="number"
                    step="any" // Atau "1", "0.5"
                    min="0"
                    max="100"
                    placeholder="-" // Placeholder jika kosong
                    value={displayValueForInput} // Nilai untuk input
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    className="max-w-[70px] mx-auto text-center h-8 text-sm p-1"
                    disabled={isSaving} // Disable saat saving
                    aria-label={`Nilai ${column.id} untuk ${row.original.name}`}
                />
            ) : (
                // Tampilkan nilai (atau '-') jika tidak dalam mode edit
                <span className="text-sm px-2">{displayValueReadonly}</span>
            )}
        </div>
    );
};

// Fungsi Filter Kustom untuk Nilai Akhir
const finalScoreRangeFilter: FilterFn<GradeTableRowData> = (
    row: Row<GradeTableRowData>,
    columnId: string,
    filterValue: any // Bisa string 'lt50', '50to75', 'gt75' atau array davon
) => {
    // Handle jika filterValue bukan array (misalnya dari select biasa)
    const filterRanges = Array.isArray(filterValue) ? filterValue : (filterValue ? [filterValue] : []);

    if (filterRanges.length === 0) {
        return true; // Tampilkan semua jika tidak ada filter range dipilih
    }
    const score = row.getValue(columnId) as number | null | undefined;
    if (score === null || score === undefined || isNaN(score)) {
        return false; // Jangan tampilkan jika nilai tidak valid atau kosong
    }
    // Cek apakah skor cocok dengan *salah satu* range yang dipilih
    return filterRanges.some(range => {
        switch (range) {
            case 'lt50': return score < 50;
            case '50to75': return score >= 50 && score <= 75;
            case 'gt75': return score > 75;
            default: return false; // Abaikan nilai filter yang tidak dikenal
        }
    });
};

// --- Fungsi Generate Kolom (SIGNATURE DIPERBAIKI) ---
export function generateGradeColumns(
    assessmentComponents: AssessmentComponent[],
    // Catatan: Prop 'gradesPropFromParent' mungkin tidak perlu jika meta.grades selalu up-to-date
    // dan dipakai di cell/sorting. Kita pertahankan agar sesuai pemanggilan.
    gradesPropFromParent: GradesState,
    startHeaderEdit: (component: AssessmentComponent) => void,
    handleDeleteComponent: (id: string, name: string) => void,
    editingHeaderId: string | null,
    editingHeaderValues: { name: string; weight: string },
    handleHeaderEditChange: (field: 'name' | 'weight', value: string) => void,
    saveHeaderEdit: () => Promise<void>,
    cancelHeaderEdit: () => void,
    isHeaderEditingLoading: boolean,
    isAnyRowEditing: boolean,
    scoreType: 'pengetahuan' | 'keterampilan' // <-- PARAMETER KE-12 SUDAH ADA
): ColumnDef<GradeTableRowData>[] {

    console.log(`[Columns ${scoreType}] Generating columns...`); // Konfirmasi tipe

    const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];

    // Fungsi sorting kustom (akses nilai via meta jika memungkinkan)
    const componentColumnSortingFn: SortingFn<GradeTableRowData> = (rowA, rowB, columnId) => {
         // Cara akses meta saat sorting mungkin perlu trik, ini contoh dasar
         // Jika tidak bisa akses meta, perlu state 'grades' diteruskan ke sini
         // atau sorting dilakukan pada data sebelum masuk ke tabel.
         // Untuk sementara, kita pakai `gradesPropFromParent` (meski kurang ideal).
         const gradeA = gradesPropFromParent[rowA.original.id]?.[columnId];
         const gradeB = gradesPropFromParent[rowB.original.id]?.[columnId];
         const valA = gradeA === null || gradeA === undefined ? -Infinity : Number(gradeA); // Null/undefined jadi paling kecil
         const valB = gradeB === null || gradeB === undefined ? -Infinity : Number(gradeB);
         return valA - valB;
    };

    const columns: ColumnDef<GradeTableRowData>[] = [
        // Kolom Checkbox
        {
            id: 'select',
            header: ({ table }) => {
                 const meta = table.options.meta as GradeTableMeta; // Akses meta
                return (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Pilih semua baris"
                        // Disable checkbox jika sedang dalam mode edit apapun
                        disabled={meta?.isEditingAll || !!meta?.editingRowId} // Akses dari meta
                        className="translate-y-[2px]"
                    />
                );
            },
            cell: ({ row, table }) => {
                 const meta = table.options.meta as GradeTableMeta; // Akses meta
                return (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Pilih baris"
                        // Disable checkbox jika sedang dalam mode edit apapun
                        disabled={meta?.isEditingAll || !!meta?.editingRowId} // Akses dari meta
                        className="translate-y-[2px]"
                    />
                );
            },
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        // Kolom Nama Siswa
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />,
            cell: ({ row }) => <div className="font-medium text-xs">{row.getValue('name')}</div>,
            enableSorting: true,
            size: 180, // Sesuaikan lebar
            minSize: 120,
            enableColumnFilter: true,
            filterFn: 'arrIncludesSome', // Untuk faceted filter
        },
        // Kolom Kelas
        {
            id: 'class', // Eksplisit ID agar filter toolbar bisa target
            accessorKey: 'class',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kelas" />,
            cell: ({ row }) => <div className="text-xs">{row.getValue('class')}</div>,
            enableSorting: true,
            enableHiding: true, // Bisa disembunyikan
            enableColumnFilter: true,
            filterFn: 'arrIncludesSome', // Untuk faceted filter
            size: 100, // Sesuaikan lebar
        },
        // Kolom Komponen Penilaian Dinamis
        ...currentComponents.map<ColumnDef<GradeTableRowData>>(component => ({
            accessorKey: component.id,
            header: ({ header }: HeaderContext<GradeTableRowData, unknown>) => {
                 const isEditingThisHeader = editingHeaderId === component.id;
                return isEditingThisHeader ? (
                     <div className='space-y-1 py-1 px-1 max-w-[120px] mx-auto'>
                         <Input value={editingHeaderValues.name} onChange={(e) => handleHeaderEditChange('name', e.target.value)} className="h-7 text-xs px-1 mb-0.5 w-full" placeholder='Nama' disabled={isHeaderEditingLoading}/>
                         <div className='flex items-center justify-center gap-1'>
                             <Input type="number" min="0" step="any" value={editingHeaderValues.weight} onChange={(e) => handleHeaderEditChange('weight', e.target.value)} className="h-7 w-12 text-right text-xs px-1" placeholder='Bobot' disabled={isHeaderEditingLoading}/>
                             <span className="text-xs">%</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={saveHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Simpan Header">
                                 {isHeaderEditingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Batal Edit Header">
                                 <XCircle className="h-3 w-3" />
                            </Button>
                         </div>
                     </div>
                 ) : (
                    <div className="text-center text-xs leading-tight flex flex-col items-center group relative py-1" style={{ minWidth: '80px' }}>
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className='font-semibold'>{component.name}</span>
                            {/* Tombol Edit/Hapus Header (muncul saat hover jika tidak ada yg diedit) */}
                            {!editingHeaderId && !isAnyRowEditing && (
                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex bg-background border rounded shadow-sm p-0">
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:bg-blue-100" onClick={() => startHeaderEdit(component)} title={`Edit ${component.name}`}>
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600 hover:bg-red-100" onClick={() => handleDeleteComponent(component.id, component.name)} title={`Hapus ${component.name}`}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                         </div>
                        <span className="block text-muted-foreground font-normal mt-0.5">({component.weight}%)</span>
                    </div>
                 );
            },
            cell: GradeCell, // Gunakan komponen GradeCell yang sudah didefinisikan
            enableSorting: true, // Aktifkan sorting
            sortingFn: componentColumnSortingFn, // Gunakan fungsi sorting kustom
            size: 90, // Lebar default kolom nilai komponen
            minSize: 70, // Lebar minimum
        })),
        // Kolom Nilai Akhir
        {
            accessorKey: 'finalScore',
            header: ({ column }) => <DataTableColumnHeader column={column} title={`Nilai Akhir`} />, // Label NA sesuai tipe
            cell: ({ row }) => {
                const finalScore = row.getValue('finalScore') as number | null | undefined;
                const displayScore = formatNumberOrDash(finalScore, 1); // 1 desimal
                return <div className="text-center font-semibold text-sm">{displayScore}</div>; // Font sedikit lebih besar
            },
            enableSorting: true,
            enableColumnFilter: true, // Aktifkan filter
            filterFn: finalScoreRangeFilter, // Terapkan fungsi filter kustom
            size: 80, // Sesuaikan lebar
        },
        // Kolom Aksi Baris
        {
            id: 'actions',
            header: () => <div className="text-center px-1">Aksi</div>,
            cell: ({ row, table }) => {
                const meta = table.options.meta as GradeTableMeta;
                const isEditingThisRow = meta.editingRowId === row.original.id;
                const isSavingThisRow = meta.isSavingRow === row.original.id;

                // Jangan tampilkan aksi jika mode Edit Semua
                if (meta.isEditingAll) { return <div className="w-[60px]"></div>; } // Placeholder lebar

                return (
                    <div className="text-center w-[60px]"> {/* Lebar tetap */}
                        {isEditingThisRow ? (
                            <div className='flex justify-center gap-0'>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => meta.handleSaveRow(row.original.id)} disabled={isSavingThisRow} aria-label="Simpan baris">
                                    {isSavingThisRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => meta.handleCancelRow(row.original.id)} disabled={isSavingThisRow} aria-label="Batal edit baris">
                                    <Ban className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary"
                                // Disable jika: mode Edit All, ada baris lain diedit, atau baris ini TERPILIH (agar reset berfungsi)
                                disabled={meta.isEditingAll || (!!meta.editingRowId && meta.editingRowId !== row.original.id) || row.getIsSelected()}
                                onClick={() => meta.handleEditRowTrigger(row.original.id)}
                                aria-label={`Edit nilai ${row.original.name}`}
                             >
                                 <LucideEdit className="h-4 w-4" />
                             </Button>
                        )}
                    </div>
                );
            },
            size: 70, // Lebar kolom aksi
            enableSorting: false,
            enableHiding: false,
        },
    ];
    return columns;
};