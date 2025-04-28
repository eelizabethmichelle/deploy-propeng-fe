// components/ui/summarystudent/action-menu.tsx
"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

// Ubah nama agar lebih jelas (opsional)
export function DataTableColumnToggle<TData>({ table }: DataTableViewOptionsProps<TData>) {
  // Fungsi untuk mendapatkan nama kolom yang lebih ramah pengguna
  const getColumnName = (id: string): string => {
    switch (id) {
      case 'no': return 'No.';
      case 'nama': return 'Mata Pelajaran';
      case 'kategori': return 'Kategori';
      case 'nilaiPengetahuanAkhir': return 'N. Pengetahuan';
      case 'nilaiKeterampilanAkhir': return 'N. Keterampilan';
      case 'actions': return 'Aksi';
      default: return id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Default formatting
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Kolom
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Tampilkan Kolom</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(column => typeof column.accessorFn !== "undefined" && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {/* Gunakan fungsi getColumnName */}
                {getColumnName(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}