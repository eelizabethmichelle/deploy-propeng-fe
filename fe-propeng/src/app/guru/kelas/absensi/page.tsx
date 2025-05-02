"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

export default function Page() {
  const router = useRouter();
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
      // ... (fetch logic remains the same) ...
      const response = await fetch(`/api/kelas/kode`, { /* ... headers ... */
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} Id ${classData.id}`,
        },
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || "Gagal membuat kode presensi"); }

      setAttendanceCode(data.data.kode);
      setExpiryTime(30);
      // setIsCodeGenerated(true); // No longer needed
      setIsModalOpen(true); // <-- Open the modal on success
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

      const response = await fetch(`/api/kelas/saya`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
    const baseClasses = "flex items-center justify-center w-10 h-10 rounded-md text-sm cursor-pointer";

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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData}>Coba Lagi</Button>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">Anda tidak menjadi wali kelas untuk kelas aktif manapun saat ini.</p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {/* Class Header */}
          <h2 className="text-2xl font-normal text-[#041765]">{classData.namaKelas}</h2>
          <p className="text-sm text-[#88888C]">TA {classData.tahunAjaran}</p>
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
                          <span className="text-gray-900 font-medium">{classData.totalSiswa}</span>
                          <span className="text-gray-600"> Peserta Didik</span>
                        </p>
                      </div>
                    </div>
                    {/* Kehadiran Hari Ini */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-gray-700 text-base font-semibold">Kehadiran Hari Ini</h4> {/* Sesuaikan style */}
                        {classData.totalSiswa > 0 && ( // Hanya tampilkan jika ada siswa
                          <div className="bg-blue-50 rounded-lg px-2 py-0.5"> {/* Sesuaikan style */}
                            <span className="text-blue-700 text-xs">Total {classData.totalSiswa} Siswa</span>
                          </div>
                        )}
                      </div>
                      {/* Detail Kehadiran */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"> {/* Sesuaikan gap & text size */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData.absensiStats?.totalHadir || 0}</span>
                          <span className="text-gray-600"> Hadir</span>
                        </p>
                        {/* Titik pemisah bisa dihilangkan jika menggunakan gap */}
                        {/* <div className="w-1 h-1 bg-gray-300 rounded-full"></div> */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData.absensiStats?.totalSakit || 0}</span>
                          <span className="text-gray-600"> Sakit</span>
                        </p>
                        {/* <div className="w-1 h-1 bg-gray-300 rounded-full"></div> */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData.absensiStats?.totalIzin || 0}</span>
                          <span className="text-gray-600"> Izin</span>
                        </p>
                        {/* <div className="w-1 h-1 bg-gray-300 rounded-full"></div> */}
                        <p>
                          <span className="text-gray-900 font-medium">{classData.absensiStats?.totalAlfa || 0}</span>
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
                              {attendanceDates.length > 0 && (
                                <div className="flex border-b border-[#E6E9F4]">
                                  <div className="p-2 font-medium text-[#041765] text-center w-full">
                                    {attendanceDates.length > 0 ? new Date(attendanceDates[0]).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : ''}
                                  </div>
                                </div>
                              )}
                              <div className="flex">
                                {attendanceDates.map((date, i) => (
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
                              <div className="flex gap-1 p-1">
                                {attendanceDates.map((date, i) => (
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
                            <div className="flex gap-1 p-1">
                              {attendanceDates.map((date, i) => {
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
                                  <div key={i} className="w-10 h-10 flex items-center justify-center text-sm">
                                    {attendanceText}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Info Seleksi & Tombol */}
                        <div className="flex justify-between mt-4">
                          <p className="text-sm text-[#041765]">
                            {selectedCells.length} sel dipilih dari {(attendanceDates?.length || 0) * (students?.length || 0)} total
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
