// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// export default function DashboardPage() {
//     const router = useRouter();
//     const [user, setUser] = useState<{ username: string } | null>(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         // Check if the user is authenticated
//         const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

//         if (!accessToken) {
//             // Redirect to login if no token is found
//             router.push("/login");
//             return;
//         }

//         // Fetch user data (example)
//         const fetchUserData = async () => {
//             try {
//                 const res = await fetch("/api/user", {
//                     headers: {
//                         Authorization: `Bearer ${accessToken}`,
//                     },
//                 });

//                 if (res.ok) {
//                     const data = await res.json();
//                     setUser(data);
//                 } else {
//                     // Handle token expiry or invalid token
//                     localStorage.removeItem("accessToken");
//                     sessionStorage.removeItem("accessToken");
//                     router.push("/login");
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch user data:", error);
//                 router.push("/login");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchUserData();
//     }, [router]);

//     const handleLogout = () => {
//         // Clear tokens and redirect to login
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//         sessionStorage.removeItem("accessToken");
//         sessionStorage.removeItem("refreshToken");
//         router.push("/login");
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gray-50">
//                 <div className="text-center">
//                     <p className="text-lg text-gray-700">Loading...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gray-50">
//             <nav className="bg-white shadow-sm">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="flex justify-between h-16 items-center">
//                         <div className="flex items-center">
//                             <Link href="/dashboard" className="text-xl font-bold text-blue-600">
//                                 Dashboard
//                             </Link>
//                         </div>
//                         <div className="flex items-center space-x-4">
//                             {user && (
//                                 <span className="text-gray-700">Welcome, {user.username}</span>
//                             )}
//                             <button
//                                 onClick={handleLogout}
//                                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
//                             >
//                                 Logout
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </nav>

//             <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//                 <div className="px-4 py-6 sm:px-0">
//                     <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-6">
//                         <h2 className="text-2xl font-bold text-gray-900">Dashboard Content</h2>
//                         <p className="mt-4 text-gray-600">
//                             This is your dashboard. You can add charts, tables, or other content here.
//                         </p>
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
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
