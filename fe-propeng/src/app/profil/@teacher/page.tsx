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

import { Check, Lock, User } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
 import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from "@/components/ui/dialog";
 import React from "react"
 import { Label } from "@/components/ui/label"
 import { useForm } from "react-hook-form";
 import { Form } from "@/components/ui/form";
 import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
 
interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  nisp: string;
  angkatan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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


export default function ProfilePageTeacher({ user_id }: { user_id: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);
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
    
                // Ambil JSON dari respons, meskipun statusnya error
                const responseData = await response.json();
    
                if (!response.ok) {
                    console.log("Response:", responseData);
                    console.log("Status:", response.status);
    
                  // Tampilkan pesan error dari Django
                    handleError(responseData.message)
                    throw new Error(responseData.message || "Gagal mengubah password!");
                }
    
                handleSuccess(responseData.message); 
                console.log("Success:", responseData.message);
            } catch (error: any) {
                console.error("Error:", error.message);
            }
        };
    
        
        
        /* Toast success */
        const handleSuccess = (message: string) => {
            toast("", {
              description: (
                <div className="flex items-start gap-3">
                  {/* Icon di kiri */}
                  <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                    <Check className="text-background w-4 h-4" />
                  </div>
                  <div>
                    {/* Judul dibuat lebih besar */}
                    <p className="text-lg font-semibold text-foreground font-sans">Berhasil Diubah</p>
                    {/* Deskripsi dengan warna lebih muted */}
                    <p className="text-sm text-muted-foreground font-sans">
                      {message!=="" ? message : "Password kamu berhasil diubah"}
                    </p>
                  </div>
                </div>
              ),
              action: {
                label: (
                  <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
                    Tutup
                  </span>
                ),
                onClick: () => console.log("Tutup"),
              },
            })
          }
      
    
        /* Toast error */
        const handleError = (message: string) => {
            toast("", {
              description: (
                <div className="flex items-start gap-3">
                  {/* Icon di kiri */}
                  <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                    <Check className="text-background w-4 h-4" />
                  </div>
                  <div>
                    {/* Judul dibuat lebih besar */}
                    <p className="text-lg font-semibold text-foreground font-sans">Gagal diubah!</p>
                    {/* Deskripsi dengan warna lebih muted */}
                    <p className="text-sm text-muted-foreground font-sans">
                      {message!=="" ? message : "Password sebelumnya tidak sesuai"}
                    </p>
                  </div>
                </div>
              ),
              action: {
                label: (
                  <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
                    Tutup
                  </span>
                ),
                onClick: () => console.log("Tutup"),
              },
            })
        }

  

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    toast.success("Berhasil keluar dari sistem")
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
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <PasswordInput id="currentPassword" {...form.register("currentPassword")} autoComplete="current-password" />
                        <p className="text-red-500 text-sm">{form.formState.errors.currentPassword?.message}</p>
                      </div> 
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <PasswordInput id="newPassword" {...form.register("newPassword")} autoComplete="new-password" />
                      <p className="text-red-500 text-sm">{form.formState.errors.newPassword?.message}</p>
                    </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <PasswordInput id="confirmPassword" {...form.register("confirmPassword")} autoComplete="new-password" />
                        <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword?.message}</p>
                      </div>
                      <div className="flex gap-4 w-full">
                        <DialogClose asChild>
                          <Button variant="secondary">Kembali</Button>
                        </DialogClose>
                        <Button className="max-w-xs w-full" type="submit">
                          Ubah
                        </Button>
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
              <p className="text-blue-900">{user.isActive ? "Status" : "Tidak Aktif"}</p>
            </div>
            <div>
              <p className="text-gray-500">Dibuat Pada Tanggal</p>
              <p className="text-blue-900">{user.createdAt}</p>
            </div>
            <div>
              <p className="text-gray-500">Diperbarui Pada Tanggal</p>
              <p className="text-blue-900">{user.updatedAt}</p>
            </div>
          </div>
        </CardContent>
        </Card>
    </div>
  );
}