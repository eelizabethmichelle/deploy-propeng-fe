'use client';

import { ColumnDef, CellContext, SortingFn, HeaderContext, FilterFn, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Save, XCircle, Loader2, Check, Ban, LucideEdit, ArrowUpDown, Sigma } from "lucide-react";
import { AssessmentComponent, GradeTableRowData, GradesState, GradeTableMeta } from "./schema"; 
import { DataTableColumnHeader } from "./sort"; 
import { toast } from "sonner";
import { cn } from "@/lib/utils"; 
import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../dialog";

const formatNumberOrDash = (value: number | null | undefined, decimals: number = 0): string => {
    if (typeof value === 'number' && !isNaN(value)) {
        return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    }
    return '-';
};

const GradeCell = ({ row, column, table }: CellContext<GradeTableRowData, unknown>) => {
    const meta = table.options.meta as GradeTableMeta;
    const studentId = row.original.id;
    const componentId = column.id;
    const isEditable = meta.isEditingAll || meta.editingRowId === studentId;
    const isSaving = meta.isSavingRow === studentId || meta.isSavingAll;
    const currentValue = meta.grades?.[studentId]?.[componentId];
    const displayValueForInput = currentValue === null || currentValue === undefined ? '' : currentValue.toString();
    const displayValueReadonly = formatNumberOrDash(currentValue as number | null | undefined, 2);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        meta.handleGradeChange(studentId, componentId, value);
    };

    const nilaiColor = (() => {
        if (Number(displayValueReadonly) > 70) {
            return "text-green-500"
        }
        else if (Number(displayValueReadonly) > 70) {
            return "text-yellow-500"
        }
        else {
            return "text-red-500"
        }
    })();

    return (
        <div className="text-center min-w-[70px]">
            {isEditable ? (
                <Input
                    type="number" step="any" min="0" max="100" placeholder="-"
                    value={displayValueForInput}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    className="max-w-[70px] mx-auto text-center h-8 text-sm p-1"
                    disabled={isSaving}
                    aria-label={`Nilai ${column.id} untuk ${row.original.name}`}
                />
            ) : (
                <span className={`text-sm px-2 ${nilaiColor}`}>{displayValueReadonly}</span>
            )}
        </div>
    );
};

const finalScoreRangeFilter: FilterFn<GradeTableRowData> = (
    row: Row<GradeTableRowData>,
    columnId: string,
    filterValue: any
) => {
    const filterRanges = Array.isArray(filterValue) ? filterValue : (filterValue ? [filterValue] : []);
    if (filterRanges.length === 0) return true;
    const score = row.getValue(columnId) as number | null | undefined;
    if (score === null || score === undefined || isNaN(score)) return false;
    return filterRanges.some(range => {
        switch (range) {
            case 'lt50': return score < 50;
            case '50to75': return score >= 50 && score <= 75;
            case 'gt75': return score > 75;
            default: return false;
        }
    });
};

