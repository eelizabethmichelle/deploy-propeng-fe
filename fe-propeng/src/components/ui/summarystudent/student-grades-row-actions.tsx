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
  kelasId: string; // Tambahkan kelasId jika diperlukan
}

export function StaticTableRowActions({ subjectId, kelasId }: StaticTableRowActionsProps) {
  const canViewDetail = !!subjectId;
  // Sesuaikan path ini jika halaman detail Anda berbeda
  // Misalnya: /siswa/nilai/[subjectId] atau /siswa/detail-nilai/[subjectId]
  const detailUrl = `/siswa/laporannilai/${kelasId}/${subjectId}`;
  const isiEvalGuruUrl = canViewDetail ? `/siswa/evalguru/${subjectId}/buat` : '#';

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
        
        <DropdownMenuItem
            asChild
            disabled={!canViewDetail}
            className={!canViewDetail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        >
            <Link href={isiEvalGuruUrl} className="flex items-center w-full">
                 <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                   <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                 </svg>
                 Isi Evaluasi
            </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}