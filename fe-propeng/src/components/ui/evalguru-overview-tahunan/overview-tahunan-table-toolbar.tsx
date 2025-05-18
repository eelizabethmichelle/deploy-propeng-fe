'use client';

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
// Impor rentangNilaiOptions dan variabelColumnsMap dari schema
import { FlattenedEvaluasiGuruOverview, FilterOption, rentangNilaiOptions, variabelColumnsMap } from "./schema";
import { DataTableViewOptions } from "./action-menu"; // Pastikan path ini benar
import { DataTableFacetedFilter } from "./filters-clear"; // Pastikan path ini benar

interface OverviewToolbarProps {
    table: Table<FlattenedEvaluasiGuruOverview>;
    tahunAjaranOptions: FilterOption[];
    guruOptions: FilterOption[]; // guruOptions tetap diperlukan untuk faceted filter Nama Guru
    mataPelajaranOptions: FilterOption[];
    // rentangNilaiOptions tidak perlu di-pass sebagai prop lagi karena diimpor langsung
}

export function OverviewTahunanToolbar({
    table,
    tahunAjaranOptions,
    guruOptions, // guruOptions tetap ada
    mataPelajaranOptions,
}: OverviewToolbarProps) {
    // Periksa apakah ada filter kolom ATAU global filter yang aktif
    const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;

    return (
        <div className="flex items-center justify-between flex-wrap gap-2 py-4">
            <div className="flex flex-1 items-center space-x-2 flex-wrap gap-y-2">
                <Input
                    placeholder="Cari Nama Guru / NISP..." // Placeholder diubah
                    value={(table.getState().globalFilter as string) ?? ""} // Gunakan globalFilter
                    onChange={(event) =>
                        table.setGlobalFilter(event.target.value) // Atur globalFilter
                    }
                    className="h-8 w-[200px] lg:w-[250px]" // Lebar disesuaikan
                />
                {/* Filter faceted untuk Nama Guru tetap ada */}
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

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            table.resetColumnFilters();
                            table.setGlobalFilter(""); // Reset juga global filter
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