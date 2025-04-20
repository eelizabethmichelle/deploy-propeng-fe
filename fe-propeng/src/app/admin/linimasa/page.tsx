"use client";
//lihat all disini
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, MoreVertical, Eye, ClipboardList, CalendarClock, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, parseISO, isAfter, isBefore, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
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
            <CalendarClock size={16} />
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

  const getDeleteTooltipMessage = (event: Event) => {
    const now = new Date();
    const endDate = new Date(event.end_date);

    if (isAfter(now, endDate)) {
      return "Event yang sudah berakhir tidak dapat dihapus";
    } else if (event.submissions_count > 0) {
      return "Event yang sudah memiliki submisi tidak dapat dihapus";
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

  const handleUpdate = (eventId: number) => {
    router.push(`/admin/linimasa/update/${eventId}`);
  };

  const openDeleteDialog = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);

    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      console.log("Deleting event with ID:", eventToDelete.id);

      const response = await fetch(`/api/linimasa/hapus/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} id ${eventToDelete.id}`,
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

      const data = await response.json();
      console.log("Delete response data:", data);

      if (data.status === 200) {
        customToast.success("Berhasil Menghapus Linimasa", "");
        // Remove the deleted event from the state
        setEvents(events.filter(event => event.id !== eventToDelete.id));
      } else {
        throw new Error(data.message || "Failed to delete event");
      }
    } catch (error: any) {
      console.error("Error deleting event:", error);
      customToast.error("Gagal Menghapus Event", error.message || "Terjadi kesalahan saat menghapus event");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-normal text-[#041765]">Manajemen Linimasa Pengajuan Mata Pelajaran Peminatan</h2>
          <p className="text-sm text-[#88888C]">Daftar event dan jadwal pemilihan mata pelajaran</p>
        </div>

        <Card className="border-[#E1E2E8]">
          <CardHeader className="p-6 border-b border-[#E6E9F4]">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold text-[#041765]">Daftar Event</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="default"
                  className="bg-[#041765] text-white hover:bg-[#041765]/90"
                  onClick={() => router.push('/admin/linimasa/tambah')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Linimasa
                </Button>
                <span className="text-sm text-gray-500">Filter:</span>
                <Select
                  value={statusFilter}
                  onValueChange={handleFilterChange}
                >
                  <SelectTrigger className="h-9 w-[150px]">
                    <SelectValue placeholder="Semua Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Event</SelectItem>
                    <SelectItem value="active">Event Aktif</SelectItem>
                    <SelectItem value="ended">Event Berakhir</SelectItem>
                    <SelectItem value="upcoming">Event Mendatang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Tidak ada event yang tersedia dengan filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F7F8FF] border-b border-[#E6E9F4]">
                      <th
                        className="p-4 text-left text-sm font-medium text-[#041765] cursor-pointer"
                        onClick={() => handleSort('start_date')}
                      >
                        <div className="flex items-center gap-1">
                          Tanggal Mulai
                          {getSortIcon('start_date')}
                        </div>
                      </th>
                      <th
                        className="p-4 text-left text-sm font-medium text-[#041765] cursor-pointer"
                        onClick={() => handleSort('end_date')}
                      >
                        <div className="flex items-center gap-1">
                          Tanggal Berakhir
                          {getSortIcon('end_date')}
                        </div>
                      </th>
                      <th
                        className="p-4 text-left text-sm font-medium text-[#041765] cursor-pointer"
                        onClick={() => handleSort('angkatan')}
                      >
                        <div className="flex items-center gap-1">
                          Angkatan
                          {getSortIcon('angkatan')}
                        </div>
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-[#041765]">
                        Mata Pelajaran
                      </th>
                      <th
                        className="p-4 text-left text-sm font-medium text-[#041765] cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th
                        className="p-4 text-left text-sm font-medium text-[#041765] cursor-pointer"
                        onClick={() => handleSort('submissions_count')}
                      >
                        <div className="flex items-center gap-1">
                          Pendaftar
                          {getSortIcon('submissions_count')}
                        </div>
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-[#041765]">
                        Submisi
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-[#041765]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentEvents().map((event) => (
                      <tr key={event.id} className="border-b border-[#E6E9F4] hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-[#041765]">
                            <Calendar size={16} className="text-[#586AB3]" />
                            <span>{formatDate(event.start_date)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-[#041765]">
                            <Calendar size={16} className="text-[#586AB3]" />
                            <span>{formatDate(event.end_date)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-[#041765] font-medium">
                            Angkatan {event.angkatan || '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm text-[#041765]">
                              <span className="font-medium">Opsi 1:</span> {event.matpel.tier1_option1.nama || '-'} / {event.matpel.tier1_option2.nama || '-'}
                            </div>
                            <div className="text-sm text-[#041765]">
                              <span className="font-medium">Opsi 2:</span> {event.matpel.tier2_option1.nama || '-'} / {event.matpel.tier2_option2.nama || '-'}
                            </div>
                            <div className="text-sm text-[#041765]">
                              <span className="font-medium">Opsi 3:</span> {event.matpel.tier3_option1.nama || '-'} / {event.matpel.tier3_option2.nama || '-'}
                            </div>
                            <div className="text-sm text-[#041765]">
                              <span className="font-medium">Opsi 4:</span> {event.matpel.tier4_option1.nama || '-'} / {event.matpel.tier4_option2.nama || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(event.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-[#041765]">
                            <Users size={16} className="text-[#586AB3]" />
                            <span>{event.submissions_count} siswa</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="default"
                            size="default"
                            className="bg-[#041765] text-white hover:bg-[#041765]/90 px-4 py-2"
                            onClick={() => router.push(`/admin/linimasa/${event.id}`)}
                          >
                            <ClipboardList size={16} className="mr-2" />
                            Lihat Submisi
                          </Button>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Buka menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <TooltipProvider>
                                {/* --- Edit Button --- */}
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <DropdownMenuItem
                                        onClick={() => handleUpdate(event.id)}
                                        disabled={!isEventEditable(event)}
                                        className={`group w-full ${!isEventEditable(event)
                                            ? "opacity-60 cursor-not-allowed text-gray-500"
                                            : ""
                                          }`}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Ubah</span>
                                      </DropdownMenuItem>
                                    </div>
                                  </TooltipTrigger>
                                  {!isEventEditable(event) && (
                                    <TooltipContent
                                      className="bg-red-600 text-white text-sm font-medium px-3 py-2 rounded shadow-md max-w-xs"
                                      side="right"
                                    >
                                      Linimasa ini tidak dapat diubah karena sudah ada submisi pengajuan mata pelajaran peminatan siswa.
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                {/* --- Delete Button --- */}
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <DropdownMenuItem
                                        onClick={() => openDeleteDialog(event)}
                                        disabled={!isEventEditable(event)}
                                        className={`group w-full ${!isEventEditable(event)
                                            ? "opacity-60 cursor-not-allowed text-red-500"
                                            : "text-red-600 hover:bg-red-50 focus:bg-red-100"
                                          }`}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4 group-disabled:text-red-400" />
                                        <span>Hapus</span>
                                      </DropdownMenuItem>
                                    </div>
                                  </TooltipTrigger>
                                  {!isEventEditable(event) && (
                                    <TooltipContent
                                      className="bg-red-600 text-white text-sm font-medium px-3 py-2 rounded shadow-md max-w-xs"
                                      side="right"
                                    >
                                      Linimasa ini tidak dapat dihapus karena sudah ada submisi pengajuan mata pelajaran peminatan siswa.
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t border-[#E6E9F4]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Tampilkan</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">dari {filteredEvents.length} data</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`h-8 w-8 p-0 ${currentPage === page ? "bg-[#041765] text-white" : ""
                            }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus linimasa pengajuan mata pelajaran peminatan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 