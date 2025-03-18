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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const accessToken =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!accessToken) {
            router.push("/login");
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/user", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    localStorage.removeItem("accessToken");
                    sessionStorage.removeItem("accessToken");
                    router.push("/login");
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        toast.success("Berhasil keluar dari sistem")
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-lg text-gray-700">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center">
            <main className="flex-1 p-10 w-full mt-20">
                <h1 className="text-center text-2xl font-bold mb-6">
                    Selamat datang, {user?.username}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Tambah Akun Pengguna */}
                    <div className="p-6 bg-white shadow rounded-lg text-center">
                        <p className="mb-4 text-gray-700">
                            Tambahkan akun siswa dan guru yang terdaftar dalam kegiatan belajar mengajar melalui fitur
                            <strong> Tambah Akun Pengguna</strong>
                        </p>
                        <Button variant="default" onClick={() => router.push("/admin/akun/tambah")}>
                            Tambah Akun Pengguna
                        </Button>
                    </div>

                    {/* Tambah Kelas */}
                    <div className="p-6 bg-white shadow rounded-lg text-center">
                        <p className="mb-4 text-gray-700">
                            Tambahkan kelas sesuai kebutuhan serta tetapkan guru sebagai wali kelas dan siswa ke dalamnya melalui fitur
                            <strong> Tambah Kelas</strong>
                        </p>
                        <Button variant="default" onClick={() => router.push("/")}>
                            Tambah Kelas
                        </Button>
                    </div>

                    {/* Tambah Mata Pelajaran */}
                    <div className="p-6 bg-white shadow rounded-lg text-center">
                        <p className="mb-4 text-gray-700">
                            Tambahkan mata pelajaran sesuai kebutuhan serta tetapkan guru dan siswa ke dalamnya melalui fitur
                            <strong> Tambah Mata Pelajaran</strong>
                        </p>
                        <Button variant="default" onClick={() => router.push("/")}>
                            Tambah Mata Pelajaran
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