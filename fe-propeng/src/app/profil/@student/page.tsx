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
import { Check, Lock, User, LogIn, CalendarCheck, GraduationCap, Info } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import React from "react"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form";
import { Form, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  nisn: string;
  angkatan: number;
  isActive: boolean;
  activeClasses: string[];
  classId: number;
  sudahAbsen: string;
  createdAt: string;
  updatedAt: string;
}

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

const getTodayDate = () => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
};

export default function ProfilePageStudent({ user_id }: { user_id: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const [attendanceCode, setAttendanceCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleError = (message: string) => {
    customToast.error(
      "Gagal diubah!",
      message !== "" ? message : "Password sebelumnya tidak sesuai"
    );    
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    customToast.success("Berhasil keluar dari sistem", "Anda akan dialihkan ke halaman login");
    router.push("/login");
  };

  const submitAttendanceCode = async () => {
    if (!attendanceCode.trim()) {
      customToast.error("Gagal", "Kode absen tidak boleh kosong");
      return;
    }

    if (!user) {
      customToast.error("Gagal", "Data profil tidak tersedia");
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      // Prepare the data according to the expected backend format
      const requestData = {
        idKelas: user.classId, // Class ID from user profile
        idSiswa: user.user_id, // Student ID
        kodeAbsen: attendanceCode.trim() // The attendance code entered by user
      };
      
      const response = await fetch("/api/absensi/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      // Check both HTTP status and internal status from JSON response
      if (!response.ok || data.status === 400) {
        throw new Error(data.message || "Gagal mengirim kode absen");
      }

      // Success handling
      customToast.success(
        "Berhasil",
        data.message || "Absensi berhasil tercatat"
      );
      
      // Update the user's attendance status to "Hadir"
      if (user) {
        setUser({
          ...user,
          sudahAbsen: "Hadir"
        });
      }
      
      // Clear the input and close the dialog
      setAttendanceCode("");
      
      // Add a hidden DialogClose button to close the dialog
      const dialogCloseBtn = document.getElementById("dialog-close-absen");
      if (dialogCloseBtn instanceof HTMLButtonElement) {
        dialogCloseBtn.click();
      }
      
    } catch (error: any) {
      customToast.error(
        "Gagal",
        error.message || "Terjadi kesalahan saat mengirim kode absen"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
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
              <p className="text-gray-500">Siswa</p>
              
              {/* Student Dashboard Cards */}
              <div className="flex flex-wrap gap-4 mt-4">
                {/* Check-in Card */}
                {user.sudahAbsen === "Hadir" ? (
                  /* Disabled version when already submitted */
                  <div className="flex items-center gap-6 p-3 border border-[#E6E9F4] rounded-lg bg-gray-50 opacity-80">
                    <div className="inline-flex items-center justify-center p-3 bg-[#E6E9F4] rounded-full">
                      <LogIn className="w-6 h-6 text-[#586AB3]" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#051E81] text-base">Absen</span>
                        <div className="inline-flex p-0.5 bg-green-500 rounded-xl">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <span className="text-sm text-[#88888C]">{getTodayDate()}</span>
                      <span className="text-xs text-green-600 font-medium">Sudah absen hari ini</span>
                    </div>
                  </div>
                ) : (
                  /* Interactive version when not yet submitted */
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-6 p-3 border border-[#E6E9F4] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="inline-flex items-center justify-center p-3 bg-[#E6E9F4] rounded-full">
                          <LogIn className="w-6 h-6 text-[#586AB3]" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#051E81] text-base">Absen</span>
                          </div>
                          <span className="text-sm text-[#88888C]">{getTodayDate()}</span>
                        </div>
                      </div>
                    </DialogTrigger>
                    
                    {/* Attendance Code Modal */}
                    <DialogContent className="sm:max-w-md p-0 bg-transparent border-none">
                      <div className="bg-white border border-[#E1E2E8] rounded-lg p-6 flex flex-col gap-6 w-full max-w-[466px] mx-auto">
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex items-center w-full">
                            <DialogTitle className="text-[#051E81] text-2xl font-normal">Kode Absen</DialogTitle>
                          </div>
                          
                          <div className="w-full">
                            <Label htmlFor="attendance-code" className="sr-only">
                              Kode Absen
                            </Label>
                            <input
                              id="attendance-code"
                              placeholder="Kode Absen"
                              className="w-full p-2.5 border border-[#E1E2E8] rounded-lg text-sm"
                              value={attendanceCode}
                              onChange={(e) => setAttendanceCode(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isSubmitting) {
                                  submitAttendanceCode();
                                }
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="w-full">
                          <button 
                            className="w-full bg-[#05218E] hover:bg-[#041E75] text-white font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={submitAttendanceCode}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Mengirim..." : "Submit"}
                          </button>
                        </div>
                      </div>
                      
                      <DialogClose id="dialog-close-absen" className="hidden" asChild>
                        <button aria-label="Close"></button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Attendance Card */}
                <div className="flex items-center gap-6 p-3 border-r border-[#E6E9F4]">
                  <div className="inline-flex items-center justify-center p-3 bg-[#05218E] rounded-full">
                    <CalendarCheck className="w-6 h-6 text-[#FFCB04]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#051E81] text-base">Kehadiran</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="text-[#051E81]">112</span>
                      <span className="text-[#88888C]"> Hadir</span>
                      <div className="w-1 h-1 bg-[#E1E2E8] rounded-full mx-1"></div>
                      <span className="text-[#051E81]">2</span>
                      <span className="text-[#88888C]"> Sakit</span>
                      <div className="w-1 h-1 bg-[#E1E2E8] rounded-full mx-1"></div>
                      <span className="text-[#051E81]">3</span>
                      <span className="text-[#88888C]"> Izin</span>
                      <div className="w-1 h-1 bg-[#E1E2E8] rounded-full mx-1"></div>
                      <span className="text-[#051E81]">0</span>
                      <span className="text-[#88888C]"> Alpa</span>
                    </div>
                  </div>
                </div>

                {/* GPA Current Semester Card */}
                <div className="flex items-center gap-6 p-3 border-r border-[#E6E9F4]">
                  <div className="inline-flex items-center justify-center p-3 bg-[#05218E] rounded-full">
                    <GraduationCap className="w-6 h-6 text-[#FFCB04]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#051E81] text-base">GPA Sem. 2 (Saat Ini)</span>
                      <Info className="w-4 h-4" />
                    </div>
                    <p>
                      <span className="text-[#051E81]">85.5</span>
                      <span className="text-[#88888C]">/100</span>
                    </p>
                  </div>
                </div>

                {/* Cumulative GPA Card */}
                <div className="flex items-center gap-6 p-3">
                  <div className="relative inline-flex items-center justify-center p-3 bg-[#05218E] rounded-full">
                    <GraduationCap className="w-6 h-6 text-[#FFCB04]" />
                    <span className="absolute text-xs font-bold text-white right-0 bottom-0">all</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#051E81] text-base">GPA Kumulatif</span>
                      <Info className="w-4 h-4" />
                    </div>
                    <p>
                      <span className="text-[#051E81]">85.5</span>
                      <span className="text-[#88888C]">/100</span>
                    </p>
                  </div>
                </div>
              </div>
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
              <p className="text-gray-500">NISN</p>
              <p className="text-blue-900">{user.nisn}</p>
            </div>
            <div>
              <p className="text-gray-500">Angkatan</p>
              <p className="text-blue-900">{user.angkatan}</p>
            </div>
            <div>
              <p className="text-gray-500">Kelas</p>
              <p className="text-blue-900">
                {user.activeClasses?.[0] ? user.activeClasses[0] : "Tidak tergabung ke Kelas aktif manapun"}
              </p>
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