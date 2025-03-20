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


interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  nisn: string;
  angkatan: number;
  isActive: boolean;
  activeClasses: string[];
  createdAt: string;
  updatedAt: string;
}


export default function ProfilePageStudent({ user_id }: { user_id: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

        
      const form = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
          currentPassword: "",
          newPassword: "",
        },
      });
  
      const onSubmit = (data: any) => {
        console.log("Form Data:", data);
      };
    
    
    /* Toast success */
    const handleSuccess = () => {
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
                  Password kamu berhasil diubah
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
  const fetchUserData = async () => {
    const accessToken =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    console.log("Access Token:", accessToken); // Debugging token

    try {
      const response = await fetch(`http://203.194.113.127/api/auth/profile/${user_id}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/404");
        }
        throw new Error("Failed to fetch data");
      }

      setUser(responseData.data);

    } catch (error) {
      console.error("Fetch error:", error);
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
                        <Button type="button" variant="secondary">
                          Kembali
                        </Button>
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
              <p className="text-blue-900">{user.activeClasses[0]}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="text-blue-900">{user.isActive ? "Aktif" : "Tidak Aktif"}</p>
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