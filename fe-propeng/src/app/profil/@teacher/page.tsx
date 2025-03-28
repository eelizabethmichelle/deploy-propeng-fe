"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { LogIn, CalendarCheck, GraduationCap, Info } from "lucide-react";
import { Check, Lock, User } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import React from "react"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form";
import { Form, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  nisp: string;
  angkatan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  homeroomId: number;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama harus diisi"),
  newPassword: z.string()
    .min(8, "Password harus minimal 8 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka")
    .regex(/[@$!%*?&]/, "Password harus mengandung simbol"),
  confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

const styles = {
  frame: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4",
  cardBase: "flex items-center gap-4 p-4 rounded-lg border border-[#E6E9F4] h-full w-full hover:bg-gray-50 transition-colors",
  iconWrapperBlue: "flex-shrink-0 inline-flex items-center justify-center bg-[#E6E9F4] p-3 rounded-full",
  iconWrapperYellow: "flex-shrink-0 inline-flex items-center justify-center bg-[#05218E] p-3 rounded-full",
  contentWrapper: "flex flex-col gap-2 min-w-0 flex-1",
  titleWrapper: "flex items-center gap-2",
  titleText: "text-[#051E81] font-normal text-base truncate",
  subtitleText: "text-[#88888C] font-normal text-sm",
  statsWrapper: "flex flex-wrap items-center gap-x-2 gap-y-1",
  statItem: "flex items-center",  
  statDot: "w-1 h-1 bg-[#E1E2E8] rounded-full mx-2 last:hidden",
  statNumber: "text-[#051E81] font-medium",
  statLabel: "text-[#88888C]",
  modalFrame: "flex flex-col gap-3 items-end justify-center p-6 bg-white border border-[#E1E2E8] w-full max-w-md",
  modalHeader: "flex flex-col gap-3 w-full",
  modalTitle: "text-[#051E81] text-2xl font-normal",
  codeWrapper: "w-full flex flex-col gap-1.5 px-1.5",
  codeBox: "w-full flex justify-center items-center border-2 border-[#586AB3] rounded-xl p-3.5",
  codeText: "text-[#051E81] text-3xl font-normal",
  expiryText: "text-[#68686B] text-sm",
  buttonWrapper: "w-full py-2",
  regenerateButton: "w-full bg-[#05218E] text-white rounded-lg py-2 font-bold hover:bg-[#051E81] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const getTodayDate = () => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
};

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

interface AttendanceCodeResponse {
  status: number;
  message: string;
  data: {
    id: number;
    namaKelas: string | null;
    kode: string;
  }
}

export default function ProfilePageTeacher({ user_id }: { user_id: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [attendanceCode, setAttendanceCode] = useState<string>(() => {
    return localStorage.getItem('attendanceCode') || "";
  });
  const [expiryTime, setExpiryTime] = useState<number>(() => {
    const savedExpiry = localStorage.getItem('expiryTimestamp');
    if (!savedExpiry) return 0;
    
    const expiryTimestamp = parseInt(savedExpiry);
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((expiryTimestamp - now) / 1000));
    return remainingSeconds;
  });
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastAttendanceCodeRequest');
    const timestamp = saved ? parseInt(saved) : null;
    console.log("Initializing lastRequestTime from localStorage:", timestamp);
    return timestamp;
  });
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: any) => {
    const accessToken =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    const { currentPassword, newPassword } = data;
  
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ old_password: currentPassword, new_password: newPassword }),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.log("Response:", responseData);
        console.log("Status:", response.status);
        handleError(responseData.message)
        throw new Error(responseData.message || "Gagal mengubah password!");
      }
  
      handleSuccess(responseData.message);
      form.reset();
      setTimeout(() => {
        const dialogClose = document.getElementById("dialog-close-button");
        if (dialogClose instanceof HTMLButtonElement) {
          dialogClose.click();
        }
      }, 500);
    } catch (error: any) {
      console.error("Error:", error.message);
    }
  };
  
  const handleSuccess = (message: string) => {
    customToast.success(
      "Berhasil Diubah",
      message !== "" ? message : "Password berhasil diubah"
    );
  };

  /* Toast error */
  const handleError = (message: string) => {
    customToast.error(
      "Gagal diubah!",
      message !== "" ? message : "Password sebelumnya tidak sesuai"
    );    
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    toast.success("Berhasil keluar dari sistem")
    customToast.success("Berhasil keluar dari sistem", "Anda akan dialihkan ke halaman login.")
    router.push("/login");
  };

  useEffect(() => {
    if (!user_id) {
      console.error("userId is undefined, cannot fetch profile data.");
      return;
    }

    const fetchUserData = async () => {
      const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      try {
        const response = await fetch(`/api/account/detail`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken} Id ${user_id}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log(response)
          }
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        setUser(data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, [user_id, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiryTime > 0) {
      const expiryTimestamp = Date.now() + (expiryTime * 1000);
      localStorage.setItem('expiryTimestamp', expiryTimestamp.toString());
      
      timer = setInterval(() => {
        setExpiryTime(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            localStorage.removeItem('expiryTimestamp');
          }
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTime]);

  useEffect(() => {
    if (attendanceCode) {
      localStorage.setItem('attendanceCode', attendanceCode);
    } else {
      localStorage.removeItem('attendanceCode');
    }
  }, [attendanceCode]);

  useEffect(() => {
    const updateCooldown = () => {
      if (lastRequestTime === null) {
        setCooldownRemaining(0);
        return;
      }
      
      const now = Date.now();
      const COOLDOWN_MINUTES = 5;
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
      const elapsed = now - lastRequestTime;
      const remaining = Math.max(0, cooldownMs - elapsed);
      setCooldownRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        console.log("Cooldown complete, clearing lastRequestTime");
        if (expiryTime <= 0) {
          localStorage.removeItem('lastAttendanceCodeRequest');
          setLastRequestTime(null);
        }
      }
    };
    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [lastRequestTime, expiryTime]);

  const generateAttendanceCode = async (kelasId: number) => {
    const COOLDOWN_MINUTES = 5;
    const now = Date.now();
    
    if (lastRequestTime !== null && expiryTime > 0) {
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < (COOLDOWN_MINUTES * 60 * 1000)) {
        const remainingMinutes = Math.ceil(
          (COOLDOWN_MINUTES * 60 * 1000 - timeSinceLastRequest) / 60000
        );
        throw new Error(`Harap tunggu ${remainingMinutes} menit sebelum membuat kode baru`);
      }
    }

    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      const response = await fetch(`/api/kelas/kode`, { 
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken} Id ${kelasId}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat kode absen");
      }
      const currentTime = Date.now();
      setLastRequestTime(currentTime);
      localStorage.setItem('lastAttendanceCodeRequest', currentTime.toString());
      console.log("Set lastRequestTime to:", currentTime);
      
      return data.data.kode;
    } catch (error) {
      console.error("Error generating attendance code:", error);
      throw error;
    }
  };

  const handleRegenerate = async () => {
    if (expiryTime === 0 && user?.homeroomId) {
      try {
        const newCode = await generateAttendanceCode(user.homeroomId);
        setAttendanceCode(newCode);
        setExpiryTime(300);
        customToast.success(
          "Berhasil",
          "Kode absen berhasil didapatkan"
        );
      } catch (error: any) {
        customToast.error(
          "Gagal",
          error.message || "Gagal membuat kode absen"
        );
      }
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profil Saya</h3>
      <div className="flex justify-center">
        <Card className="w-full">
          {/* Blue Header Section */}
          <div className="h-32 bg-blue-900 rounded-t-lg"></div>

          {/* Profile Info Section */}
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-900">{user.username}</p>
              <p className="text-gray-500">Teacher</p>
            </div>
              
            {/* Logout Button (Aligned with Username) */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Logout</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Yakin mau keluar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Kamu bisa masuk lagi nanti.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Yakin, keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
          </CardContent>
          <div className={styles.frame}>
            <Dialog>
              <DialogTrigger asChild>
                <div 
                  className={`${styles.cardBase} cursor-pointer`}
                  onClick={async () => {
                    if (user?.homeroomId) {
                      if (cooldownRemaining > 0) {
                        customToast.error(
                          "Gagal",
                          `Harap tunggu ${Math.floor(cooldownRemaining / 60)}m ${cooldownRemaining % 60}s sebelum membuat kode baru`
                        );
                        return;
                      }
                      if (!attendanceCode || expiryTime === 0) {
                        try {
                          const newCode = await generateAttendanceCode(user.homeroomId);
                          setAttendanceCode(newCode);
                          setExpiryTime(300);
                        } catch (error: any) {
                          customToast.error(
                            "Gagal",
                            error.message || "Gagal membuat kode absen"
                          );
                        }
                      }
                    } else {
                      customToast.error(
                        "Gagal",
                        "Anda tidak memiliki kelas yang diasuh"
                      );
                    }
                  }}
                >
                  <div className={styles.iconWrapperBlue}>
                    <LogIn className="w-6 h-6 text-[#586AB3]" />
                  </div>
                  <div className={styles.contentWrapper}>
                    <div className={styles.titleWrapper}>
                      <span className={styles.titleText}>Buat Kode Absen</span>
                    </div>
                    {cooldownRemaining > 0 ? (
                      <span className={styles.subtitleText} style={{ color: '#9d174d' }}>
                        Dapat membuat kode dalam {Math.floor(cooldownRemaining / 60)}m {cooldownRemaining % 60}s
                      </span>
                    ) : (
                      <span className={styles.subtitleText}>{getTodayDate()}</span>
                    )}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-0 bg-transparent border-none">
                <div className={styles.modalFrame}>
                  <div className={styles.modalHeader}>
                    <DialogTitle className={styles.modalTitle}>Kode Absen</DialogTitle>
                  </div>
                  
                  <div className={styles.codeWrapper}>
                    <div className={styles.codeBox}>
                      <span className={styles.codeText}>{attendanceCode || "Belum ada kode"}</span>
                    </div>
                    
                    {cooldownRemaining > 0 ? (
                      <span className={styles.expiryText} style={{ color: '#9d174d' }}>
                        *dapat membuat kode baru dalam {Math.floor(cooldownRemaining / 60)}m {cooldownRemaining % 60}s
                      </span>
                    ) : (
                      <span className={styles.expiryText}>
                        *kode sudah kadaluwarsa
                      </span>
                    )}
                  </div>

                  <div className={styles.buttonWrapper}>
                    <button 
                      className={styles.regenerateButton} 
                      onClick={handleRegenerate}
                      disabled={expiryTime > 0 || cooldownRemaining > 0}
                    >
                      {attendanceCode ? "Buat Kembali" : "Buat"}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Lihat Kehadiran Siswa Card */}
            <div className={styles.cardBase}>
              <div className={styles.iconWrapperYellow}>
                <CalendarCheck className="w-6 h-6 text-[#FFCB04]" />
              </div>
              <div className={styles.contentWrapper}>
                <div className={styles.titleWrapper}>
                  <span className={styles.titleText}>Lihat Kehadiran Siswa</span>
                </div>
                <div className={styles.statsWrapper}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>112</span>
                    <span className={styles.statLabel}> Hadir</span>
                    <div className={styles.statDot} />
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>2</span>
                    <span className={styles.statLabel}> Sakit</span>
                    <div className={styles.statDot} />
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>3</span>
                    <span className={styles.statLabel}> Izin</span>
                    <div className={styles.statDot} />
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>0</span>
                    <span className={styles.statLabel}> Alpa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lihat Grafik Nilai Siswa Card */}
            <div className={styles.cardBase}>
              <div className={styles.iconWrapperYellow}>
                <GraduationCap className="w-6 h-6 text-[#FFCB04]" />
              </div>
              <div className={styles.contentWrapper}>
                <div className={styles.titleWrapper}>
                  <span className={styles.titleText}>Lihat Grafik Nilai Siswa</span>
                  <Info className="w-4 h-4 flex-shrink-0" />
                </div>
                <span>
                  <span className={styles.statNumber}>85.5</span>
                  <span className={styles.statLabel}>/100</span>
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>


      <Card className="w-full mt-5">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <CardTitle>Informasi Saya</CardTitle>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <div className="flex gap-2 pt-2">
                <Button variant="outline">
                  <Lock className="w-4 h-4 mr-2" /> Ubah Password
                </Button>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">

              <DialogHeader>
                <div className="fitems-center text-center">
                  <div className="flex flex-col justify-center items-center text-center">
                    <Lock className="flex items-center text-primary mb-2"></Lock>
                    <DialogTitle className="flex text-center items-center mb-2">Ubah Password</DialogTitle>
                  </div>
                  <DialogDescription className="mb-4">
                    Kamu bisa mengubah password yang beda dari sebelumnya.
                  </DialogDescription>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Password Saat Ini *</Label>
                      <PasswordInput id="currentPassword" className="mt-2" {...form.register("currentPassword")} autoComplete="current-password" placeholder="Contoh: Ujang123!" />
                      <p className="text-red-500 text-sm">{form.formState.errors.currentPassword?.message}</p>
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Password Baru *</Label>
                      <PasswordInput id="newPassword" className="mt-2" {...form.register("newPassword")} autoComplete="new-password" placeholder="Contoh: UjangNew123!" />
                      <p className="text-red-500 text-sm">{form.formState.errors.newPassword?.message}</p>
                      <FormDescription className="mt-2">*Password baru harus berbeda dari password saat ini</FormDescription>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Konfirmasi Password Baru *</Label>
                      <PasswordInput id="confirmPassword" className="mt-2"{...form.register("confirmPassword")} autoComplete="new-password" placeholder="Contoh: UjangNew123!" />
                      <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword?.message}</p>
                    </div>
                    <div className="flex gap-4 w-full">

                      <div className="flex gap-4 w-full mt-2">
                      <DialogClose asChild>
                        <Button id="dialog-close-button" variant="secondary">Kembali</Button>
                      </DialogClose>
                        <Button type="submit" className="ml-auto">
                          Ubah
                        </Button>
                      </div>

                    </div>
                  </form>
                </Form>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* User Details */}

        {/* User Details */}
        <CardContent className="p-6">
          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-gray-500">Nama</p>
              <p className="text-blue-900">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Username</p>
              <p className="text-blue-900">{user.username}</p>
            </div>
            <div>
              <p className="text-gray-500">NISP</p>
              <p className="text-blue-900">{user.nisp}</p>
            </div>
            <div>
              <p className="text-gray-500">Tahun Masuk</p>
              <p className="text-blue-900">{user.angkatan}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="text-blue-900">{user.isActive ? "Aktif" : "Tidak Aktif"}</p>
            </div>
            <div>
              <p className="text-gray-500">Dibuat Pada Tanggal</p>
              <p className="text-blue-900">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Diperbarui Pada Tanggal</p>
              <p className="text-blue-900">{formatDate(user.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}