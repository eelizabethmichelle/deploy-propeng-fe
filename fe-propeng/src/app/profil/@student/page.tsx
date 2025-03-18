"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react"
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

interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  nisn: string;
  angkatan: number;
  status: string;
  createdAt: string;
  updatedAt: string,
}

export default function ProfilePage({ userId }: { userId: number }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    toast.success("Berhasil keluar dari sistem")
    router.push("/login");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      try {
        const response = await fetch(`/api/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/404");
          }
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        console.log(data)
        setUser(data.data);

      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, [userId, router]);

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
          <Button variant="outline">
            <Lock className="w-4 h-4 mr-2" /> Ubah Password
          </Button>
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
              <p className="text-gray-500">Status</p>
              <p className="text-blue-900">{user.status ? "Aktif" : "Tidak Aktif"}</p>
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