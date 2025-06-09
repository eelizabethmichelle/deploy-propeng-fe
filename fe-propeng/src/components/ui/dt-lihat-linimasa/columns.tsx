"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-lihat-linimasa/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-lihat-linimasa/sort";
import { DataTableRowActions } from "@/components/ui/dt-lihat-linimasa/actions";
import { CheckCircle, X, Calendar, Users, Clock, CalendarClock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define the type for column meta data
interface ColumnMeta {
  position?: "right" | "left";
}

export const linimasaColumns: ColumnDef<Schema, any>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-0.5"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-0.5"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal Mulai" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("start_date") as string;
      return (
        <div className="flex items-center">
          <span className="text-sm">
            {format(parseISO(date), "dd/MM/yyyy", { locale: id })}
          </span>
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "end_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal Berakhir" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("end_date") as string;
      return (
        <div className="flex items-center">
          <span className="text-sm">
            {format(parseISO(date), "dd/MM/yyyy", { locale: id })}
          </span>
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "angkatan",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Angkatan" />
    ),
    cell: ({ row }) => (
      <div className="flex w-[100px] items-center">
        <span>Angkatan {row.getValue("angkatan")}</span>
      </div>
    ),
    size: 100,
  },
  {
    accessorKey: "matpel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mata Pelajaran" />
    ),
    cell: ({ row }) => {
      const matpel = row.getValue("matpel") as any;
      return (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-[#041765]">
            <span className="font-medium">Pilihan Peminatan 1:</span> {matpel.tier1_option1.nama || '-'} / {matpel.tier1_option2.nama || '-'}
          </div>
          <div className="text-sm text-[#041765]">
            <span className="font-medium">Pilihan Peminatan 2:</span> {matpel.tier2_option1.nama || '-'} / {matpel.tier2_option2.nama || '-'}
          </div>
          <div className="text-sm text-[#041765]">
            <span className="font-medium">Pilihan Peminatan 3:</span> {matpel.tier3_option1.nama || '-'} / {matpel.tier3_option2.nama || '-'}
          </div>
          <div className="text-sm text-[#041765]">
            <span className="font-medium">Pilihan Peminatan 4:</span> {matpel.tier4_option1.nama || '-'} / {matpel.tier4_option2.nama || '-'}
          </div>
        </div>
      );
    },
    size: 400,
  },
  {
    accessorKey: "submissions_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pendaftar" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users size={16} className="text-[#586AB3]" />
        <span>{row.getValue("submissions_count")} siswa</span>
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex w-[150px] items-center">
          {status === "aktif" ? (
            <CheckCircle size={20} className="mr-2 text-green-500" />
          ) : status === "telah_berakhir" ? (
            <Clock size={20} className="mr-2 text-blue-500" />
          ) : (
            <CalendarClock size={20} className="mr-2 text-yellow-500" />
          )}
          <span className="capitalize">
            {status === "aktif" 
              ? "Aktif" 
              : status === "telah_berakhir" 
                ? "Telah Berakhir" 
                : "Belum Dimulai"}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    size: 150,
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aksi" />
    ),
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    size: 100,
    enablePinning: true,
    meta: {
      position: "right"
    } as ColumnMeta
  },
]; 