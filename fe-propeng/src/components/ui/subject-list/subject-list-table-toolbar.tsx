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
  uniqueComponentOptions: FilterOption[];
  uniqueAcademicYearOptions: FilterOption[];
}

export function SubjectListToolbar({
    table,
    uniqueComponentOptions,
    uniqueAcademicYearOptions
}: SubjectListToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Dapatkan kolom untuk filter
  const nameColumn = table.getColumn('name');
  // const statusColumn = table.getColumn('status');
  const componentsColumn = table.getColumn('components');
  const academicYearColumn = table.getColumn('academicYear');
  const detailedStatus = table.getColumn('detailedStatus');
  // const statusPColumn = table.getColumn('statusPengetahuan');
  // const statusKColumn = table.getColumn('statusKeterampilan');


  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      {/* Filter */}
      <div className="flex flex-1 items-center space-x-2 flex-wrap">
        {/* Filter Nama Mapel (Sama) */}
        {nameColumn && (
          <Input
            placeholder="Cari mata pelajaran..."
            value={(nameColumn.getFilterValue() as string) ?? ''}
            onChange={(event) => nameColumn.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
            aria-label="Filter mata pelajaran"
          />
        )}

        {academicYearColumn && uniqueAcademicYearOptions && uniqueAcademicYearOptions.length > 0 && (
            <DataTableFacetedFilter
                column={academicYearColumn}
                title="Thn. Ajaran"
                options={uniqueAcademicYearOptions}
            />
        )}

        {detailedStatus && (
          <DataTableFacetedFilter
            column={detailedStatus} // Gunakan kolom statusPengetahuan
            title="Status Pengisian" 
            options={statusOptions} // Opsi status sama
          />
        )}
        {/* {statusPColumn && (
          <DataTableFacetedFilter
            column={statusPColumn} // Gunakan kolom statusPengetahuan
            title="Status Pengetahuan" 
            options={statusOptions} // Opsi status sama
          />
        )} */}

        {/* Filter Status Keterampilan */}
        {/* {statusKColumn && (
          <DataTableFacetedFilter
            column={statusKColumn} // Gunakan kolom statusKeterampilan
            title="Status Keterampilan" // Judul lebih pendek
            options={statusOptions} 
          />
        )} */}


         {componentsColumn && uniqueComponentOptions.length > 0 && (
             <DataTableFacetedFilter
                column={componentsColumn}
                title="Komponen"
                options={uniqueComponentOptions}
            />
         )}

        {/* Tombol Reset Filter (Sama) */}
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

      {/* View Options (Sama) */}
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}