export function generateGradeColumns(
    assessmentComponents: AssessmentComponent[],
    gradesPropFromParent: GradesState, 
    startHeaderEdit: (component: AssessmentComponent) => void,
    handleDeleteComponent: (id: string, name: string) => void,
    editingHeaderId: string | null,
    editingHeaderValues: { name: string; weight: string },
    handleHeaderEditChange: (field: 'name' | 'weight', value: string) => void,
    saveHeaderEdit: () => Promise<void>,
    cancelHeaderEdit: () => void,
    isHeaderEditingLoading: boolean,
    isAnyRowEditing: boolean
): ColumnDef<GradeTableRowData>[] {

    console.log(`[Columns] Generating columns...`); 

    const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];

    const componentColumnSortingFn: SortingFn<GradeTableRowData> = (rowA, rowB, columnId) => {
        const gradeA = gradesPropFromParent[rowA.original.id]?.[columnId];
        const gradeB = gradesPropFromParent[rowB.original.id]?.[columnId];
        const valA = gradeA === null || gradeA === undefined ? -Infinity : Number(gradeA);
        const valB = gradeB === null || gradeB === undefined ? -Infinity : Number(gradeB);
        return valA - valB;
    };

    const columns: ColumnDef<GradeTableRowData>[] = [
        {
            id: 'select',
            header: ({ table }) => {
                const meta = table.options.meta as GradeTableMeta;
                return (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Pilih semua baris"
                        disabled={meta?.isEditingAll || !!meta?.editingRowId || isAnyRowEditing}
                        className="translate-y-[2px]"
                    />
                );
            },
            cell: ({ row, table }) => {
                const meta = table.options.meta as GradeTableMeta;
                return (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Pilih baris"
                        disabled={meta?.isEditingAll || !!meta?.editingRowId || isAnyRowEditing} 
                        className="translate-y-[2px]"
                    />
                );
            },
            enableSorting: false,
            enableHiding: false, 
            size: 40,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />,
            cell: ({ row }) => <div className="font-medium text-xs">{row.getValue('name')}</div>,
            enableSorting: true, size: 180, minSize: 120, enableColumnFilter: true, filterFn: 'arrIncludesSome',
        },
        {
            id: 'class', accessorKey: 'class',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kelas" />,
            cell: ({ row }) => <div className="text-xs">{row.getValue('class')}</div>,
            enableSorting: true, enableHiding: true, enableColumnFilter: true, filterFn: 'arrIncludesSome', size: 100,
        },
        ...currentComponents.map<ColumnDef<GradeTableRowData>>(component => ({
            accessorKey: component.id,
            header: ({ header }: HeaderContext<GradeTableRowData, unknown>) => {
                const isEditingThisHeader = editingHeaderId === component.id;
                return isEditingThisHeader ? (
                    <div className='space-y-1 py-1 px-1 max-w-[120px] mx-auto'>
                    </div>
                ) : (
                    <div className="text-center text-xs leading-tight flex flex-col items-center group relative py-1" style={{ minWidth: '80px' }}>
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className='font-semibold'>{component.name}</span>
                        </div>
                        <span className="block text-muted-foreground font-normal mt-0.5">({component.weight}%)</span>
                    </div>
                );
            },
            cell: GradeCell, 
            enableSorting: true,
            sortingFn: componentColumnSortingFn,
            size: 90,
            minSize: 70,
        })),
        {
            accessorKey: 'finalScore',
            header: ({ header }: HeaderContext<GradeTableRowData, unknown>) => { return (
                <div className="text-center text-xs leading-tight flex flex-col items-center group relative py-1" style={{ minWidth: '80px' }}>
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                        <span className='font-semibold'>Nilai Akhir</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                        <span className="block text-muted-foreground font-normal mt-0.5 flex justify-center"><Sigma height={12}/> Nilai Tiap Komponen</span>
                    </div>
                </div>
                )
            },
            cell: ({ row }) => {
                const finalScore = row.getValue('finalScore') as number | null | undefined;
                const displayScore = formatNumberOrDash(finalScore, 2);
                const displayScoreNum = Number(displayScore);
                const colorScore = (() => {
                    if (displayScoreNum > 70) {
                        return "text-green-500";
                    }
                    else if (displayScoreNum > 40) {
                        return "text-yellow-500";
                    } else {
                        return "red";
                    }
                })();
                return <div className={`text-center font-semibold text-sm ${colorScore}`}>{displayScore}</div>;
            },
            enableSorting: true,
            enableColumnFilter: true,
            filterFn: finalScoreRangeFilter,
            size: 80,
        },
        {
            id: 'actions',
            header: () => <div className="text-start pl-4">Aksi</div>,
            cell: ({ row, table }) => {
                const meta = table.options.meta as GradeTableMeta;
                const isEditingThisRow = meta.editingRowId === row.original.id;
                const isSavingThisRow = meta.isSavingRow === row.original.id;
                if (meta.isEditingAll) { return <div className="w-[60px]"></div>; } 
                return (
                    <div className="text-center w-[60px]">
                        {isEditingThisRow ? (
                            <div className='flex justify-center gap-0'>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => {meta.handleSaveRow(row.original.id)}} disabled={isSavingThisRow} aria-label="Simpan baris">
                                    {isSavingThisRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => meta.handleCancelRow(row.original.id)} disabled={isSavingThisRow} aria-label="Batal edit baris">
                                    <Ban className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Dialog>
                                    <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary"
                                        disabled={meta.isEditingAll || (!!meta.editingRowId && meta.editingRowId !== row.original.id) || row.getIsSelected()}
                                        aria-label={`Edit nilai ${row.original.name}`}
                                    >
                                        <LucideEdit className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Hapus Siswa</DialogTitle>
                                        <DialogDescription>
                                            Apakah Anda yakin ingin mengedit?
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="sm:justify-end">
                                        <div className="flex gap-4">
                                            <DialogClose asChild>
                                                <Button type="button" variant="destructive">Batal</Button>
                                            </DialogClose>
                                            <Button type="button" onClick={() => meta.handleEditRowTrigger(row.original.id)} variant="neutral">
                                                Ya, Edit
                                            </Button>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                                
                        )}
                    </div>
                );
            },
            size: 70, enableSorting: false, enableHiding: false,
        },
    ];
    return columns;
};