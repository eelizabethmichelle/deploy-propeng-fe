"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/dt-lihat-murid/data-table";
import { columns } from "@/components/ui/dt-lihat-murid/columns";

async function fetchStudents(token: string | null) {
  if (!token) return null;

  try {
    const response = await fetch("http://localhost:8000/api/auth/list_student/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data dari server");

    const jsonData = await response.json();
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

    fetchStudents(token).then(setData);
  }, [router]);

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex flex-col items-start justify-between">
        <h2 className="mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Datatables
        </h2>
        <p className="text-muted-foreground">Lorem&apos;s ipsum sir dolot amit!</p>
      </div>
      <DataTable data={data || []} columns={columns} />
    </div>
  );
}
