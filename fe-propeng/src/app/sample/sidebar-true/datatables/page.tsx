// import { Metadata } from "next";
// import fs from "fs";
// import path from "path";
// import { DataTable } from "@/components/ui/data-table-components/data-table";
// import { columns } from "@/components/ui/data-table-components/columns";

// export const metadata: Metadata = {
//   title: "Murid",
//   description: "A table build using Tanstack Table."
// };

// // async function getData() {
// //   try {
// //     // Fetch data dari API
// //     const response = await fetch("http://localhost:8000/api/kelas/");

// //     if (!response.ok) {
// //       throw new Error("Gagal mengambil data dari server");
// //     }

// //     const jsonData = await response.json();

// //     // Ambil hanya bagian "data" tanpa JSON.parse
// //     const data = jsonData.data;

// //     return data;

// //   } catch (error) {
// //     console.error("Error:", error);
// //     return null;
// //   }
// // }

// async function getData() {
//   const filePath = path.join(
//     process.cwd(),
//     "src/components/ui/data-table-components",
//     "data.json"
//   );
//   const data = fs.readFileSync(filePath, "utf8");
//   return JSON.parse(data);
// }

// export default async function Page() {
//   const data = await getData();
//   console.log("data", data);

//   return (
//     <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
        
//         <div className="flex flex-col items-start justify-between">
              
//         <h2 className="mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
//             Datatables
//         </h2>
//         <p className="text-muted-foreground">
//           Lorem&apos;s ipsum sir dolot amit!
//         </p>
//       </div>
//       <DataTable data={data} columns={columns} />
//     </div>
//   );
// }



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
          List Murid
        </h2>
        <p className="text-muted-foreground">SMAK Anglo</p>
      </div>
      <DataTable data={data || []} columns={columns} />
    </div>
  );
}
