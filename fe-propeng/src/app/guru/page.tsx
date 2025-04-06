"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ username: string } | null>(null);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        toast.success("Berhasil keluar dari sistem")                    
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen flex-col items-center">
            <main className="flex-1 p-10 w-full mt-20">
                <h1 className="text-center text-2xl font-bold mb-6">
                    Selamat datang, {user?.username}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Kelas */}
                    <div className="p-6 bg-white shadow rounded-lg text-center">
                        <p className="mb-4 text-gray-700">
                        Lihat daftar kelas yang telah ditugaskan kepada Anda sebagai wali kelas
                            <strong> Lihat Kelas</strong>
                        </p>
                        <Button variant="default" onClick={() => router.push("/guru/kelas")}>
                            Lihat Kelas
                        </Button>
                    </div>

                    {/* Mata Pelajaran */}
                    <div className="p-6 bg-white shadow rounded-lg text-center">
                        <p className="mb-4 text-gray-700">
                        Lihat daftar mata pelajaran yang telah ditugaskan kepada Anda untuk diampu
                            <strong> Lihat Mata Pelajaran</strong>
                        </p>
                        <Button variant="default" onClick={() => router.push("/guru/mata-peljaaran")}>
                            Lihat Mata Pelajaran
                        </Button>
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
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
                </div>
            </main>
        </div>
    );
}