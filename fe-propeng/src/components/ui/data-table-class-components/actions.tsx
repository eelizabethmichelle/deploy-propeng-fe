// actions.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { CheckCircle, X as XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Class } from "./columns";

interface DataTableActionsProps {
  row: Row<Class>;
}

export function DataTableActions({ row }: DataTableActionsProps) {
  const router = useRouter();
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [classDetail, setClassDetail] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = row.original.id;

  const handleDetail = () => {
    router.push(`/admin/kelas/detail/${id}`);
  };

  const handleEdit = () => {
    router.push(`/admin/kelas/edit/${id}`);
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
