"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarCheck, CheckSquare, GraduationCap, Info, Check, CheckCircle, Clock, X, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

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
  maleCount: number;
  femaleCount: number;
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

export default function Page() {
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    maleCount: 0,
    femaleCount: 0,
    presentCount: 0,
    sickCount: 0,
    permissionCount: 0,
    absentCount: 0,
    notYetSubmittedCount: 0
  });
  const [attendanceCode, setAttendanceCode] = useState<string>("");
  const [expiryTime, setExpiryTime] = useState<number>(0);
  const [isCodeGenerated, setIsCodeGenerated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);

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

      // Make API request to fetch teacher's class
      const response = await fetch(`/api/kelas/saya`, {
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
          setClassData(null);
          setLoading(false);
          return;
        }

        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Parse JSON response
      const jsonData = await response.json();

      // Check API response status
      if (jsonData.status === 200) {
        if (!jsonData.data || jsonData.data.length === 0) {
          setClassData(null);
        } else {
          // Set the data from the response - assuming the first class is the main one
          setClassData(jsonData.data[0]);
          
          // Set attendance stats using the data from the API
          const classInfo = jsonData.data[0];
          const stats: AttendanceStats = {
            maleCount: 12, // Placeholder (would need gender data)
            femaleCount: 5, // Placeholder (would need gender data)
            presentCount: classInfo.absensiStats?.totalHadir || 0,
            sickCount: classInfo.absensiStats?.totalSakit || 0,
            permissionCount: classInfo.absensiStats?.totalIzin || 0,
            absentCount: classInfo.absensiStats?.totalAlfa || 0,
            notYetSubmittedCount: 2 // This might need to be calculated based on total students - total attendance
          };
          setAttendanceStats(stats);
        }
      } else if (jsonData.status === 400 || jsonData.status === 404 || jsonData.status === 500) {
        // Handle empty data case
        setClassData(null);
        
        // Show notification if teacher is not assigned to any class
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

      // Show error toast
      customToast.error("Gagal memuat data", "Terjadi kesalahan saat mengambil data kelas");
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceCode = async () => {
    if (!classData) {
      customToast.error("Gagal", "Data kelas tidak ditemukan");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      const response = await fetch(`/api/kelas/kode`, { 
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} Id ${classData.id}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat kode absen");
      }
      
      setAttendanceCode(data.data.kode);
      setExpiryTime(29);
      setIsCodeGenerated(true);
      
      customToast.success(
        "Berhasil",
        "Kode absen berhasil dibuat"
      );
    } catch (error: any) {
      customToast.error(
        "Gagal",
        error.message || "Gagal membuat kode absen"
      );
    }
  };

  // Count down timer for attendance code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiryTime > 0) {
      timer = setInterval(() => {
        setExpiryTime(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            setIsCodeGenerated(false);
          }
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTime]);

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    if (!classData) return;
    
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 200) {
        throw new Error(data.message || "Failed to fetch attendance data");
      }
      
      // Set dates
      setAttendanceDates(data.dates || []);
      
      // Format student data
      const formattedStudents: StudentAttendance[] = Object.entries(data.students || {}).map(([name, studentData]: [string, any]) => ({
        id: studentData.id,
        name: name,
        attendanceByDate: studentData.dates || {}
      }));
      
      setStudents(formattedStudents);
      
      customToast.success(
        "Berhasil",
        "Data kehadiran berhasil dimuat"
      );
      
    } catch (error: any) {
      console.error("Error fetching attendance data:", error);
      customToast.error(
        "Gagal",
        error.message || "Tidak dapat memuat data kehadiran"
      );
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch attendance data after class data is loaded
  useEffect(() => {
    if (classData) {
      fetchAttendanceData();
    }
  }, [classData]);

  // Updated selection functions
  const isCellSelected = (studentId: number, date: string): boolean => {
    return selectedCells.some(cell => cell.studentId === studentId && cell.date === date);
  };

  const toggleCellSelection = (studentId: number, date: string) => {
    if (isCellSelected(studentId, date)) {
      // Deselect this cell
      setSelectedCells(selectedCells.filter(cell => 
        !(cell.studentId === studentId && cell.date === date)
      ));
    } else {
      // Select this cell
      setSelectedCells([...selectedCells, { studentId, date }]);
    }
  };
  
  // Toggle selection for just the date in the header
  const toggleDateSelection = (date: string) => {
    // Get all studentIds
    const studentIds = students.map(student => student.id);
    
    // Check if all cells for this date are already selected
    const allSelected = studentIds.every(studentId => isCellSelected(studentId, date));
    
    if (allSelected) {
      // Deselect all cells for this date
      setSelectedCells(selectedCells.filter(cell => cell.date !== date));
    } else {
      // Select all cells for this date that aren't already selected
      const newCells = studentIds
        .filter(studentId => !isCellSelected(studentId, date))
        .map(studentId => ({ studentId, date }));
      
      setSelectedCells([...selectedCells, ...newCells]);
    }
  };
  
  // Clear all selections
  const clearSelections = () => {
    setSelectedCells([]);
  };

  // Update getAttendanceCell to use the new selection mechanism
  const getAttendanceCell = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null, date: string, studentId: number) => {
    const isSelected = isCellSelected(studentId, date);
    const baseClasses = "flex items-center justify-center w-10 h-10 rounded-md text-sm cursor-pointer";
    
    // Format date for display - extract day from YYYY-MM-DD
    const displayDate = new Date(date).getDate().toString().padStart(2, '0');
    
    if (!status) {
      return (
        <div 
          className={`${baseClasses} border border-[#041765] ${isSelected ? "bg-[#F7F8FF] ring-2 ring-blue-500" : "hover:bg-gray-50"}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleCellSelection(studentId, date);
          }}
        >
          {displayDate}
        </div>
      );
    }
    
    let bgColor = "";
    let icon = null;
    
    switch(status) {
      case 'Hadir':
        bgColor = "bg-[#586AB3] text-white";
        icon = <Check size={14} />;
        break;
      case 'Sakit':
        bgColor = "bg-[#EA2F32] text-white";
        icon = <XCircle size={14} />;
        break;
      case 'Izin':
        bgColor = "bg-[#FFC804] text-[#041765]";
        icon = <Clock size={14} />;
        break;
      case 'Alfa':
        bgColor = "bg-[#F06480] text-white";
        icon = <X size={14} />;
        break;
    }
    
    return (
      <div 
        className={`${baseClasses} ${bgColor} ${isSelected ? "ring-2 ring-blue-500" : "hover:opacity-90"}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleCellSelection(studentId, date);
        }}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {displayDate}
      </div>
    );
  };

  // Format date for display
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate().toString().padStart(2, '0');
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

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        {/* Class Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-normal text-[#041765]">{classData.namaKelas}</h2>
          <p className="text-sm text-[#88888C]">TA {classData.tahunAjaran}</p>
        </div>

        {/* Navigation Menu */}
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="bg-white border border-[#E6E9F4] rounded-lg p-1">
            <TabsTrigger value="todo" className="data-[state=active]:bg-[#F7F8FF] rounded-md">To Do</TabsTrigger>
            <TabsTrigger value="grades" className="data-[state=active]:bg-[#F7F8FF] rounded-md">Rekap Nilai</TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#F7F8FF] rounded-md">Rekap Kehadiran Peserta</TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="mt-6">
            <Card className="border-[#E1E2E8]">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="flex items-center gap-3 p-6 border-b border-[#E6E9F4]">
                  <div className="bg-[#8C99CB] p-3 rounded-full">
                    <CalendarCheck className="w-6 h-6 text-[#586AB3]" />
                  </div>
                  <h3 className="text-base font-bold text-[#041765]">Presensi</h3>
                </div>

                {/* Card Content - Code Generation or Display */}
                {!isCodeGenerated ? (
                  <div className="flex flex-col p-6 border-b border-[#E6E9F4]">
                    <div className="border border-[#E6E9F4] rounded-lg p-6 flex flex-col items-center gap-2 max-w-xl">
                      <p className="text-[#051E81] text-base">Buat Kode Absen</p>
                      <Button 
                        onClick={generateAttendanceCode}
                        className="w-full bg-[#05218E] hover:bg-[#041E75] text-white font-bold py-2 px-3 rounded-lg"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col p-6 border-b border-[#E6E9F4]">
                    <div className="border border-[#E6E9F4] rounded-lg p-6 flex flex-col items-center gap-2 max-w-xl">
                      <div className="w-full border-2 border-[#B2BADC] rounded-lg p-3 flex justify-center">
                        <p className="text-[#374DA5] text-xl font-normal">{attendanceCode}</p>
                      </div>
                      <p className="text-sm text-[#88888C]">*expiring in {expiryTime}s</p>
          <Button
                        onClick={() => {
                          setIsCodeGenerated(false);
                          setExpiryTime(0);
                          generateAttendanceCode();
                        }}
                        className="w-full bg-[#05218E] hover:bg-[#041E75] text-white font-bold py-2 px-3 rounded-lg"
                        disabled={expiryTime > 0}
                      >
                        Buat kembali
          </Button>
                    </div>
                  </div>
                )}

                {/* Student Stats */}
                <div className="p-6 flex flex-col gap-4">
                  {/* Student Count */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[#051E81] text-base">Jumlah Murid</h4>
                    <div className="flex items-center gap-2">
                      <p>
                        <span className="text-[#051E81] font-medium">{classData.totalSiswa}</span>
                        <span className="text-[#68686B]"> Peserta Didik</span>
                      </p>
                    </div>
                  </div>

                  {/* Attendance Count */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[#051E81] text-base">Kehadiran Hari Ini</h4>
                      <div className="bg-[#F9F9FF] rounded-lg px-2 py-1">
                        <span className="text-[#374DA5] text-xs">Total {classData.totalSiswa} Siswa</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p>
                        <span className="text-[#051E81] font-medium">{classData.absensiStats?.totalHadir || 0}</span>
                        <span className="text-[#68686B]"> Hadir</span>
                      </p>
                      <div className="w-1 h-1 bg-[#E1E2E8] rounded-full"></div>
                      <p>
                        <span className="text-[#05218E] font-medium">{classData.absensiStats?.totalSakit || 0}</span>
                        <span className="text-[#68686B]"> Sakit</span>
                      </p>
                      <div className="w-1 h-1 bg-[#E1E2E8] rounded-full"></div>
                      <p>
                        <span className="text-[#05218E] font-medium">{classData.absensiStats?.totalIzin || 0}</span>
                        <span className="text-[#68686B]"> Izin</span>
                      </p>
                      <div className="w-1 h-1 bg-[#E1E2E8] rounded-full"></div>
                      <p>
                        <span className="text-[#05218E] font-medium">{classData.absensiStats?.totalAlfa || 0}</span>
                        <span className="text-[#68686B]"> Alfa</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <div className="flex flex-col gap-6">
              <Card className="border-[#E1E2E8]">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <div className="min-w-max">
                      {/* Attendance Legend */}
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#586AB3] rounded"></div>
                          <span className="text-sm">Hadir</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#FFC804] rounded"></div>
                          <span className="text-sm">Izin</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#EA2F32] rounded"></div>
                          <span className="text-sm">Sakit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#F06480] rounded"></div>
                          <span className="text-sm">Alfa</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#AEB0B5] rounded"></div>
                          <span className="text-sm">Hari Libur</span>
                        </div>
                      </div>
                    
                      {/* Attendance Table */}
                      <div className="border border-[#E6E9F4] rounded-lg">
                        {/* Table Header */}
                        <div className="flex border-b border-[#041765] bg-[#F7F8FF]">
                          <div className="w-40 p-3 font-medium text-[#041765] border-r border-[#E6E9F4]">
                            Nama
                          </div>
                          <div className="flex flex-col">
                            {/* Month Headers */}
                            {attendanceDates.length > 0 && (
                              <div className="flex border-b border-[#E6E9F4]">
                                <div className="p-2 font-medium text-[#041765] text-center w-full">
                                  {attendanceDates.length > 0 ? new Date(attendanceDates[0]).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : ''}
                                </div>
                              </div>
                            )}
                            
                            {/* Date Headers */}
                            <div className="flex">
                              {attendanceDates.map((date, i) => (
                                <div key={i} className="flex-shrink-0 p-1">
                                  <div 
                                    className={`flex items-center justify-center w-10 h-10 rounded-md text-sm border border-[#041765] cursor-pointer ${
                                      // Only show selected if ALL cells for this date are selected
                                      students.length > 0 && students.every(student => 
                                        selectedCells.some(cell => cell.studentId === student.id && cell.date === date)
                                      ) ? "bg-[#F7F8FF] ring-2 ring-blue-500" : "hover:bg-gray-100"}`}
                                    onClick={() => toggleDateSelection(date)}
                                  >
                                    {formatDateHeader(date)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Student Rows */}
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
                        
                        {/* Daily Attendance Summary */}
                        <div className="flex border-b border-[#E6E9F4]">
                          <div className="w-40 p-3 font-medium text-[#041765] border-r border-[#E6E9F4]">
                            Kehadiran Harian
                          </div>
                          <div className="flex gap-1 p-1">
                            {attendanceDates.map((date, i) => {
                              // Calculate attendance counts for this date
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

                      {/* Controls */}
                      <div className="flex justify-between mt-4">
                        <p className="text-sm text-[#041765]">
                          {selectedCells.length} sel dari {attendanceDates.length * students.length} dipilih.
                        </p>
                        <div className="flex gap-2">
                          {selectedCells.length > 0 && (
                            <button 
                              className="px-4 py-2 text-sm border border-[#E6E9F4] rounded-md hover:bg-[#F7F8FF] text-red-500"
                              onClick={clearSelections}
                            >
                              Clear Selection
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

                      {/* Actions for Selected Dates */}
                      {selectedCells.length > 0 && (
                        <div className="mt-4 border border-[#E6E9F4] rounded-lg p-4">
                          <div className="font-medium text-sm mb-2">Ubah status kehadiran untuk {selectedCells.length} tanggal yang dipilih:</div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md">
                              <CheckCircle size={16} className="text-[#586AB3]" />
                              <span>Ubah Menjadi Hadir</span>
                            </button>
                            <button className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md">
                              <Clock size={16} className="text-[#FFC804]" />
                              <span>Ubah Menjadi Izin</span>
                            </button>
                            <button className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md">
                              <XCircle size={16} className="text-[#EA2F32]" />
                              <span>Ubah Menjadi Sakit</span>
                            </button>
                            <button className="flex items-center gap-2 p-2 text-sm hover:bg-[#F7F8FF] rounded-md">
                              <X size={16} className="text-[#F06480]" />
                              <span>Ubah Menjadi Alfa</span>
                            </button>
        </div>
        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grades">
            <div className="flex items-center justify-center h-64 border rounded-md">
              <p className="text-gray-500">Fitur Rekap Nilai sedang dalam pengembangan</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
