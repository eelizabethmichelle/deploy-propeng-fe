// components/ui/classlist/actions.tsx

"use client";

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
import { useRouter } from "next/navigation";

interface ClassListRowActionsProps {
  classId: number;
}

export function ClassListRowActions({ classId }: ClassListRowActionsProps) {
const router = useRouter();
  const handleDetail = () => {
    router.push(`/siswa/detaillaporannilaiabsen/${classId}`);
  };

  return (
    <>
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={handleDetail}>
            Lihat Detail
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
}
