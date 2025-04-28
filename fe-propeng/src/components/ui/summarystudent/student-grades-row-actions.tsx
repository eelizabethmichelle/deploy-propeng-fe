// src/components/ui/summarystudent/static-table-row-actions.tsx
'use client';

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Eye } from "lucide-react";

interface StaticTableRowActionsProps {
  subjectId: string;
}

export function StaticTableRowActions({ subjectId }: StaticTableRowActionsProps) {
  const canViewDetail = !!subjectId;
  // Sesuaikan path ini jika halaman detail Anda berbeda
  // Misalnya: /siswa/nilai/[subjectId] atau /siswa/detail-nilai/[subjectId]
  const detailUrl = canViewDetail ? `/siswa/laporannilai/${subjectId}` : '#';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted mx-auto">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Buka menu aksi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem
            asChild
            disabled={!canViewDetail}
            className={!canViewDetail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        >
            <Link href={detailUrl} className="flex items-center w-full">
                 <Eye className="mr-2 h-4 w-4" />
                 Lihat Detail Nilai
            </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}