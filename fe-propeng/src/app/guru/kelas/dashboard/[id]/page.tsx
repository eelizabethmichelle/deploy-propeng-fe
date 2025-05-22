"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarCheck, CheckSquare, GraduationCap, Info, Check, CheckCircle, Clock, X, XCircle, MousePointerClick, HeartPulse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// --- Add imports for new Dashboard tabs ---
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ClassData {
  id: number;
  namaKelas: string;
  tahunAjaran: string;
  waliKelas: string;
  totalSiswa: number;
  angkatan: number;
  isActive: boolean;
  expiredAt: string;
  absensiStats: {
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlfa: number;
  };
  siswa: {
    id: number;
    name: string;
    isAssignedtoClass: boolean;
    nisn: string;
    username: string;
  }[];
}

interface AttendanceStats {
  presentCount: number;
  sickCount: number;
  permissionCount: number;
  absentCount: number;
  notYetSubmittedCount: number;
}

interface StudentAttendance {
  id: number;
  name: string;
  attendanceByDate: {
    [date: string]: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null;
  };
}

interface AttendanceData {
  kelas: string;
  teacher: string;
  dates: string[];
  students: {
    [studentName: string]: {
      id: number;
      dates: {
        [date: string]: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
      }
    }
  }
}

interface CellSelection {
  studentId: number;
  date: string;
}

interface ContextMenuPosition {
  x: number;
  y: number;
  studentId: number;
  date: string;
}

interface WeeklyAttendanceDataDash {
  kelas_info: {
    id: number
    namaKelas: string
    waliKelas: string
    totalSiswa: number
  }
  week_info: {
    startDate: string
    endDate: string
    displayMonth: string
    displayWeek: string
  }
  weekly_averages: {
    Hadir: number
    Sakit: number
    Izin: number
    Alfa: number
  }
  daily_details: {
    day_name: string
    date: string
    attendance_percentage: number
    counts: {
      Hadir?: number
      Sakit?: number
      Izin?: number
      Alfa?: number
    }
    has_record: boolean
  }[]
}

interface MonthlyAnalysisDataDash {
  kelas_info: {
    id: number
    namaKelas: string
    waliKelas: string
    totalSiswa: number
  }
  month_info: {
    year: number
    monthNumber: number
    monthName: string
    startDate: string
    endDate: string
    totalPossibleDaysInMonth: number
  }
  top_students: {
    id: number
    name: string
    percentage: number
    counts: {
      Hadir: string
      Sakit: string
      Izin: string
      Alfa: string
    }
  }[]
  bottom_students: {
    id: number
    name: string
    percentage: number
    counts: {
      Hadir: string
      Sakit: string
      Izin: string
      Alfa: string
    }
  }[]
}

interface YearlyDataDash {
  kelas_info: {
    id: number
    namaKelas: string
    waliKelas: string
    totalSiswa: number
  }
  year: number
  monthly_summaries: {
    month_info: {
      year: number
      monthNumber: number
      monthName: string
      startDate: string
      endDate: string
      totalDays: number
    }
    monthly_averages: {
      Hadir: number
      Sakit: number
      Izin: number
      Alfa: number
    }
    weekly_summaries: {
      week_info: {
        startDate: string
        endDate: string
        displayWeek: string
      }
      weekly_averages: {
        Hadir: number
        Sakit: number
        Izin: number
        Alfa: number
      }
      daily_details: {
        day_name: string
        date: string
        attendance_percentage: number
        counts: {
          Hadir?: number
          Sakit?: number
          Izin?: number
          Alfa?: number
        }
        has_record: boolean
      }[]
    }[]
  }[]
}

interface MonthlyAnalysisDash {
  top_students: {
    id: number
    name: string
    percentage: number
    counts: {
      Hadir: string
      Sakit: string
      Izin: string
      Alfa: string
    }
  }[]
  bottom_students: {
    id: number
    name: string
    percentage: number
    counts: {
      Hadir: string
      Sakit: string
      Izin: string
      Alfa: string
    }
  }[]
  // ...other fields if needed
}

// New interfaces for monthly detail data
interface WeeklySummaryDash {
  week_number: number
  date_range: string
  startDate: string
  endDate: string
  counts: {
    Hadir: string
    Sakit: string
    Izin: string
    Alfa: string
  }
  possible_days_in_week: number
}

interface StudentDetailDash {
  id: number
  name: string
  nisn: string
  monthly_percentage: number
  monthly_counts: {
    Hadir: string
    Sakit: string
    Izin: string
    Alfa: string
  }
  weekly_summary: WeeklySummaryDash[]
}

interface MonthlyDetailDataDash {
  kelas_info: {
    id: number
    namaKelas: string
    waliKelas: string
    totalSiswa: number
  }
  month_info: {
    year: number
    monthNumber: number
    monthName: string
    startDate: string
    endDate: string
    totalPossibleDaysInMonth: number
  }
  students_details: StudentDetailDash[]
}

