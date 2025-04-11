"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Dien Fitriani Azzahra"); // optional: bisa fetch dari API kalau mau dinamis
  const [studentNISN, setStudentNISN] = useState("1234567890"); // mock NISN

  const getAuthToken = () => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      "";
    if (!token) {
      console.error("No authentication token found");
      router.push("/login");
      return null;
    }
    return token;
  };

  useEffect(() => {
    const fetchStatus = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch("http://203.194.113.127/api/linimasa/active-event/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await res.json();
        setHasSubmitted(data.data.has_submitted);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
        toast.error("Gagal mengambil status pendaftaran");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full shadow-md rounded-2xl p-6 text-center">
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Pendaftaran Mata Pelajaran Peminatan
            </h1>
            <p className="text-sm text-gray-500">
              Halaman ini digunakan oleh siswa kelas 11 & 12 untuk memilih 4 mata pelajaran peminatan sesuai minat dalam periode linimasa yang aktif.
            </p>
          </div>

          <div className="text-left text-sm text-gray-600 border rounded-lg p-4 bg-gray-100">
            <p><strong>Nama:</strong> {studentName}</p>
            <p><strong>NISN:</strong> {studentNISN}</p>
          </div>

          {String(hasSubmitted) === "false" ? (
            <>
              <p className="text-base font-medium text-yellow-600">
                Anda belum mengajukan mata pelajaran peminatan.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/student/mata-pelajaran-peminatan/daftar")}
              >
                Daftarkan Matpel Minat
              </Button>
              <div className="text-xs text-left text-gray-500 mt-2">
                <p>✅ Pilih 4 mata pelajaran peminatan.</p>
                <p>📆 Pastikan linimasa pendaftaran masih aktif.</p>
                <p>📝 Setelah memilih, tekan tombol "Daftar".</p>
              </div>
            </>
          ) : (
            <p className="text-base font-medium text-green-600">
              Terima kasih, Anda sudah mengajukan mata pelajaran peminatan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
