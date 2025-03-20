// src/app/admin/lihat-kelas/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table-class-components/data-table";
import { columns } from "@/components/ui/data-table-class-components/columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

      // Check if token exists
      if (!token) {
        console.error("No authentication token found");
        router.push("/login");
        return;
      }

      // Make API request with proper error handling
      const response = await fetch(`/api/kelas/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        // For 400 or 404 status, we'll treat it as empty data
        if (response.status === 400 || response.status === 404) {
          console.log(response);
          setData([]);
          setLoading(false);
          return;
        }

        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Parse JSON response
      const jsonData = await response.json();

      // Check API response status
      if (jsonData.status === 201) {
        if (!jsonData.data || jsonData.data.length === 0) {
          setData([]);
        } else {
          setData(jsonData.data);
        }
      } else if (jsonData.status === 400 || jsonData.status === 404 || jsonData.status == 500) {
        // Handle empty data case
        setData([]);
      } else {
        throw new Error(jsonData.errorMessage || "Failed to fetch data");
      }

      // Clear the refresh flag
      localStorage.removeItem('kelas_data_refresh');
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to fetch data");
      setData([]);

      // Show error toast
      toast.error("Gagal memuat data", {
        description: error.message || "Terjadi kesalahan saat mengambil data kelas"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Set up a listener for when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const needsRefresh = localStorage.getItem('kelas_data_refresh') === 'true';
        if (needsRefresh) {
          await fetchData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check for refresh flag periodically
    const refreshInterval = setInterval(() => {
      const needsRefresh = localStorage.getItem('kelas_data_refresh') === 'true';
      if (needsRefresh) {
        fetchData();
      }
    }, 2000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Semua Kelas
          </h2>
          <p className="text-muted-foreground">
            Kelola semua kelas yang tersedia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => router.push("/admin/kelas/tambah-kelas")}
            className="bg-blue-800 hover:bg-blue-900"
          >
            Tambah Kelas
            <Plus className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Memuat data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchData}>Coba Lagi</Button>
        </div>
      ) : (
        // Always render the DataTable, even with empty data
        <DataTable data={data} columns={columns} />
      )}
    </div>
  );
}
