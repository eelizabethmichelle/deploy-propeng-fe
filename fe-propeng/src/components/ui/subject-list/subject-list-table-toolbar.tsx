'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { SubjectSummary } from './schema';
import { statusOptions } from './subject-list-columns'; 
import { DataTableFacetedFilter } from './filters-clear';
import { DataTableViewOptions } from './action-menu';

interface FilterOption { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; }

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

  const nameColumn = table.getColumn('name');
  const knowledgeComponentsColumn = table.getColumn('knowledgeComponents');
  const skillComponentsColumn = table.getColumn('skillComponents');
  const academicYearColumn = table.getColumn('academicYear');
  const detailedStatus = table.getColumn('detailedStatus');
  const detailedStatus2 = table.getColumn('detailedStatus2');


  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex flex-1 items-center space-x-2 flex-wrap">
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
                title="Tahun Ajaran"
                options={uniqueAcademicYearOptions}
            />
        )}

        {knowledgeComponentsColumn && uniqueComponentOptions.length > 0 && (
            <DataTableFacetedFilter
                column={knowledgeComponentsColumn}
                title="Komponen Penilaian Pengetahuan"
                options={uniqueComponentOptions}
            />
        )}

        {skillComponentsColumn && uniqueComponentOptions.length > 0 && (
            <DataTableFacetedFilter
                column={skillComponentsColumn}
                title="Komponen Penilaian Keterampilan"
                options={uniqueComponentOptions}
            />
        )}

        {detailedStatus && (
          <DataTableFacetedFilter
            column={detailedStatus} 
            title="Status Pengisian Pengetahuan" 
            options={statusOptions} 
          />
        )}

        {detailedStatus2 && (
          <DataTableFacetedFilter
            column={detailedStatus2} 
            title="Status Pengisian Keterampilan" 
            options={statusOptions} 
          />
        )}



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

    </div>
  );
}