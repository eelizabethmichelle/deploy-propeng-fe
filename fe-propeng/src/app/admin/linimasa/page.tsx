"use client";
//lihat all disini
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Plus } from "lucide-react";
import { format, parseISO, isAfter, isBefore, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/dt-lihat-linimasa/data-table";
import { linimasaColumns } from "@/components/ui/dt-lihat-linimasa/columns";
// import { LINIMASA_UPDATED_EVENT } from "@/lib/events";

interface MatpelOption {
  id: number;
  nama: string;
  capacity: number;
}

interface Matpel {
  tier1_option1: MatpelOption;
  tier1_option2: MatpelOption;
  tier2_option1: MatpelOption;
  tier2_option2: MatpelOption;
  tier3_option1: MatpelOption;
  tier3_option2: MatpelOption;
  tier4_option1: MatpelOption;
  tier4_option2: MatpelOption;
}

interface Event {
  id: number;
  start_date: string;
  end_date: string;
  angkatan: number;
  created_at: string;
  updated_at: string;
  submissions_count: number;
  matpel: Matpel;
  status: string;
}

type SortField = 'start_date' | 'end_date' | 'angkatan' | 'status' | 'submissions_count';
type SortDirection = 'asc' | 'desc';


const LINIMASA_UPDATED_EVENT = "linimasa_updated";
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
  },
  warning: (title: string, description: string) => {
    toast.warning(title, {
      description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
    });
  }
};

export default function LinimasaPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Register event listener for linimasa updates
  useEffect(() => {
    const handleLinimasaUpdated = () => {
      console.log("Linimasa updated event received");
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener(LINIMASA_UPDATED_EVENT, handleLinimasaUpdated);
    
    return () => {
      window.removeEventListener(LINIMASA_UPDATED_EVENT, handleLinimasaUpdated);
    };
  }, []);

  // Fetch events whenever the refresh trigger changes
  useEffect(() => {
    fetchEvents();
  }, [refreshTrigger]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      if (!accessToken) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/linimasa", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        // Add cache control to prevent caching
        cache: "no-store"
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 200) {
        setEvents(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch events");
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      setError(error.message || "Failed to fetch events");
      customToast.error("Gagal memuat data", "Terjadi kesalahan saat mengambil data linimasa");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Manually trigger a refresh
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d MMMM yyyy", { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aktif":
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm">
            <CheckCircle size={16} />
            <span>Aktif</span>
          </div>
        );
      case "telah_berakhir":
        return (
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-sm">
            <Clock size={16} />
            <span>Telah Berakhir</span>
          </div>
        );
      case "akan_datang":
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full text-sm">
            <AlertCircle size={16} />
            <span>Belum Dimulai</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
            <AlertCircle size={16} />
            <span>{status}</span>
          </div>
        );
    }
  };

  const isEventEditable = (event: Event) => {
    const now = new Date();
    const endDate = new Date(event.end_date);
    
    // Event is editable if it hasn't ended yet AND has no submissions
    return isBefore(now, endDate) && event.submissions_count === 0;
  };

  const getEditTooltipMessage = (event: Event) => {
    const now = new Date();
    const endDate = new Date(event.end_date);
    
    if (isAfter(now, endDate)) {
      return "Event yang sudah berakhir tidak dapat diedit";
    } else if (event.submissions_count > 0) {
      return "Event yang sudah memiliki submisi tidak dapat diedit";
    }
    return "";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={16} className="text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={16} className="text-[#041765]" /> 
      : <ArrowDown size={16} className="text-[#041765]" />;
  };

  // Filter events based on status
  const filteredEvents = events.filter(event => {
    if (statusFilter === "all") return true;
    
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    switch (statusFilter) {
      case "active":
        return isAfter(now, startDate) && isBefore(now, endDate);
      case "ended":
        return isAfter(now, endDate);
      case "upcoming":
        return isBefore(now, startDate);
      default:
        return true;
    }
  });

  // Sort the filtered events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'start_date':
        comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        break;
      case 'end_date':
        comparison = new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        break;
      case 'angkatan':
        comparison = (a.angkatan || 0) - (b.angkatan || 0);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'submissions_count':
        comparison = a.submissions_count - b.submissions_count;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Calculate pagination
  useEffect(() => {
    if (filteredEvents.length > 0) {
      setTotalPages(Math.ceil(filteredEvents.length / itemsPerPage));
      // Reset to first page if current page is out of bounds
      if (currentPage > Math.ceil(filteredEvents.length / itemsPerPage)) {
        setCurrentPage(1);
      }
    } else {
      setTotalPages(1);
    }
  }, [filteredEvents, itemsPerPage, currentPage]);

  // Get current events for pagination
  const getCurrentEvents = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedEvents.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchEvents}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
          Manajemen Linimasa Pendafataran Mata Pelajaran Peminatan
          </h2>
          <p className="text-muted-foreground">
          Daftar event dan jadwal pemilihan mata pelajaran
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="default"
            onClick={refreshData}
            className="mr-2"
          >
            Refresh Data
          </Button>
          <Button 
            variant="default" 
            size="default"
            className="bg-[#041765] text-white hover:bg-[#041765]/90"
            onClick={() => router.push('/admin/linimasa/tambah')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Linimasa
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
        </div>
      </div>
      <CardContent className="p-0">
        <DataTable 
          columns={linimasaColumns} 
          data={events} 
          refreshTrigger={refreshTrigger}
        />
      </CardContent>
    </div>
  );
} 