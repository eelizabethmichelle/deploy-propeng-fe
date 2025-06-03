'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle, Ban, Loader2, Save, Edit, RotateCcw, AlertTriangle } from 'lucide-react'; 
import { GradeTableRowData, FilterOption } from './schema';
import { toast } from 'sonner'; 
import { DataTableFacetedFilter } from './filters-clear';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";

interface GradeDataTableToolbarProps {
    table: Table<GradeTableRowData>;
    onResetSelected: () => void;
    isEditingAll: boolean;
    isSavingAll: boolean;
    onEditAll: () => void;
    onSaveAll: () => Promise<void>;
    onCancelAll: () => void;
    isRowEditing: boolean;
    nameFilterOptions: FilterOption[];
    classFilterOptions: FilterOption[];
    finalScoreFilterOptions: FilterOption[];
    isResetting: boolean; 
}

export function GradeDataTableToolbar({
    table,
    onResetSelected, 
    isEditingAll,
    isSavingAll,
    onEditAll,
    onSaveAll,
    onCancelAll,
    isRowEditing,
    nameFilterOptions,
    classFilterOptions,
    finalScoreFilterOptions,
    isResetting, 
}: GradeDataTableToolbarProps) {
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;
    const isColumnFiltered = table.getState().columnFilters.length > 0;
    const isFiltered = isColumnFiltered;

    const nameColumn = table.getColumn('name');
    const classColumn = table.getColumn('class');
    const finalScoreColumn = table.getColumn('finalScore');

    const handleConfirmReset = () => {
        console.log("Tombol Konfirmasi Reset diklik. Memanggil onResetSelected...");
        onResetSelected(); 
        setIsConfirmDialogOpen(false); 
    };

    const resetAllFilters = () => {
        table.resetColumnFilters();
    }

    return (
        <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-1 items-center space-x-2 flex-wrap min-w-[200px]">
                {nameColumn && (
                    <Input
                        placeholder="Cari nama..."
                        value={(typeof nameColumn.getFilterValue() === 'string' ? nameColumn.getFilterValue() : '') as string}
                        onChange={(event) => nameColumn.setFilterValue(event.target.value)}
                        className="h-8 w-[150px] lg:w-[180px]"
                        aria-label="Filter nama siswa (teks)"
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {nameColumn && (
                    <DataTableFacetedFilter
                        column={nameColumn}
                        title="Nama"
                        options={nameFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {classColumn && (
                    <DataTableFacetedFilter
                        column={classColumn}
                        title="Kelas"
                        options={classFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {finalScoreColumn && (
                    <DataTableFacetedFilter
                        column={finalScoreColumn}
                        title="Rentang Nilai"
                        options={finalScoreFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {isFiltered && (
                    <Button variant="ghost" onClick={resetAllFilters} className="h-8 px-2 lg:px-3" disabled={isEditingAll || isRowEditing || isResetting} >
                        Reset Filter <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
                {isEditingAll ? (
                    <>
                        <span className='text-sm text-muted-foreground hidden md:inline italic'>Anda sedang mengedit nilai siswa...</span>
                        <Button variant="outline" size="sm" className="h-8" onClick={onCancelAll} disabled={isSavingAll || isResetting}>
                            <Ban className="mr-2 h-4 w-4" /> Batal Semua
                        </Button>
                        <Button size="sm" variant={"secondary"} className="h-8" onClick={onSaveAll} disabled={isSavingAll || isResetting}>
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Semua
                        </Button>
                    </>
                ) : (
                    <>
                        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    disabled={selectedRowCount === 0 || isRowEditing || isSavingAll || isResetting}
                                    aria-label={`Reset Nilai ${selectedRowCount} Siswa`}
                                >
                                    {isResetting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RotateCcw className='mr-2 h-4 w-4' />}
                                    Reset Nilai {selectedRowCount > 0 ? `(${selectedRowCount})` : ''}
                                </Button>
                            </DialogTrigger>
                            {/* Konten Dialog */}
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-destructive" /> 
                                            Konfirmasi Reset Nilai
                                        </div>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Anda yakin ingin mereset nilai untuk <strong className='font-medium'>{selectedRowCount}</strong> siswa terpilih?
                                        Semua nilai komponen siswa yang dipilih akan dikosongkan dan disimpan.
                                        <br/>
                                        <strong className="text-destructive">Tindakan ini tidak dapat dibatalkan.</strong>
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="secondary">Batal</Button>
                                    </DialogClose>
                                    <Button
                                        variant="default"
                                        onClick={handleConfirmReset}
                                        disabled={isResetting}
                                    >
                                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Ya, Reset Nilai
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={onEditAll}
                            disabled={isRowEditing || selectedRowCount > 0 || isSavingAll || isResetting}
                            aria-label="Edit Semua Nilai"
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit Semua Nilai
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}