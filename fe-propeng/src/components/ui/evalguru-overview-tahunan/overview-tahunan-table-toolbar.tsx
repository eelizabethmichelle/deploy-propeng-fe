
'use client';

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
// Impor rentangNilaiOptions dan variabelColumnsMap dari schema
import { FlattenedEvaluasiGuruOverview, FilterOption, rentangNilaiOptions, variabelColumnsMap } from "./schema";
import { DataTableViewOptions } from "./action-menu";
import { DataTableFacetedFilter } from "./filters-clear";

interface OverviewToolbarProps {
    table: Table<FlattenedEvaluasiGuruOverview>;
    tahunAjaranOptions: FilterOption[];
    guruOptions: FilterOption[];
    mataPelajaranOptions: FilterOption[];
}

export function OverviewTahunanToolbar({
    table,
    tahunAjaranOptions,
    guruOptions,
    mataPelajaranOptions,
}: OverviewToolbarProps) {
    const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;

    return (
        <div className="flex items-center justify-between flex-wrap gap-2 py-4">
            <div className="flex flex-1 items-center space-x-2 flex-wrap gap-y-2">
                <Input
                    placeholder="Cari Nama Guru / NISP..."
                    value={(table.getState().globalFilter as string) ?? ""}
                    onChange={(event) =>
                        table.setGlobalFilter(event.target.value)
                    }
                    className="h-8 w-[200px] lg:w-[250px]"
                />
                {table.getColumn("nama_guru") && guruOptions.length > 0 && (
                    <DataTableFacetedFilter
                        column={table.getColumn("nama_guru")}
                        title="Nama Guru"
                        options={guruOptions}
                    />
                )}
                {table.getColumn("tahun_ajaran") && tahunAjaranOptions.length > 0 && (
                    <DataTableFacetedFilter
                        column={table.getColumn("tahun_ajaran")}
                        title="Tahun Ajaran"
                        options={tahunAjaranOptions}
                    />
                )}
                {table.getColumn("mata_pelajaran_summary") && mataPelajaranOptions.length > 0 && (
                    <DataTableFacetedFilter
                        column={table.getColumn("mata_pelajaran_summary")}
                        title="Mata Pelajaran"
                        options={mataPelajaranOptions}
                    />
                )}

                {/* === TAMBAHKAN FILTER RENTANG SKOR DI SINI === */}
                {Object.keys(variabelColumnsMap).map(variabelId => {
                    const columnId = `skor_variabel_${variabelId}`;
                    const column = table.getColumn(columnId);
                    // Ambil hanya nama variabelnya saja untuk title filter
                    const filterTitle = variabelColumnsMap[variabelId].replace("Rerata ", "Skor "); 

                    if (!column) {
                        console.warn(`Kolom tidak ditemukan untuk filter: ${columnId}`);
                        return null;
                    }

                    return (
                        <DataTableFacetedFilter
                            key={columnId}
                            column={column}
                            title={filterTitle} // Misal: "Skor Materi Pelajaran"
                            options={rentangNilaiOptions} // Gunakan rentangNilaiOptions yang diimpor
                        />
                    );
                })}
                {/* === AKHIR PENAMBAHAN FILTER RENTANG SKOR === */}


                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            table.resetColumnFilters();
                            table.setGlobalFilter("");
                        }}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset Filter
                        <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <DataTableViewOptions table={table} />
        </div>
    );
}