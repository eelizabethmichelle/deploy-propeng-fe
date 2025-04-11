"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Matpel {
  id: number;
  nama: string;
  capacity: number;
}

interface EventData {
  id: number;
  matpel: {
    tier1_option1: Matpel;
    tier1_option2: Matpel;
    tier2_option1: Matpel;
    tier2_option2: Matpel;
    tier3_option1: Matpel;
    tier3_option2: Matpel;
    tier4_option1: Matpel;
    tier4_option2: Matpel;
  };
}

interface Siswa {
  name: string;
  nisn: string;
  id: number; // student_id
}

export default function PendaftaranPage() {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [selectedMatpel, setSelectedMatpel] = useState({
    tier1: "",
    tier2: "",
    tier3: "",
    tier4: "",
  });

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
    const token = getAuthToken();
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/auth/detail", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.status === 200 && data.data_user) {
          setSiswa({
            name: data.data_user.name,
            nisn: data.data_user.nisn,
            id: data.data_user.id,
          });
        } else {
          toast.error("Data siswa tidak ditemukan.");
        }
      } catch (err) {
        console.error("Gagal fetch user:", err);
        toast.error("Gagal mengambil data siswa.");
      }
    };

    const fetchEvent = async () => {
      try {
        const res = await fetch("http://203.194.113.127/api/linimasa/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const activeEvent = data.data.find((e: any) => e.status === "aktif");
        if (!activeEvent) {
          toast.warning("Tidak ada event aktif saat ini.");
        } else {
          setEventData(activeEvent);
        }
      } catch (err) {
        console.error("Gagal mengambil data event:", err);
        toast.error("Gagal mengambil data event");
      }
    };

    fetchUser();
    fetchEvent();
  }, []);

  const handleChange = (tier: string, value: string) => {
    setSelectedMatpel((prev) => ({ ...prev, [tier]: value }));
  };

  const handleSubmit = async () => {
    const token = getAuthToken();
    if (!token || !siswa || !eventData) return;

    const body = {
      event_id: eventData.id,
      student_id: siswa.id,
      tier1: !!selectedMatpel.tier1,
      tier2: !!selectedMatpel.tier2,
      tier3: !!selectedMatpel.tier3,
      tier4: !!selectedMatpel.tier4,
    };

    try {
      const res = await fetch("http://203.194.113.127/api/linimasa/pilihan-siswa/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Pilihan berhasil didaftarkan!");
      } else {
        toast.error(result.message || "Gagal mendaftar pilihan.");
      }
    } catch (err) {
      console.error("Gagal submit pilihan:", err);
      toast.error("Terjadi kesalahan saat submit pilihan.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-6">
      <Card className="w-full max-w-2xl shadow-xl p-6 rounded-2xl bg-white">
        <CardContent className="space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Pendaftaran Peminatan
          </h1>

          {siswa && (
            <div className="text-sm text-gray-700 bg-gray-100 p-4 rounded-lg space-y-1">
              <p><span className="font-semibold">Nama:</span> {siswa.name}</p>
              <p><span className="font-semibold">NISN:</span> {siswa.nisn}</p>
            </div>
          )}

          {eventData ? (
            <>
              {["tier1", "tier2", "tier3", "tier4"].map((tier, idx) => {
                const option1 = `${tier}_option1`;
                const option2 = `${tier}_option2`;
                return (
                  <div key={tier}>
                    <p className="font-medium text-gray-700 mb-2">
                      Tier {idx + 1}
                    </p>
                    <RadioGroup
                      value={selectedMatpel[tier as keyof typeof selectedMatpel]}
                      onValueChange={(val) => handleChange(tier, val)}
                      className="space-y-2"
                    >
                      {[option1, option2].map((key) => (
                        <Label key={key} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={
                              eventData.matpel[key as keyof typeof eventData.matpel].id.toString()
                            }
                          />
                          {eventData.matpel[key as keyof typeof eventData.matpel].nama}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })}

              <Button
                className="w-full mt-6"
                onClick={handleSubmit}
              >
                Daftarkan Pilihan
              </Button>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Memuat event aktif...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
