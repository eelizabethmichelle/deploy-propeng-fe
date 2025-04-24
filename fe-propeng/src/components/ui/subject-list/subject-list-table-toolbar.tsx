// app/components/subject-list/subject-list-toolbar.tsx
'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
// Impor tipe SubjectSummary dari schema
import { SubjectSummary } from './schema';
import { statusOptions } from './subject-list-columns'; // Impor status options
import { DataTableFacetedFilter } from './filters-clear';
import { DataTableViewOptions } from './action-menu';

// Tipe opsi filter
interface FilterOption { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; }

// Props toolbar
interface SubjectListToolbarProps {
  table: Table<SubjectSummary>;
  uniqueComponentOptions: FilterOption[]; // Berdasarkan nama komponen
  uniqueAcademicYearOptions: FilterOption[];
}

export function SubjectListToolbar({
    table,
    uniqueComponentOptions, // Opsi filter nama komponen
    uniqueAcademicYearOptions
}: SubjectListToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Dapatkan kolom untuk filter
  const nameColumn = table.getColumn('name');
  const statusColumn = table.getColumn('status');
  const componentsColumn = table.getColumn('components'); // Kolom untuk filter nama komponen
  const academicYearColumn = table.getColumn('academicYear');

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      {/* Filter */}
      <div className="flex flex-1 items-center space-x-2 flex-wrap">
        {/* Filter Nama Mapel */}
        {nameColumn && (
          <Input
            placeholder="Cari mata pelajaran..."
            value={(nameColumn.getFilterValue() as string) ?? ''}
            onChange={(event) => nameColumn.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
            aria-label="Filter mata pelajaran"
          />
        )}

        {/* Filter Tahun Ajaran */}
        {academicYearColumn && uniqueAcademicYearOptions && uniqueAcademicYearOptions.length > 0 && (
            <DataTableFacetedFilter
                // Cukup teruskan objek kolomnya saja
                column={academicYearColumn}
                title="Thn. Ajaran"
                // Opsi filter sudah berisi nilai asli (e.g., "2024", "2025")
                options={uniqueAcademicYearOptions}
            />
        )}
        {/* Filter Status */}
        {statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn}
            title="Status"
            options={statusOptions} // Gunakan statusOptions yang diimpor
          />
        )}

         {/* Filter Komponen Mapel (berdasarkan NAMA) */}
         {componentsColumn && uniqueComponentOptions.length > 0 && (
             <DataTableFacetedFilter
                column={componentsColumn} // Targetkan kolom 'components'
                title="Komponen" // Judul filter
                options={uniqueComponentOptions} // Opsi berisi nama-nama komponen
            />
         )}

        {/* Tombol Reset Filter */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
            aria-label="Reset semua filter"
          >
            Reset Filter <XCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* View Options */}
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}