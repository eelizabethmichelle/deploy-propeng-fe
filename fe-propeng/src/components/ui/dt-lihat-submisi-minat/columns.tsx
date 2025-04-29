"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-lihat-submisi-minat/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-lihat-submisi-minat/sort";
import { useRouter } from "next/navigation";
import { Button } from "../button";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

export const submisiMinatColumns = (linimasaId: string): ColumnDef<Schema>[] => {
  return [
    {
      accessorKey: "siswa",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama Siswa" />
      ),
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <span className="max-w-[250px] truncate font-medium capitalize">
            {row.getValue("siswa")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Waktu Perubahan Terakhir" />
      ),
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <span className="max-w-[250px] truncate font-medium capitalize">
            {row.getValue("submittedAt")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const value = row.getValue("status") as string;
        return (
          <span className={value === "Sudah Diulas" ? "text-green-600" : "text-yellow-600"}>
            {value}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Aksi" />
      ),
      cell: ({ row }) => {
        const router = useRouter();
        const id = row.original.id;
        const [role, setRole] = useState<string | null>(null);

        useEffect(() => {
          const fetchUserRole = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const res = await fetch("/api/auth/detail", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setRole(json?.data_user?.role || null);
          };

          fetchUserRole();
        }, []);

        if (!role) return null;

        const targetUrl =
          role === "teacher"
            ? `/guru/submisi-peminatan/${linimasaId}/detail/${id}`
            : `/admin/linimasa/${linimasaId}/detail/${id}`;

        return (
          <Button variant="default" onClick={() => router.push(targetUrl)}>
             <Pencil size={14} className="mr-2" />
            Ubah Status
          </Button>
        );
      },
    },
  ];
};
