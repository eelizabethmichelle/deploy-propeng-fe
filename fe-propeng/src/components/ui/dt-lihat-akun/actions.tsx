"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Progress } from "@/components/ui/progress";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = row.original as any;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          disabled={loading}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem 
          onClick={() => { 
            router.push(`/admin/akun/detil/${data.id}`);
            setDropdownOpen(false);
          }}
          disabled={loading}
        >
          Lihat Detail
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => { 
            router.push(`/admin/akun/ubah/${data.id}`);
            setDropdownOpen(false);
          }}
          disabled={loading}
        >
          Ubah
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
