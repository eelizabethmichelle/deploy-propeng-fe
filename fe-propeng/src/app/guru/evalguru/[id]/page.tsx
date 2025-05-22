'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import type { NextPage } from "next";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IndicatorScore {
  variabel_id: number;
  [key: string]: string | number;
}

interface EvaluationData {
  nama_matapelajaran: string;
  tahun_ajaran_mapel: string;
  ringkasan_skor_rata_rata_per_variabel: Record<string, string>;
  detail_skor_rata_rata_per_indikator: IndicatorScore[];
  skor_grand_total: string;
  daftar_kritik_saran: string[];
  total_pengisi_evaluasi: number;
  total_siswa_diajar_di_matapelajaran: number;
}

const variableLabels: Record<string, string> = {
  "1": "Materi Pelajaran",
  "2": "Proses Pembelajaran",
  "3": "Pengelolaan Kelas",
  "4": "Evaluasi Pembelajaran",
};

// Function to determine color based on rating value
const getRatingColor = (ratingStr: string | undefined) => {
  if (!ratingStr) return "";
  
  // Extract numeric value from string (e.g., "4.5 / 5.0" -> 4.5)
  const rating = parseFloat(ratingStr.split('/')[0].trim());
  
  if (rating >= 4 && rating <= 5) return "text-green-600 font-medium";
  if (rating >= 2 && rating < 4) return "text-yellow-600 font-medium";
  if (rating >= 0 && rating < 2) return "text-red-600 font-medium";
  return "";
};

const TeacherEvaluationPage: NextPage = () => {
  const { id } = useParams();
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvaluation = async () => {
      setIsLoading(true);
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) {
          setError("Token tidak ditemukan. Silakan login ulang.");
          return;
        }
        const response = await fetch("/api/evalguru/guru/detail", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token} Id ${id}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || "Gagal mengambil data evaluasi");
          toast.error("Error", data.message || "Gagal mengambil data evaluasi");
          return;
        }
        if (data.evaluasi_guru) {
          setEvaluationData(data.evaluasi_guru);
        } else {
          setError("Tidak ada data evaluasi yang tersedia.");
        }
      } catch (error: any) {
        setError(error.message || "Terjadi kesalahan saat mengambil data evaluasi");
        toast.error("Error", error.message || "Terjadi kesalahan saat mengambil data evaluasi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluation();
  }, [id]);

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center">Loading data evaluasi...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
  if (!evaluationData) {
    return <div className="p-6">Tidak ada data evaluasi yang tersedia.</div>;
  }

  // Process indicator data to make it easier to render
  const indicatorsByVariable: Record<number, Record<string, string>> = {};
  evaluationData.detail_skor_rata_rata_per_indikator.forEach((item) => {
    const varId = item.variabel_id;
    if (!indicatorsByVariable[varId]) indicatorsByVariable[varId] = {};
    
    // Add all indicator scores to this variable
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'variabel_id') {
        indicatorsByVariable[varId][key] = value as string;
      }
    });
  });

  // Find max number of indicators for header row
  let maxIndicators = 0;
  Object.values(indicatorsByVariable).forEach((indicators) => {
    maxIndicators = Math.max(maxIndicators, Object.keys(indicators).length);
  });

  return (
    <div className="container mx-auto p-4">      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{evaluationData.nama_matapelajaran}</CardTitle>
          <p className="text-sm text-muted-foreground">Tahun Ajaran {evaluationData.tahun_ajaran_mapel}</p>
          
          {/* Response percentage indicator */}
          {evaluationData.total_siswa_diajar_di_matapelajaran > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Jumlah Responden:</span>
                {(() => {
                  const responsePercentage = (evaluationData.total_pengisi_evaluasi / evaluationData.total_siswa_diajar_di_matapelajaran) * 100;
                  let colorClass = "text-red-500";
                  
                  if (responsePercentage === 100) {
                    colorClass = "text-green-500";
                  } else if (responsePercentage >= 50) {
                    colorClass = "text-yellow-500";
                  }
                  
                  return (
                    <span className={`font-medium ${colorClass}`}>
                      {evaluationData.total_pengisi_evaluasi} / {evaluationData.total_siswa_diajar_di_matapelajaran} 
                      {" "}({responsePercentage.toFixed(0)}%)
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px] font-semibold">Variabel Penilaian</TableHead>
                  {Array.from({ length: maxIndicators }, (_, idx) => (
                    <TableHead key={idx} className="font-semibold text-center">
                      Indikator {idx + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(variableLabels).map(([varId, label]) => (
                  <TableRow key={varId} className={parseInt(varId) % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{label}</TableCell>                    {Array.from({ length: maxIndicators }, (_, idx) => {
                      const indicatorKey = `Indikator ${idx + 1}`;
                      const rating = indicatorsByVariable[parseInt(varId)]?.[indicatorKey];
                      
                      return (
                        <TableCell key={idx} className="text-center">
                          <span className={getRatingColor(rating)}>
                            {rating || "-"}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 mb-2">
            <h3 className="text-lg font-semibold mb-4">Kritik dan Saran dari Mahasiswa</h3>
            <div className="space-y-2">
              {evaluationData.daftar_kritik_saran.length > 0 ? (
                evaluationData.daftar_kritik_saran.map((comment, idx) => (
                  <div key={idx} className="p-3 border rounded-md bg-muted/10">
                    <p>{comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Tidak ada kritik dan saran</p>
              )}
            </div>
          </div>
        </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
          <div className="font-bold text-lg">
            Skor Total: <span className={getRatingColor(evaluationData.skor_grand_total)}>{evaluationData.skor_grand_total}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeacherEvaluationPage;