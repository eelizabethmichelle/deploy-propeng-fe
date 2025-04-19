'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE_URL } from "@/lib/api";


export default function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [submisi, setSubmisi] = useState<any>(null);

  const getAuthToken = () => {
    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken') ||
      '';
    if (!token) {
      router.push('/login');
      return null;
    }
    return token;
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        // Get active event & submisi status
        const statusRes = await fetch('/api/linimasa/active-event/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const statusData = await statusRes.json();
        const hasSubmitted = statusData.data?.has_submitted;
        const eventId = statusData.data?.event_id;

        // Get student info
        const studentRes = await fetch('/api/auth/detail', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentData = await studentRes.json();
        const studentId = studentData.data_user?.id;
        setStudent(studentData.data_user);
                console.log("dududuud")
        console.log(studentData)

        if (hasSubmitted) {
          // Get all submissions for this event
          const submisiRes = await fetch(`http://${API_BASE_URL}/api/linimasa/submisi/${eventId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });


          const { data } = await submisiRes.json();

          console.log("---------------")
          console.log(data)
          const currentUserSubmission = data.find((s: any) => s.id_siswa === studentId);
          setSubmisi(currentUserSubmission);
        } else {
          setSubmisi(null);
        }
      } catch (error) {
        console.error('Gagal mengambil data:', error);
        toast.error('Gagal memuat data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  const statusText = (val: boolean | null) => {
    if (val === true) return '✅ Diterima';
    if (val === false) return '❌ Ditolak';
    return '⏳ Belum Diproses';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full shadow-md rounded-2xl p-6 text-center">
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Pendaftaran Mata Pelajaran Peminatan
            </h1>
            <p className="text-sm text-gray-500">
              Halaman ini digunakan oleh siswa kelas 11 & 12 untuk memilih 4 mata pelajaran peminatan dalam periode linimasa yang aktif.
            </p>
          </div>

          <div className="text-left text-sm text-gray-600 border rounded-lg p-4 bg-gray-100">
            <p><strong>Nama:</strong> {student?.username}</p>
            <p><strong>NISN:</strong> {student?.nisn || '-'}</p>
          </div>

          {!submisi ? (
            <>
              <p className="text-base font-medium text-yellow-600">
                Anda belum mengajukan mata pelajaran peminatan.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push('/student/mata-pelajaran-peminatan/daftar')}
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
            <>
              <div className="text-left text-sm text-gray-600 border rounded-lg p-4 bg-white space-y-2">
                <p><strong>Tanggal Pengajuan:</strong> {new Date(submisi.submitted_at).toLocaleString()}</p>
                <p><strong>Tier 1:</strong> {submisi.tier1 ? submisi.tier1_nama_option2 : submisi.tier1_nama_option1} — {statusText(submisi.statustier1)}</p>
                <p><strong>Tier 2:</strong> {submisi.tier2 ? submisi.tier2_nama_option2 : submisi.tier2_nama_option1} — {statusText(submisi.statustier2)}</p>
                <p><strong>Tier 3:</strong> {submisi.tier3 ? submisi.tier3_nama_option2 : submisi.tier3_nama_option1} — {statusText(submisi.statustier3)}</p>
                <p><strong>Tier 4:</strong> {submisi.tier4 ? submisi.tier4_nama_option2 : submisi.tier4_nama_option1} — {statusText(submisi.statustier4)}</p>
              </div>

              {[
                submisi.statustier1,
                submisi.statustier2,
                submisi.statustier3,
                submisi.statustier4
              ].some((s) => s === null) ? (
                <p className="text-yellow-600 mt-2">Pengajuan Anda sedang diulas oleh guru.</p>
              ) : (
                <p className="text-green-600 mt-2">
                  Pengajuan Anda telah diulas dan Anda telah terdaftar ke mata pelajaran yang bersangkutan.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
