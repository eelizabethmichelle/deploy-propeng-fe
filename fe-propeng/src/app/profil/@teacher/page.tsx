"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
// Removed Image import as it wasn't used in the provided snippet
// import Image from "next/image";
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
// Removed LogIn, CalendarCheck, GraduationCap, Info icons as they are no longer used
import { Lock, User } from "lucide-react"; // Kept Check, Lock, User as they are used elsewhere or potentially
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import React from "react" // Kept React import
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form";
import { Form, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Removed VisuallyHidden as it wasn't used in the provided snippet
// import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  nisp: string;
  angkatan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  homeroomId: number; // Kept this, might be relevant elsewhere
  email: string;
  role: string;
  namaHomeroomClass: string;
  totalSiswa: number;
  // Kept absensiStats, might be useful even if not displayed in those cards
  absensiStats: {
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlfa: number;
  };
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

// Removed styles related to the cards if they are confirmed unused elsewhere
// Or keep them if they might be reused
const styles = {
  // frame: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4", // Removed frame style usage
  cardBase: "flex items-center gap-4 p-4 rounded-lg border border-[#E6E9F4] h-full w-full hover:bg-gray-50 transition-colors", // Kept as potentially reusable
  // ... other styles ... keep or remove based on broader usage
  // iconWrapperBlue: "flex-shrink-0 inline-flex items-center justify-center bg-[#E6E9F4] p-3 rounded-full", // Likely unused
  // iconWrapperYellow: "flex-shrink-0 inline-flex items-center justify-center bg-[#05218E] p-3 rounded-full", // Likely unused
  // ... etc for styles used only in the removed cards ...
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

// Removed getTodayDate function as it's no longer used
// const getTodayDate = () => { ... };

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

// Removed AttendanceCodeResponse interface as it's no longer used
// interface AttendanceCodeResponse { ... }

export default function ProfilePageTeacher({ user_id }: { user_id: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  // Removed state related to attendance code
  // const [attendanceCode, setAttendanceCode] = useState<string>(...);
  // const [expiryTime, setExpiryTime] = useState<number>(...);
  // const [lastRequestTime, setLastRequestTime] = useState<number | null>(...);
  // const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
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
      // handleError(error.message); // Consider if you want to show error toast here
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
    // toast.success("Berhasil keluar dari sistem") // Redundant with customToast below
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
            console.log("User data not found (404)", response)
          }
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        setUser(data.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Potentially show an error toast to the user here
      }
    };

    fetchUserData();
  }, [user_id]); // Removed router from dependency array as it's stable

  // Removed useEffect hooks related to attendance code expiry and cooldown
  // useEffect(() => { ... }, [expiryTime]);
  // useEffect(() => { ... }, [attendanceCode]);
  // useEffect(() => { ... }, [lastRequestTime, expiryTime]);

  // Removed functions related to attendance code
  // const generateAttendanceCode = async (kelasId: number) => { ... };
  // const handleRegenerate = async () => { ... };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profil Saya</h3>
      <div className="flex justify-center">
        {/* Main Profile Card */}
        <Card className="w-full">
          {/* Banner */}
          <div className="h-32 bg-blue-900 rounded-t-lg"></div>
          {/* User Info and Logout */}
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-900">{user.username}</p>
              <p className="text-gray-500">Teacher</p> {/* Consider making role dynamic if needed */}
            </div>
            {/* Logout Button */}
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

          {/* ############################################################
            # The section containing the three cards has been removed. #
            # It was previously located here inside a div with         #
            # className={styles.frame}.                                #
            ############################################################
          */}

        </Card>
      </div>

      {/* Informasi Saya Card */}
      <Card className="w-full mt-5">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          {/* Title */}
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <CardTitle>Informasi Saya</CardTitle>
          </div>

          {/* Change Password Button and Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Lock className="w-4 h-4 mr-2" /> Ubah Password
              </Button>
              {/* Removed extra div wrapping the button */}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="fitems-center text-center">
                  <div className="flex flex-col justify-center items-center text-center">
                    <Lock className="flex items-center text-primary mb-2" /> {/* Check if text-primary is defined */}
                    <DialogTitle className="flex text-center items-center mb-2">Ubah Password</DialogTitle>
                  </div>
                  <DialogDescription className="mb-4">
                    Kamu bisa mengubah password yang beda dari sebelumnya.
                  </DialogDescription>
                </div>
                {/* Change Password Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Password Saat Ini *</Label>
                      <PasswordInput id="currentPassword" className="mt-2" {...form.register("currentPassword")} autoComplete="current-password" placeholder="Contoh: Ujang123!" />
                      {form.formState.errors.currentPassword?.message && <p className="text-red-500 text-sm mt-1">{form.formState.errors.currentPassword?.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Password Baru *</Label>
                      <PasswordInput id="newPassword" className="mt-2" {...form.register("newPassword")} autoComplete="new-password" placeholder="Contoh: UjangNew123!" />
                      {form.formState.errors.newPassword?.message && <p className="text-red-500 text-sm mt-1">{form.formState.errors.newPassword?.message}</p>}
                      <FormDescription className="mt-2">*Password baru harus berbeda dari password saat ini</FormDescription>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Konfirmasi Password Baru *</Label>
                      <PasswordInput id="confirmPassword" className="mt-2" {...form.register("confirmPassword")} autoComplete="new-password" placeholder="Contoh: UjangNew123!" />
                      {form.formState.errors.confirmPassword?.message && <p className="text-red-500 text-sm mt-1">{form.formState.errors.confirmPassword?.message}</p>}
                    </div>
                    {/* Removed extra wrapping div */}
                    <div className="flex gap-4 w-full mt-2 justify-end"> {/* Use justify-end */}
                      <DialogClose asChild>
                        <Button id="dialog-close-button" variant="secondary" type="button">Kembali</Button> {/* Added type="button" */}
                      </DialogClose>
                      <Button type="submit"> {/* Removed ml-auto as justify-end handles spacing */}
                        Ubah
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogHeader>
              {/* Removed DialogFooter as buttons are inside DialogHeader/Form */}
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