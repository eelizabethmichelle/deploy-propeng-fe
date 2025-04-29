"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { ClipboardList, Trash2, Pencil } from "lucide-react";
import { LINIMASA_UPDATED_EVENT } from "@/lib/events";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
     Dialog,
     DialogTrigger,
     DialogContent,
     DialogHeader,
     DialogTitle,
     DialogDescription,
     DialogFooter,
     DialogClose,
  } from "@/components/ui/dialog";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = row.original as any;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const customToast = {
    success: (title: string, description: string) => {
      toast.success(title, {
        description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
      });
    },
    error: (title: string, description: string) => {
      toast.error(title, {
        description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
      });
    }
  };

  const handleDelete = async () => {
    if ((data as any).submissions_count > 0) {
      customToast.error(
        "Linimasa ini tidak dapat dihapus karena sudah ada submisi pendaftaran mata pelajaran peminatan siswa",
        ""
      );
      setDeleteDialogOpen(false);
      return;
    }
    setIsDeleting(true);

    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      console.log("Deleting event with ID:", data.id);

      const response = await fetch(`/api/linimasa/hapus/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} id ${data.id}`,
        },
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Delete response data:", responseData);

      if (responseData.status === 200) {
        customToast.success("Berhasil Menghapus Linimasa", "");
        
        // Dispatch custom event to notify the parent component
        window.dispatchEvent(new Event(LINIMASA_UPDATED_EVENT));

        // Wait a moment to allow the event to be processed
        setTimeout(() => {
          // Use nextjs router to refresh the data without full page reload
          router.refresh();
        }, 100);
      } else {
        throw new Error(responseData.message || "Failed to delete event");
      }
    } catch (error: any) {
      console.error("Error deleting event:", error);
      customToast.error("Gagal Menghapus Event", error.message || "Terjadi kesalahan saat menghapus event");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="default"
          size="sm"
          className="bg-[#041765] text-white hover:bg-[#041765]/90"
          onClick={() => router.push(`/admin/linimasa/${data.id}`)}
        >
          <ClipboardList size={14} className="mr-1" />
          Lihat Submisi
        </Button>
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
                router.push(`/admin/linimasa/ubah/${data.id}`);
                setDropdownOpen(false);
              }}
              disabled={loading}
            >
              <Pencil size={14} className="mr-2" />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setDeleteDialogOpen(true);
                setDropdownOpen(false);
              }}
              disabled={loading}
              className="text-red-600"
            >
              <Trash2 size={14} className="mr-2" />
              Hapus
            </DropdownMenuItem>
            {/* <DialogTrigger asChild>
              <DropdownMenuItem className="text-red-600">
              <Trash2 size={14} className="mr-2" />
              Hapus
              </DropdownMenuItem>
            </DialogTrigger> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Apakah Anda yakin menghapus linimasa ini?</DialogTitle>
      <DialogDescription>
        Linimasa yang sudah terhapus tidak dapat dikembalikan.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="sm:justify-end flex gap-4">
      <DialogClose asChild>
        <Button variant="neutral">
          Batal
        </Button>
      </DialogClose>
      <Button
        variant="destructive"
        onClick={handleDelete}
      >
        {isDeleting ? "Menghapus..." : "Ya, Hapus"}
      </Button>

      
    </DialogFooter>
  </DialogContent>
</Dialog>

  </>
);}