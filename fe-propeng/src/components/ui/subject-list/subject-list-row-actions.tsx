'use client';

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SubjectSummary } from "./schema"; 
import { BookOpen, Edit, LucideBookOpenText, ClipboardList } from "lucide-react"; 
interface SubjectListRowActionsProps {
  row: Row<SubjectSummary>;
}

export function SubjectListRowActions({ row }: SubjectListRowActionsProps) {
  const subjectId = row.original.id;

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
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem asChild>
          <Link href={`/guru/mata-pelajaran/detil/${subjectId}`}>
              <LucideBookOpenText className="mr-2 h-4 w-4" />
              Atur Komponen Penilaian dan Bobot
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href={`/guru/manajemennilai/inputnilai/${subjectId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Input Nilai
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href={`/guru/mata-pelajaran/rekapitulasi-nilai/${subjectId}`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Lihat Rekapitulasi Nilai
            </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}