// components/ui/evalguru-overview-tahunan/overview-tahunan-row-actions.tsx
'use client';

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import Link from "next/link";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    // DropdownMenuSeparator, // Jika ada aksi lain
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { FlattenedEvaluasiGuruOverview } from "./schema"; // Sesuaikan path

interface OverviewTahunanRowActionsProps {
  row: Row<FlattenedEvaluasiGuruOverview>;
}

export function OverviewTahunanRowActions({ row }: OverviewTahunanRowActionsProps) {
  const evaluasi = row.original;

  // URL untuk halaman detail akan membutuhkan guru_id dan tahun_ajaran_id
  // tahun_ajaran di sini adalah string dari tahunnya, misal "2025"
  // Backend get_teacher_evaluation_detail_page (atau nama barunya)
  // sudah diubah untuk menerima tahun_ajaran_id sebagai nilai tahun (integer)
  const detailPageUrl = `/admin/evalguru/detail/${evaluasi.guru_id}/${evaluasi.tahun_ajaran}`;
  // Ganti '/admin/evaluasi-guru/detail-guru/' dengan path routing frontend Anda yang benar

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Buka menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={detailPageUrl}>
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail Evaluasi
          </Link>
        </DropdownMenuItem>
        {/* Jika ada aksi lain, tambahkan di sini:
        <DropdownMenuSeparator />
        <DropdownMenuItem>
            Aksi Lain
        </DropdownMenuItem> 
        */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}