// Add month names for Indonesian
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const getMonthName = (month: number) => monthNames[month - 1] || "";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id;
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    presentCount: 0,
    sickCount: 0,
    permissionCount: 0,
    absentCount: 0,
    notYetSubmittedCount: 0
  });
  const [attendanceCode, setAttendanceCode] = useState<string>("");
  const [noAttendanceDataFound, setNoAttendanceDataFound] = useState<boolean>(false);
  const [expiryTime, setExpiryTime] = useState<number>(0);
  const [isCodeGenerated, setIsCodeGenerated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // --- Dashboard Data Presensi Siswa states ---
  const [selectedMonthOverviewDash, setSelectedMonthOverviewDash] = useState<string>(new Date().getMonth().toString());
  const [selectedWeekOverviewDash, setSelectedWeekOverviewDash] = useState<string>("0");
  const [overviewWeeklyDataDash, setOverviewWeeklyDataDash] = useState<WeeklyAttendanceDataDash | null>(null);
  const [overviewAvailableWeeksDash, setOverviewAvailableWeeksDash] = useState<{ value: string; label: string }[]>([]);
  const [yearlyDataDash, setYearlyDataDash] = useState<YearlyDataDash | null>(null);
  const [activeWeeklyDataDash, setActiveWeeklyDataDash] = useState<WeeklyAttendanceDataDash | null>(null);

  const [selectedMonthAnalysisDash, setSelectedMonthAnalysisDash] = useState<string>(new Date().getMonth().toString());
  const [monthlyAnalysisDash, setMonthlyAnalysisDash] = useState<MonthlyAnalysisDash | null>(null);
  const [isLoadingMonthlyDash, setIsLoadingMonthlyDash] = useState(false);

  const [monthlyDetailDataDash, setMonthlyDetailDataDash] = useState<MonthlyDetailDataDash | null>(null);
  const [selectedMonthDetailDash, setSelectedMonthDetailDash] = useState<string>((new Date().getMonth() + 1).toString());
  const [isLoadingMonthlyDetailDash, setIsLoadingMonthlyDetailDash] = useState(false);
  const [searchQueryDash, setSearchQueryDash] = useState("");
  const [currentPageDash, setCurrentPageDash] = useState(1);
  const [selectedStudentDash, setSelectedStudentDash] = useState<StudentDetailDash | null>(null);
  const [isDetailModalOpenDash, setIsDetailModalOpenDash] = useState(false);
  const [itemsPerPageDash, setItemsPerPageDash] = useState(10);

  const getFormattedTodayDate = () => { /* ... keep function ... */
    const today = new Date();
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(today);
  };
  const customToast = {
    success: (title: string, description: string) => {
      // Using global styles defined in Toaster component for success
      toast.success(title, {
        description: description
      });
    },
    error: (title: string, description: string) => {
      // Using global styles defined in Toaster component for error
      toast.error(title, {
        description: description
      });
    },
    warning: (title: string, description: string) => {
      toast.warning(
        title, // Title sebagai argumen pertama
        { // Objek options sebagai argumen kedua
          description: ( // Bungkus deskripsi dengan span dan paksa warna hitam
            <span className="!text-black">
              {description}
            </span>
          ),
          icon: ( // Struktur icon tetap sama
            <AlertCircle className="h-5 w-5 text-[#E8B904]" />
          )
        }
      );
    }
  };

  const generateAttendanceCodeAndShowModal = async () => {
    if (!classData) {
      customToast.error("Gagal", "Data kelas tidak ditemukan");
      return false; // Indicate failure
    }
    // Prevent generating new code if one is already active in the modal
    if (expiryTime > 0 && attendanceCode) {
      setIsModalOpen(true); // Just re-open the modal with the existing code
      return true; // Indicate success (modal opened)
    }

    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      const response = await fetch(`/api/kelas/kode`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} Id ${classId}`,
        },
      });
      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        router.push("/login");
        return false; // Indicate failure
      }

      // Added validation for the case when data isn't available
      if (data.status === 404) {
        customToast.error("Gagal", data.errorMessage || "Data tidak tersedia");
        setIsModalOpen(false);
        return false;
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat kode presensi");
      }

      setAttendanceCode(data.data.kode);
      setExpiryTime(30);
      setIsModalOpen(true); // Open the modal on success
      customToast.success("Berhasil", "Kode presensi berhasil dibuat");
      return true; // Indicate success

    } catch (error: any) {
      customToast.error("Gagal", error.message || "Gagal membuat kode presensi");
      setIsModalOpen(false); // Ensure modal doesn't open on error
      return false; // Indicate failure
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

      if (!token) {
        console.error("No authentication token found");
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/kelas/detailBaru`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token} id ${classId}`,
        },
      });


      if (!response.ok) {
        if (response.status === 401) {

          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }


        if (response.status === 400 || response.status === 404) {
          setClassData(null);
          setLoading(false);
          return;
        }

        throw new Error(`Server responded with status: ${response.status}`);
      }


      const jsonData = await response.json();
      console.log("debugging here")
      console.log(jsonData)
      if (jsonData.status === 200) {
        if (!jsonData.data || jsonData.data.length === 0) {
          setClassData(null);
        } else {
            
          setClassData(jsonData.data[0]);


          const classInfo = jsonData.data[0];
          const stats: AttendanceStats = {
            presentCount: classInfo.absensiStats?.totalHadir || 0,
            sickCount: classInfo.absensiStats?.totalSakit || 0,
            permissionCount: classInfo.absensiStats?.totalIzin || 0,
            absentCount: classInfo.absensiStats?.totalAlfa || 0,
            notYetSubmittedCount: 2 // This might need to be calculated based on total students - total attendance
          };
          setAttendanceStats(stats);
        }
      } else if (jsonData.status === 400 || jsonData.status === 404 || jsonData.status === 500) {


        setClassData(null);

        if (jsonData.message) {
          customToast.warning("Tidak ada kelas", jsonData.message);
        }
      } else {
        throw new Error(jsonData.errorMessage || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to fetch data");
      setClassData(null);

      customToast.error("Gagal memuat data", "Terjadi kesalahan saat mengambil data kelas");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    if (!classData) return;
    setNoAttendanceDataFound(false);
    setAttendanceDates([]); // <-- Reset data juga diawal
    setStudents([]);    // <-- Reset data juga diawal


    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

      if (!token) {
        console.error("No authentication token found");
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/absensi/kelas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token} Id ${classData.id}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Coba parse JSON, fallback jika gagal
        const errorMessage = errorData?.message || errorData?.errorMessage || `Gagal mengambil data: ${response.status}`;

        // If Not Found
        if (response.status === 404) {
          setNoAttendanceDataFound(true);
        } else {
          customToast.error("Gagal", errorMessage);
        }
      }

      // Cek status di dalam JSON (jika backend mengirimkannya)
      if (data.status && data.status !== 200) {
        // Jika backend mengembalikan 200 OK tapi ada status error di JSON
        if (data.status === 404 && data.message?.toLowerCase().includes("belum ada catatan absensi")) {
          setNoAttendanceDataFound(true); // Tangani juga di sini jika perlu
        } else {
          throw new Error(data.message || "Gagal memproses data absensi");
        }
      } else if (!data.status && (!data.dates || !data.students)) {
        // Jika tidak ada status di JSON tapi data dates/students kosong
        console.warn("API mengembalikan 200 OK tapi data absensi kosong.");
        setNoAttendanceDataFound(true);
      }

      // Set data jika ada dan tidak ada error
      if (!noAttendanceDataFound) {
        setAttendanceDates(data.dates || []);
        const formattedStudents: StudentAttendance[] = Object.entries(data.students || {}).map(([name, studentData]: [string, any]) => ({
          id: studentData.id,
          name: name,
          attendanceByDate: studentData.dates || {}
        }));
        setStudents(formattedStudents);

        // Hanya tampilkan toast sukses jika memang ada data yang dimuat
        if ((data.dates && data.dates.length > 0) || (data.students && Object.keys(data.students).length > 0)) {
          customToast.success(
            "Berhasil",
            "Data kehadiran berhasil dimuat"
          );
        } else {
          // Kasus 200 OK tapi data benar-benar kosong
          setNoAttendanceDataFound(true);
        }
      }
      // --- Akhir Proses jika response OK ---

    } catch (error: any) {
      // Hanya tampilkan toast error jika BUKAN kasus 'noAttendanceDataFound'
      if (!noAttendanceDataFound) {
        console.error("Error fetching attendance data:", error);
        customToast.error(
          "Gagal",
          error.message || "Tidak dapat memuat data kehadiran"
        );
      }
      // Reset state jika ada error lain
      setAttendanceDates([]);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (classData) {
      fetchAttendanceData();
    }
  }, [classData]);

  // useEffect timer to also close the modal
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;

    if (expiryTime > 0 && attendanceCode) { // Condition based on expiryTime and if code exists
      timer = setInterval(() => {
        setExpiryTime(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            // Code expired
            // setIsCodeGenerated(false); // No longer needed
            setAttendanceCode("");    // Clear the code state
            setIsModalOpen(false); // <-- Close the modal
            console.log("Toast Kadaluarsa dipicu!")
            customToast.warning("Kode Kadaluarsa", "Kode presensi sudah tidak berlaku.");
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }

    // Cleanup function remains the same
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [expiryTime, attendanceCode]); // Depend on expiryTime and attendanceCode

  const isCellSelected = (studentId: number, date: string): boolean => {
    return selectedCells.some(cell => cell.studentId === studentId && cell.date === date);
  };

  const toggleCellSelection = (studentId: number, date: string) => {
    if (isCellSelected(studentId, date)) {
      setSelectedCells(selectedCells.filter(cell =>
        !(cell.studentId === studentId && cell.date === date)
      ));
    } else {

      setSelectedCells([...selectedCells, { studentId, date }]);
    }
  };


  const toggleDateSelection = (date: string) => {

    const studentIds = students.map(student => student.id);


    const allSelected = studentIds.every(studentId => isCellSelected(studentId, date));

    if (allSelected) {

      setSelectedCells(selectedCells.filter(cell => cell.date !== date));
    } else {

      const newCells = studentIds
        .filter(studentId => !isCellSelected(studentId, date))
        .map(studentId => ({ studentId, date }));

      setSelectedCells([...selectedCells, ...newCells]);
    }
  };


  const clearSelections = () => {
    setSelectedCells([]);
  };


  const updateAttendanceStatus = async (studentId: number, date: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa', updateAll: boolean = false) => {
    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");


      const cellsToUpdate = updateAll && selectedCells.length > 0
        ? selectedCells
        : [{ studentId, date }];


      let successCount = 0;
      let failureCount = 0;


      for (const cell of cellsToUpdate) {
        try {

          const response = await fetch(`/api/absensi/update`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken} Id ${cell.studentId} date ${cell.date} status ${status}`,
            },
            body: JSON.stringify({
              id: cell.studentId,
              status: status,
              absensiDate: cell.date,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error updating cell ${cell.studentId}/${cell.date}:`, errorData);
            failureCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error updating cell ${cell.studentId}/${cell.date}:`, error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        setStudents(students.map(student => {
          const updatedAttendance = { ...student.attendanceByDate };

          cellsToUpdate.forEach(cell => {
            if (cell.studentId === student.id) {
              updatedAttendance[cell.date] = status;
            }
          });

          return {
            ...student,
            attendanceByDate: updatedAttendance
          };
        }));


        if (cellsToUpdate.length > 1) {
          customToast.success(
            "Berhasil",
            `${successCount} status kehadiran berhasil diubah menjadi ${status}`
          );
        } else {
          customToast.success(
            "Berhasil",
            `Status kehadiran berhasil diubah menjadi ${status}`
          );
        }


        if (updateAll && selectedCells.length > 0) {
          setSelectedCells([]);
        }
      }


      if (failureCount > 0) {
        customToast.error(
          "Gagal",
          `${failureCount} status kehadiran gagal diubah`
        );
      }


      setContextMenu(null);
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      customToast.error(
        "Gagal",
        error.message || "Gagal mengubah status kehadiran"
      );
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getAttendanceCell = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null, date: string, studentId: number) => {
    const isSelected = isCellSelected(studentId, date);
    const baseClasses = "flex items-center justify-center w-10 h-10 rounded-md text-sm cursor-pointer p-2";
  
    const displayDate = new Date(date).getDate().toString().padStart(2, '0');
  
    if (!status) {
      return (
        <div
          className={`${baseClasses} border border-[#041765] hover:bg-gray-50 ${
            isSelected ? "box-shadow-[0_0_0_2px_#3b82f6]" : ""
          }`}
          style={isSelected ? { boxShadow: '0 0 0 3px #3b82f6, 0 0 0 5px white' } : undefined}
          onClick={(e) => {
            e.stopPropagation();
            toggleCellSelection(studentId, date);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              studentId,
              date
            });
          }}
        >
          {displayDate}
        </div>
      );
    }
  
    let bgColor = "";
    let icon = null;
  
    switch (status) {
      case 'Hadir':
        bgColor = "bg-[#22C55E] text-white";
        icon = <Check size={14} />;
        break;
      case 'Sakit':
        bgColor = "bg-[#9B51E0] text-white";
        icon = <HeartPulse size={14} />;
        break;
      case 'Izin':
        bgColor = "bg-[#FFC804] text-[#041765]";
        icon = <Clock size={14} />;
        break;
      case 'Alfa':
        bgColor = "bg-[#EA2F32] text-white";
        icon = <X size={14} />;
        break;
    }
  
    return (
      <div
        className={`${baseClasses} ${bgColor} flex items-center justify-center`}
        style={isSelected ? { boxShadow: '0 0 0 3px #3b82f6, 0 0 0 5px white' } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          toggleCellSelection(studentId, date);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            studentId,
            date
          });
        }}
      >
        {icon && <span className="flex items-center justify-center">{icon}</span>}
      </div>
    );
  };
  

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const displayDate = date.getDate().toString().padStart(2, '0');
    const isAllSelected = students.length > 0 && students.every(student =>
      selectedCells.some(cell => cell.studentId === student.id && cell.date === dateString)
    );

    return (
      <div className="flex flex-col items-center gap-1 w-full h-full">
        <div className="text-xs font-medium text-white bg-[#586FC0] py-0.5 px-1 rounded-md w-full text-center">{displayDate}</div>
        <MousePointerClick
          size={16}
          className="text-gray-400 transition-colors"
        />
      </div>
    );
  };

  // Helper to get available months from attendanceDates
  const getAvailableMonths = () => {
    const months = new Set<number>();
    attendanceDates.forEach(dateStr => {
      const date = new Date(dateStr);
      months.add(date.getMonth() + 1); // getMonth is 0-based
    });
    return Array.from(months).sort((a, b) => a - b);
  };

  // Filtered dates for the selected month
  const filteredDates = attendanceDates.filter(dateStr => {
    if (!selectedMonth) return true;
    const date = new Date(dateStr);
    return date.getMonth() + 1 === selectedMonth;
  });

  useEffect(() => {
    // Set default selectedMonth to the first available month if not set
    if (attendanceDates.length > 0 && selectedMonth === null) {
      const firstMonth = new Date(attendanceDates[0]).getMonth() + 1;
      setSelectedMonth(firstMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceDates]);

  // --- Dashboard Data Presensi Siswa helpers ---
  const getMonthOptionsDash = () => [
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ];

  const fetchYearlyDataDash = async () => {
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (!token || !classData?.id) return;
      const kelasId = classData.id.toString();

      const response = await fetch(`/api/absensi/yearly-summary?kelasId=${kelasId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setYearlyDataDash(data.data);

        // Set initial month and week data
        if (data.data.monthly_summaries.length > 0) {
          const currentMonth = new Date().getMonth();
          const currentMonthData = data.data.monthly_summaries.find(
            (summary: any) => summary.month_info.monthNumber === currentMonth + 1,
          );

          if (currentMonthData) {
            setSelectedMonthOverviewDash(currentMonth.toString());

            if (currentMonthData.weekly_summaries.length > 0) {
              const today = new Date();
              const weekIndex = currentMonthData.weekly_summaries.findIndex((week: any) => {
                const start = new Date(week.week_info.startDate);
                const end = new Date(week.week_info.endDate);
                return today >= start && today <= end;
              });
              const defaultWeekIndex = weekIndex !== -1 ? weekIndex : 0;
              const defaultWeek = currentMonthData.weekly_summaries[defaultWeekIndex];

              const weeklyDataObj = {
                ...defaultWeek,
                kelas_info: data.data.kelas_info,
                week_info: {
                  ...defaultWeek.week_info,
                  displayMonth: currentMonthData.month_info.monthName,
                },
              };

              setActiveWeeklyDataDash(weeklyDataObj);
              setOverviewWeeklyDataDash(weeklyDataObj);

              const formattedWeeks = currentMonthData.weekly_summaries.map((week: any, index: number) => ({
                value: index.toString(),
                label: `Minggu ${index + 1}`,
              }));

              setOverviewAvailableWeeksDash(formattedWeeks);
              setSelectedWeekOverviewDash(defaultWeekIndex.toString());

              fetchMonthlyAnalysisDash(currentMonth + 1);
            }
          }
        }
      }
    } catch (error) {
      setYearlyDataDash(null);
    }
  };

  const handleMonthChangeOverviewDash = (value: string) => {
    setSelectedMonthOverviewDash(value);
    if (yearlyDataDash) {
      const monthData = yearlyDataDash.monthly_summaries.find(
        (summary) => summary.month_info.monthNumber === Number.parseInt(value) + 1,
      );
      if (monthData && monthData.weekly_summaries.length > 0) {
        setOverviewAvailableWeeksDash(
          monthData.weekly_summaries.map((week: any, index: number) => ({
            value: index.toString(),
            label: `Minggu ${index + 1}`,
          })),
        );
        setSelectedWeekOverviewDash("0");
        setOverviewWeeklyDataDash({
          ...monthData.weekly_summaries[0],
          kelas_info: yearlyDataDash.kelas_info,
          week_info: {
            ...monthData.weekly_summaries[0].week_info,
            displayMonth: monthData.month_info.monthName,
          },
        });
        setActiveWeeklyDataDash({
          ...monthData.weekly_summaries[0],
          kelas_info: yearlyDataDash.kelas_info,
          week_info: {
            ...monthData.weekly_summaries[0].week_info,
            displayMonth: monthData.month_info.monthName,
          },
        });
      } else {
        setOverviewAvailableWeeksDash([]);
        setOverviewWeeklyDataDash(null);
        setActiveWeeklyDataDash(null);
      }
    }
  };

  const handleWeekChangeOverviewDash = (value: string) => {
    setSelectedWeekOverviewDash(value);
    if (yearlyDataDash) {
      const monthData = yearlyDataDash.monthly_summaries.find(
        (summary) => summary.month_info.monthNumber === Number.parseInt(selectedMonthOverviewDash) + 1,
      );
      if (monthData && monthData.weekly_summaries[Number.parseInt(value)]) {
        const selectedWeekData = monthData.weekly_summaries[Number.parseInt(value)];
        const weekData = {
          ...selectedWeekData,
          kelas_info: yearlyDataDash.kelas_info,
          week_info: {
            ...selectedWeekData.week_info,
            displayMonth: monthData.month_info.monthName,
          },
        };
        setOverviewWeeklyDataDash(weekData);
        setActiveWeeklyDataDash(weekData);
      }
    }
  };

  const fetchMonthlyAnalysisDash = async (month: number) => {
    setIsLoadingMonthlyDash(true);
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      const kelasId = classData?.id;
      if (!token || !kelasId) return;

      const response = await fetch(`/api/absensi/monthly-analysis?month=${month}`, {
        headers: {
          Authorization: `Bearer ${token} kelasId ${kelasId}`,
        },
      });

      if (!response.ok) {
        setMonthlyAnalysisDash(null);
        return;
      }

      const data = await response.json();
      setMonthlyAnalysisDash(data.data);
    } catch (e) {
      setMonthlyAnalysisDash(null);
    } finally {
      setIsLoadingMonthlyDash(false);
    }
  };

  const handleMonthChangeAnalysisDash = (value: string) => {
    setSelectedMonthAnalysisDash(value);
    fetchMonthlyAnalysisDash(Number(value) + 1);
  };

  const fetchMonthlyDetailDataDash = async () => {
    if (!classData) return;
    setIsLoadingMonthlyDetailDash(true);
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      const kelasId = classData.id;
      if (!token || !kelasId) return;

      const response = await fetch(`/api/absensi/monthly-detail?month=${selectedMonthDetailDash}`, {
        headers: {
          Authorization: `Bearer ${token} kelasId ${kelasId}`,
        },
      });

      if (!response.ok) {
        setMonthlyDetailDataDash(null);
        return;
      }

      const data = await response.json();
      setMonthlyDetailDataDash(data.data);
    } catch (error) {
      setMonthlyDetailDataDash(null);
    } finally {
      setIsLoadingMonthlyDetailDash(false);
    }
  };

  useEffect(() => {
    if (classData) {
      fetchYearlyDataDash();
      fetchMonthlyDetailDataDash();
      fetchMonthlyAnalysisDash(Number(selectedMonthAnalysisDash) + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  useEffect(() => {
    if (classData) {
      fetchMonthlyDetailDataDash();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthDetailDash, classData]);

  // --- Dashboard Data Presensi Siswa: filter, pagination, etc ---
  const filteredStudentsDash = useMemo(() => {
    if (!monthlyDetailDataDash) return [];
    return monthlyDetailDataDash.students_details.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQueryDash.toLowerCase()) ||
        student.nisn.toLowerCase().includes(searchQueryDash.toLowerCase()),
    );
  }, [monthlyDetailDataDash, searchQueryDash]);

  const totalPagesDash = Math.ceil(filteredStudentsDash.length / itemsPerPageDash);
  const paginatedStudentsDash = useMemo(() => {
    const startIndex = (currentPageDash - 1) * itemsPerPageDash;
    return filteredStudentsDash.slice(startIndex, startIndex + itemsPerPageDash);
  }, [filteredStudentsDash, currentPageDash, itemsPerPageDash]);

  const viewStudentDetailDash = (student: StudentDetailDash) => {
    setSelectedStudentDash(student);
    setIsDetailModalOpenDash(true);
  };

  const formatRangeDash = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const startStr = `${startDate.getDate()} ${monthNames[startDate.getMonth()]}`;
    const endStr = `${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    return `${startStr} - ${endStr}`;
  };

  const getHighestAttendanceDayDash = () => {
    if (!activeWeeklyDataDash || !activeWeeklyDataDash.daily_details.length) return null;
    const highestDay = activeWeeklyDataDash.daily_details.reduce((prev, current) =>
      prev.attendance_percentage > current.attendance_percentage ? prev : current,
    );
    return `${highestDay.day_name} (${highestDay.attendance_percentage}%)`;
  };

  const isStudentDetailOpenDash = (studentId: number) => {
    return selectedStudentDash?.id === studentId && isDetailModalOpenDash;
  };

  // --- Replace Tabs section with new tabs (add Dashboard Data Presensi Siswa tab) ---
  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {/* Class Header */}
          <h2 className="text-2xl font-normal text-[#041765]">{classData?.namaKelas}</h2>
          <p className="text-sm text-[#88888C]">TA {classData?.tahunAjaran}</p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1 w-full sm:w-auto">
            {/* ... TabsTrigger ... */}
            <TabsTrigger value="todo" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm transition-all flex-1 sm:flex-initial">
              Presensi Hari Ini
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm transition-all flex-1 sm:flex-initial">
              Rekap Kehadiran
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm transition-all flex-1 sm:flex-initial">
              Dashboard Data Presensi Siswa
            </TabsTrigger>
          </TabsList>

          {/* Tab Content: Presensi Hari Ini */}
          <TabsContent value="todo" className="mt-6">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-0">
                {/* Header Tetap Sama */}
                <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-gray-200">
                  <div className="bg-blue-100 p-3 rounded-full"><CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /></div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">Presensi Hari Ini</h3>
                </div>

                {/* Card Presensi */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col items-center w-full md:w-1/2 lg:w-1/3 xl:w-2/5"> {/* Anda bisa atur lebar kolom ini */}
                    {/* Card internal untuk tombol presensi */}
                    <div className="border border-gray-200 rounded-lg p-5 sm:p-6 flex flex-col items-center gap-3 w-full bg-gray-50">
                      {/* Tanggal */}
                      <p className="text-gray-800 text-base sm:text-lg font-medium mb-2 text-center">
                        {getFormattedTodayDate()}
                      </p>

                      {/* Dialog Component (tidak berubah) */}
                      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={generateAttendanceCodeAndShowModal}
                            variant="default"
                            className="w-full"
                          >
                            {attendanceCode && expiryTime > 0 ? "Lihat Kode Presensi" : "Buat Kode Presensi"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-center text-xl">Kode Presensi</DialogTitle>
                            <DialogDescription className="text-center">
                              Bagikan kode ini kepada siswa untuk presensi hari ini.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4 py-4">
                            {attendanceCode && expiryTime > 0 ? (
                              <>
                                <div className="w-full border-2 border-blue-300 bg-blue-50 rounded-lg p-4 flex justify-center shadow-inner">
                                  <p className="text-blue-700 text-3xl sm:text-4xl font-mono tracking-widest font-bold">
                                    {attendanceCode}
                                  </p>
                                </div>
                                <p className="text-sm text-red-600 font-medium">
                                  *Kode akan kadaluarsa dalam {expiryTime} detik
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-500">Membuat kode...</p>
                            )}
                          </div>
                          <DialogFooter className="sm:justify-center">
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                Tutup
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                {/* StAtistik Kehadiran */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {/* Jumlah Murid */}
                    <div className="flex flex-col gap-1"> {/* Kurangi gap jika perlu */}
                      <h4 className="text-gray-700 text-base font-semibold">Jumlah Murid</h4> {/* Sesuaikan style */}
                      <div> {/* Bungkus paragraf jika perlu styling tambahan */}
                        <p className="text-sm"> {/* Sesuaikan style */}
                          <span className="text-gray-900 font-medium">{classData?.totalSiswa}</span>
                          <span className="text-gray-600"> Peserta Didik</span>
                        </p>
                      </div>
                    </div>
                    {/* Kehadiran Hari Ini */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-gray-700 text-base font-semibold">Kehadiran Hari Ini</h4> {/* Sesuaikan style */}
                        {(classData?.totalSiswa ?? 0) > 0 && ( // Hanya tampilkan jika ada siswa
                          <div className="bg-blue-50 rounded-lg px-2 py-0.5"> {/* Sesuaikan style */}
                            <span className="text-blue-700 text-xs">Total {classData?.totalSiswa ?? 0} Siswa</span>
                          </div>
                        )}
                      </div>
                      {/* Detail Kehadiran */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"> {/* Sesuaikan gap & text size */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData?.absensiStats?.totalHadir || 0}</span>
                          <span className="text-gray-600"> Hadir</span>
                        </p>
                        {/* Titik pemisah bisa dihilangkan jika menggunakan gap */}
                        {/* <div className="w-1 h-1 bg-gray-300 rounded-full"></div> */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData?.absensiStats?.totalSakit || 0}</span>
                          <span className="text-gray-600"> Sakit</span>
                        </p>
                        {/* <div className="w-1 h-1 bg-gray-300 rounded-full"></div> */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData?.absensiStats?.totalIzin || 0}</span>
                          <span className="text-gray-600"> Izin</span>
                        </p>
                        {/* <div className="w-1 h-1 bg-gray-300 rounded-full"></div> */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData?.absensiStats?.totalAlfa || 0}</span>
                          <span className="text-gray-600"> Alfa</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content: Rekap Kehadiran */}
          <TabsContent value="attendance" className="mt-6">
            <div className="flex flex-col gap-6">
              <Card className="border-[#E1E2E8]">
                <CardContent className="p-6">
                  {/* === AWAL KONDISIONAL === */}
                  {/* Month Filter Dropdown */}
                  <div className="mb-4 flex items-center gap-2">
                    <label htmlFor="month-select" className="text-sm font-medium">Filter Bulan:</label>
                    <select
                      id="month-select"
                      className="border rounded px-2 py-1"
                      value={selectedMonth || ""}
                      onChange={e => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      {getAvailableMonths().map(month => (
                        <option key={month} value={month}>
                          {getMonthName(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {noAttendanceDataFound ? (
                    // Tampilkan pesan ini jika tidak ada data absensi
                    <div className="flex items-center justify-center h-40 text-gray-500">
                      Belum ada data absensi untuk kelas ini.
                    </div>
                  ) : (
                    // Jika ada data (atau belum dicek/error lain), tampilkan konten tabel
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        {/* Legenda Warna */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#22C55E] rounded"></div>
                            <span className="text-sm">Hadir</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#FFC804] rounded"></div>
                            <span className="text-sm">Izin</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#9B51E0] rounded flex items-center justify-center">
                            </div>
                            <span className="text-sm">Sakit</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#EA2F32] rounded"></div>
                            <span className="text-sm">Alfa</span>
                          </div>
                        </div>

                        {/* Tabel Absensi */}
                        <div className="border border-[#E6E9F4] rounded-lg">
                          {/* Header Tabel */}
                          <div className="flex border-b border-[#041765] bg-[#F7F8FF]">
                            <div className="w-40 p-3 font-medium text-[#041765] border-r border-[#E6E9F4]">
                              Nama
                            </div>
                            <div className="flex flex-col">
                              {filteredDates.length > 0 && (
                                <div className="flex border-b border-[#E6E9F4]">
                                  <div className="p-2 font-medium text-[#041765] text-center w-full">
                                    {selectedMonth
                                      ? `${getMonthName(selectedMonth)} ${new Date(filteredDates[0]).getFullYear()}`
                                      : filteredDates.length > 0
                                        ? new Date(filteredDates[0]).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                                        : ''}
                                  </div>
                                </div>
                              )}
                              <div className="flex">
                                {filteredDates.map((date, i) => (
                                  <div key={i} className="flex-shrink-0 p-1">
                                    <div
                                      className={`flex items-center justify-center w-10 h-10 rounded-md text-sm border-0 cursor-pointer hover:bg-gray-100`}
                                      style={
                                        students.length > 0 && students.every(student =>
                                          selectedCells.some(cell => cell.studentId === student.id && cell.date === date)
                                        ) ? { boxShadow: '0 0 0 3px #3b82f6, 0 0 0 5px white' } : undefined
                                      }
                                      onClick={() => toggleDateSelection(date)}
                                    >
                                      {formatDateHeader(date)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Baris Siswa */}
                          {students.map((student) => (
                            <div key={student.id} className="flex border-b border-[#E6E9F4]">
                              <div className="w-40 p-3 border-r border-[#E6E9F4] truncate">
                                {student.name}
                              </div>
                              <div className="flex gap-2 p-1">
                                {filteredDates.map((date, i) => (
                                  <div key={i} className="flex-shrink-0">
                                    {getAttendanceCell(student.attendanceByDate[date], date, student.id)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {/* Footer Tabel (Kehadiran Harian) */}
                          <div className="flex border-b border-[#E6E9F4]">
                            <div className="w-40 p-3 font-medium text-[#041765] border-r border-[#E6E9F4]">
                              Kehadiran Harian
                            </div>
                            <div className="flex gap-2 p-1">
                              {filteredDates.map((date, i) => {
                                let present = 0, absent = 0, sick = 0, permission = 0;
                                students.forEach(student => {
                                  const status = student.attendanceByDate[date];
                                  if (status === 'Hadir') present++;
                                  else if (status === 'Alfa') absent++;
                                  else if (status === 'Sakit') sick++;
                                  else if (status === 'Izin') permission++;
                                });
                                const total = students.length;
                                const attendanceText = total > 0 ? `${present}/${total}` : '-';
                                return (
                                  <div key={i} className="flex-shrink-0">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-md text-sm">
                                      {attendanceText}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Info Seleksi & Tombol */}
                        <div className="flex justify-between mt-4">
                          <p className="text-sm text-[#041765]">
                            {selectedCells.length} sel dipilih dari {(filteredDates?.length || 0) * (students?.length || 0)} total
                          </p>
                          <div className="flex gap-2">
                            {selectedCells.length > 0 && (
                              <button
                                className="px-4 py-2 text-sm border border-[#E6E9F4] rounded-md hover:bg-[#F7F8FF] text-red-500"
                                onClick={clearSelections}
                              >
                                Hapus Seleksi
                              </button>
                            )}
                            <button
                              className="px-4 py-2 text-sm border border-[#E6E9F4] rounded-md hover:bg-[#F7F8FF]"
                              onClick={fetchAttendanceData}
                            >
                              Refresh
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* === AKHIR KONDISIONAL === */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TabsContent: Dashboard Data Presensi Siswa */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div style={{ width: "min(70%, 562px)", flexShrink: 0 }} className="overflow-hidden">
                  <Card className="border-[#E1E2E8] h-full">
                    <CardContent className="p-6">
                      {/* Filters for Overview */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-[#041765]">Overview Kehadiran Siswa per Minggu:</p>
                        </div>
                        <div className="flex gap-2">
                          <Select value={selectedMonthOverviewDash} onValueChange={handleMonthChangeOverviewDash}>
                            <SelectTrigger className="w-[90px] justify-center">
                              <SelectValue className="text-center" placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                              {getMonthOptionsDash().map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={selectedWeekOverviewDash} onValueChange={handleWeekChangeOverviewDash}>
                            <SelectTrigger className="w-[100px] justify-center">
                              <SelectValue className="text-center" placeholder="Pilih Minggu" />
                            </SelectTrigger>
                            <SelectContent>
                              {overviewAvailableWeeksDash.map((week) => (
                                <SelectItem key={week.value} value={week.value}>
                                  Minggu {Number.parseInt(week.value) + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Date range display */}
                      {overviewWeeklyDataDash && (
                        <div className="mb-4">
                          <p className="text-lg font-medium text-[#041765]">
                            {overviewWeeklyDataDash.week_info.startDate &&
                              overviewWeeklyDataDash.week_info.endDate &&
                              formatRangeDash(overviewWeeklyDataDash.week_info.startDate, overviewWeeklyDataDash.week_info.endDate)}
                          </p>
                        </div>
                      )}
                      {/* Conditional content */}
                      {activeWeeklyDataDash && activeWeeklyDataDash.daily_details.length > 0 ? (
                        <>
                          {/* Rata-Rata Kehadiran Siswa */}
                          <h4 className="text-base font-medium text-gray-800 mb-4">Rata-Rata Kehadiran Siswa</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                              <span className="text-[#22C55E] text-base font-medium mb-1">Hadir</span>
                              <span className="text-2xl font-bold">{activeWeeklyDataDash.weekly_averages.Hadir}%</span>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                              <span className="text-[#FFC804] text-base font-medium mb-1">Izin</span>
                              <span className="text-2xl font-bold">{activeWeeklyDataDash.weekly_averages.Izin}%</span>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                              <span className="text-[#9B51E0] text-base font-medium mb-1">Sakit</span>
                              <span className="text-2xl font-bold">{activeWeeklyDataDash.weekly_averages.Sakit}%</span>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                              <span className="text-[#EA2F32] text-base font-medium mb-1">Alfa</span>
                              <span className="text-2xl font-bold">{activeWeeklyDataDash.weekly_averages.Alfa}%</span>
                            </div>
                          </div>
                          {/* Persentase Kehadiran Terbanyak */}
                          <div className="mb-8">
                            <h4 className="text-base font-medium text-gray-800 mb-4">
                              Persentase Kehadiran Terbanyak - {getHighestAttendanceDayDash()}
                            </h4>
                            <div className="-mx-6" style={{ height: "320px" }}>
                              <ChartContainer
                                className="w-full"
                                config={{
                                  hadir: { color: "#041765" },
                                  sakit: { color: "#9B51E0" },
                                  izin: { color: "#FFC804" },
                                  alfa: { color: "#EA2F32" },
                                }}
                              >
                                <ResponsiveContainer width="150%" height="100%">
                                  <BarChart
                                    data={activeWeeklyDataDash?.daily_details.map((day) => ({
                                      name: day.day_name,
                                      percentage: day.attendance_percentage,
                                      hadir: day.counts?.Hadir || 0,
                                      sakit: day.counts?.Sakit || 0,
                                      izin: day.counts?.Izin || 0,
                                      alfa: day.counts?.Alfa || 0,
                                    }))}
                                    margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis
                                      domain={[0, 100]}
                                      tickFormatter={(value) => `${value}%`}
                                      ticks={[0, 20, 40, 60, 80, 100]}
                                    />
                                    <ChartTooltip
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-white rounded-md shadow-lg p-2 border border-gray-100">
                                              <div className="text-center font-medium mb-1 text-xs text-[#041765]">
                                                {data.name} ({data.percentage}%)
                                              </div>
                                              <div className="space-y-0.5 text-xs">
                                                <div className="flex justify-between">
                                                  <span>Hadir:</span>
                                                  <span className="font-medium">{data.hadir} Siswa</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Sakit:</span>
                                                  <span className="font-medium">{data.sakit} Siswa</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Izin:</span>
                                                  <span className="font-medium">{data.izin} Siswa</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Alfa:</span>
                                                  <span className="font-medium">{data.alfa} Siswa</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Bar
                                      dataKey="percentage"
                                      fill="var(--color-hadir)"
                                      radius={[4, 4, 0, 0]}
                                      barSize={60}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              </ChartContainer>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-40">
                          <p className="text-gray-500">Tidak ada data kehadiran mingguan yang tersedia.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                {/* Analysis Section */}
                <div style={{ width: "min(70%, 900px)" }} className="overflow-x-auto">
                  <Card className="border-[#E1E2E8] h-full">
                    <CardContent className="p-6">
                      {/* Filter for Analysis */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg text-[#041765]">Analisis Kehadiran Siswa</h3>
                        <Select value={selectedMonthAnalysisDash} onValueChange={handleMonthChangeAnalysisDash}>
                          <SelectTrigger className="w-[120px] justify-center">
                            <SelectValue className="text-center" placeholder="Pilih Bulan" />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonthOptionsDash().map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isLoadingMonthlyDash ? (
                        <div className="py-10 text-center text-gray-500">Loading...</div>
                      ) : monthlyAnalysisDash ? (
                        <>
                          <div className="mb-8">
                            <h4 className="text-base font-medium text-gray-800 mb-4">
                              Siswa dengan Persentase Kehadiran Tertinggi
                            </h4>
                            <div
                              className="overflow-x-auto overflow-y-hidden border border-gray-100 rounded-md"
                              style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "#CBD5E1 #F1F5F9",
                              }}
                            >
                              <table className="w-full min-w-[min(70%,800px)] text-sm">
                                <thead className="bg-white">
                                  <tr className="border-b border-gray-200">
                                    <th className="py-2 px-1 text-left font-medium text-gray-600">Nama Siswa</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Persentase</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Hadir</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Sakit</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Izin</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Alfa</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthlyAnalysisDash.top_students.map((student: any) => (
                                    <tr key={student.id} className="border-b border-gray-100">
                                      <td className="py-2 px-1">{student.name}</td>
                                      <td className="py-2 px-1 text-center font-medium text-green-600">
                                        {student.percentage}%
                                      </td>
                                      <td className="py-2 px-2 text-center">{student.counts.Hadir}</td>
                                      <td className="py-2 px-2 text-center">{student.counts.Sakit}</td>
                                      <td className="py-2 px-2 text-center">{student.counts.Izin}</td>
                                      <td className="py-2 px-2 text-center">{student.counts.Alfa}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-gray-800 mb-4">
                              Siswa dengan Persentase Kehadiran Terendah
                            </h4>
                            <div
                              className="overflow-x-auto overflow-y-hidden border border-gray-100 rounded-md"
                              style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "#CBD5E1 #F1F5F9",
                              }}
                            >
                              <table className="w-full min-w-[min(70%,800px)] text-sm">
                                <thead className="bg-white">
                                  <tr className="border-b border-gray-200">
                                    <th className="py-2 px-1 text-left font-medium text-gray-600">Nama Siswa</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Persentase</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Hadir</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Sakit</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Izin</th>
                                    <th className="py-2 px-2 text-center font-medium text-gray-600">Alfa</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthlyAnalysisDash.bottom_students.map((student: any) => (
                                    <tr key={student.id} className="border-b border-gray-100">
                                      <td className="py-2 px-1">{student.name}</td>
                                      <td className="py-2 px-1 text-center font-medium text-red-600">
                                        {student.percentage}%
                                      </td>
                                      <td className="py-2 px-2 text-center">{student.counts.Hadir}</td>
                                      <td className="py-2 px-2 text-center">{student.counts.Sakit}</td>
                                      <td className="py-2 px-2 text-center">{student.counts.Izin}</td>
                                      <td className="py-2 px-2 text-center">{student.counts.Alfa}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-10 text-center text-gray-500">Tidak ada data analisis bulanan.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Detail Kehadiran Siswa Section */}
              <Card className="border-[#E1E2E8]" style={{ minWidth: "70%" }}>
                <CardContent className="p-6">
                  {/* Header + Controls as a column */}
                  <div className="flex flex-col mb-6">
                    {/* Title */}
                    <h3 className="font-semibold text-lg text-[#041765]">Detail Kehadiran Siswa</h3>
                    {/* Search + Filter now below header */}
                    <div className="flex items-center gap-4 mt-4 ">
                      <div className="relative w-64">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Cari nama siswa..."
                          className="pl-8"
                          value={searchQueryDash}
                          onChange={(e) => setSearchQueryDash(e.target.value)}
                        />
                      </div>
                      <Select value={selectedMonthAnalysisDash} onValueChange={handleMonthChangeAnalysisDash}>
                        <SelectTrigger className="w-[120px] justify-center">
                          <SelectValue className="text-center" placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          {getMonthOptionsDash().map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {isLoadingMonthlyDetailDash ? (
                    <div className="py-10 text-center text-gray-500">Loading...</div>
                  ) : monthlyDetailDataDash ? (
                    <>
                      {/* Scrollable table wrapper with always-on horizontal scroll */}
                      <div
                        className="max-w-full overflow-x-auto overflow-y-hidden border border-gray-100 rounded-md scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#CBD5E1 #F1F5F9",
                        }}
                      >
                        <table className="w-full min-w-[min(70%,800px)] text-sm">
                          <thead className="bg-white sticky top-0">
                            <tr className="border-b border-gray-200">
                              <th className="py-2 px-1 text-left font-medium text-gray-600 w-[30px]">No</th>
                              <th className="py-2 px-2 text-left font-medium text-gray-600">Nama Siswa</th>
                              <th className="py-2 px-2 text-left font-medium text-gray-600">NISN</th>
                              <th className="py-2 px-2 text-center font-medium text-gray-600">Persentase Kehadiran</th>
                              <th className="py-2 px-2 text-center font-medium text-gray-600 w-[50px]">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedStudentsDash.length > 0 ? (
                              paginatedStudentsDash.map((student, index) => (
                                <tr key={student.id} className="border-b border-gray-100">
                                  <td className="py-2 px-1">{(currentPageDash - 1) * itemsPerPageDash + index + 1}</td>
                                  <td className="py-2 px-2">{student.name}</td>
                                  <td className="py-2 px-2">{student.nisn}</td>
                                  <td className="py-2 px-2 text-center">
                                    <span
                                      className={`font-medium ${student.monthly_percentage >= 80
                                        ? "text-green-600"
                                        : student.monthly_percentage >= 60
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                        }`}
                                    >
                                      {student.monthly_percentage}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <Button variant="outline" size="sm" onClick={() => viewStudentDetailDash(student)}>
                                      Lihat
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-gray-500">
                                  {searchQueryDash
                                    ? "Tidak ada siswa yang sesuai dengan pencarian"
                                    : "Tidak ada data siswa"}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination */}
                      {totalPagesDash > 1 && (
                        <div className="mt-4 flex justify-end">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => setCurrentPageDash((prev) => Math.max(prev - 1, 1))}
                                  className={currentPageDash === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                              {Array.from({ length: totalPagesDash }, (_, i) => i + 1)
                                .filter(
                                  (page) =>
                                    page === 1 ||
                                    page === totalPagesDash ||
                                    (page >= currentPageDash - 1 && page <= currentPageDash + 1),
                                )
                                .map((page, i, array) => {
                                  if (i > 0 && array[i - 1] !== page - 1) {
                                    return (
                                      <React.Fragment key={`ellipsis-${page}`}>
                                        <PaginationItem>
                                          <PaginationEllipsis />
                                        </PaginationItem>
                                        <PaginationItem>
                                          <PaginationLink
                                            isActive={page === currentPageDash}
                                            onClick={() => setCurrentPageDash(page)}
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </React.Fragment>
                                    );
                                  }
                                  return (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        isActive={page === currentPageDash}
                                        onClick={() => setCurrentPageDash(page)}
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                })}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => setCurrentPageDash((prev) => Math.min(prev + 1, totalPagesDash))}
                                  className={
                                    currentPageDash === totalPagesDash ? "pointer-events-none opacity-50" : "cursor-pointer"
                                  }
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        {filteredStudentsDash.length > 0 && (
                          <p>
                            {(currentPageDash - 1) * itemsPerPageDash + 1} -{" "}
                            {Math.min(currentPageDash * itemsPerPageDash, filteredStudentsDash.length)} dari{" "}
                            {filteredStudentsDash.length} baris
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-gray-500">Tidak ada data detail kehadiran siswa.</div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Student Detail Modal */}
            <Dialog open={isDetailModalOpenDash} onOpenChange={setIsDetailModalOpenDash}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-[#041765]">{selectedStudentDash?.name}</DialogTitle>
                  <DialogDescription className="text-sm">NISN: {selectedStudentDash?.nisn}</DialogDescription>
                </DialogHeader>
                <div className="mt-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Detail Kehadiran per Minggu</h4>
                    <div className="space-y-3">
                      {selectedStudentDash?.weekly_summary.map((week, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <h5 className="text-sm font-medium text-[#041765] mb-2">
                            Minggu {week.week_number + 1} ({week.date_range})
                          </h5>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-600">Hadir</span>
                              <span className="font-medium text-[#22C55E]">{week.counts.Hadir}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-600">Sakit</span>
                              <span className="font-medium text-[#9B51E0]">{week.counts.Sakit}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-600">Izin</span>
                              <span className="font-medium text-[#FFC804]">{week.counts.Izin}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-600">Alfa</span>
                              <span className="font-medium text-[#EA2F32]">{week.counts.Alfa}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpenDash(false)}>
                    Tutup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-md shadow-md border border-[#E6E9F4]"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="flex flex-col p-1">
            {selectedCells.length > 1 && (
              <div className="px-2 py-1 text-xs text-[#68686B] border-b border-[#E6E9F4] mb-1">
                {selectedCells.length} sel dipilih
              </div>
            )}

            <button
              className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md transition-colors"
              onClick={() => updateAttendanceStatus(
                contextMenu.studentId,
                contextMenu.date,
                'Hadir',
                selectedCells.length > 0
              )}
            >
              <CheckCircle size={16} className="text-[#22C55E]" />
              <span className="text-[#02124C] whitespace-nowrap">Ubah Menjadi Hadir</span>
            </button>

            <button
              className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md transition-colors"
              onClick={() => updateAttendanceStatus(
                contextMenu.studentId,
                contextMenu.date,
                'Izin',
                selectedCells.length > 0
              )}
            >
              <Clock size={16} className="text-[#FFC804]" />
              <span className="text-[#02124C] whitespace-nowrap">Ubah Menjadi Izin</span>
            </button>

            <button
              className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md transition-colors"
              onClick={() => updateAttendanceStatus(
                contextMenu.studentId,
                contextMenu.date,
                'Sakit',
                selectedCells.length > 0
              )}
            >
              <HeartPulse size={16} className="text-[#9B51E0]" />
              <span className="text-[#02124C] whitespace-nowrap">Ubah Menjadi Sakit</span>
            </button>

            <button
              className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md transition-colors"
              onClick={() => updateAttendanceStatus(
                contextMenu.studentId,
                contextMenu.date,
                'Alfa',
                selectedCells.length > 0
              )}
            >
              <X size={16} className="text-[#EA2F32]" />
              <span className="text-[#02124C] whitespace-nowrap">Ubah Menjadi Tidak hadir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
