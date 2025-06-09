'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
// Removed NextPage import since it's not needed in App Router
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

// Changed from NextPage type to standard function component
export default function TeacherEvaluationPage() {
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <CardTitle className="text-xl">{evaluationData.nama_matapelajaran}</CardTitle>
              <p className="text-sm text-muted-foreground">Tahun Ajaran {evaluationData.tahun_ajaran_mapel}/{Number(evaluationData.tahun_ajaran_mapel) + 1}</p>
              
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
            </div>
            
            <div className="mt-4 md:mt-0 md:text-right">
              <div className="font-bold text-lg">
                Skor Total: <span className={getRatingColor(evaluationData.skor_grand_total)}>{evaluationData.skor_grand_total}</span>
              </div>
              <div className="w-full flex justify-center md:justify-end">
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Baik (4.0 -- 5.0)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Cukup (2.0 -- 4.0)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Kurang (0.0 -- 2.0)</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Summary of Variable Scores */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Ringkasan Nilai Per Variabel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">              {Object.entries(evaluationData.ringkasan_skor_rata_rata_per_variabel).map(([varId, score]) => {
                const numericScore = parseFloat(score.split('/')[0].trim());
                const percentage = (numericScore / 5) * 100;
                let bgColor = "bg-red-500";
                
                if (numericScore >= 4) {
                  bgColor = "bg-green-500";
                } else if (numericScore >= 2) {
                  bgColor = "bg-yellow-500";
                }
                
                return (
                  <div key={varId} className="border rounded-md p-4 bg-muted/10">
                    <h4 className="text-sm font-medium mb-2">{variableLabels[varId]}</h4>
                    <p className={`text-xl font-bold ${getRatingColor(score)}`}>
                      {score}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className={`${bgColor} h-2.5 rounded-full`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Indicator Scores */}
          <h3 className="text-lg font-semibold mb-3">Detail Nilai Per Indikator</h3>
          <div className="rounded-md border">
            <Table>              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px] font-semibold">Variabel Penilaian</TableHead>
                  {Array.from({ length: maxIndicators }, (_, idx) => (
                    <TableHead key={idx} className="font-semibold text-center">
                      Indikator {idx + 1}
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-center w-[150px] bg-gray-100">Rata-Rata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>                {Object.entries(variableLabels).map(([varId, label]) => (
                  <TableRow key={varId} className={parseInt(varId) % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{label}</TableCell>
                    {Array.from({ length: maxIndicators }, (_, idx) => {
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
                    <TableCell className="text-center bg-gray-50">
                      <span className={`font-medium ${getRatingColor(evaluationData.ringkasan_skor_rata_rata_per_variabel[varId])}`}>
                        {evaluationData.ringkasan_skor_rata_rata_per_variabel[varId] || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>          <div className="mt-8 mb-2">
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
            </div>          </div>
        </CardContent>
      </Card>
    </div>
  );
}