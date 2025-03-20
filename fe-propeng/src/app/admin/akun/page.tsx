"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/dt-lihat-akun/data-table";
import { columns } from "@/components/ui/dt-lihat-akun/columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

async function fetchAccount(token: string | null) {
  if (!token) return null;

  try {
    const response = await fetch('/api/account/view-all', {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data dari server");

    const jsonData = await response.json();
    console.log(jsonData.data);
    return jsonData.data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export default function Page() {
  const [data, setData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    fetchAccount(token).then(setData);
  }, [router]);

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Daftar Akun Pengguna
          </h2>
          <p className="text-muted-foreground">
            Guru dan Siswa SMAK Anglo
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => router.push("/admin/akun/tambah")}
          className="bg-blue-800 hover:bg-blue-900"
        >
          Tambah Akun
          <Plus className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <DataTable data={data || []} columns={columns} />
    </div>
  );
}