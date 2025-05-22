"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import router from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { GradeDistributionChart } from "@/components/ui/grade-distribution";
import { ThreeBarStatCard } from "@/components/ui/bar-card";
import DonutChart from "@/components/ui/donut-chart";
import { DataTableDistribusiNilai } from "@/components/ui/dt-distribusi-nilai-keseluruhan/data-table";
import { distribusiNilaiColumns } from "@/components/ui/dt-distribusi-nilai-keseluruhan/columns";
import { DataTableDistribusiNilaiKomponen } from "@/components/ui/dt-distribusi-nilai-komponen/data-table";
import { distribusiNilaiKomponenColumns } from "@/components/ui/dt-distribusi-nilai-komponen/columns";
import { DataTableDashboardSiswa } from "@/components/ui/dt-dashboard-siswa/data-table";
import { dashboardSiswaColumns } from "@/components/ui/dt-dashboard-siswa/columns";
import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

const chartColors = [
    "#0B0E66", "#3543A4", "#5C70D6", "#A4AEEB", "#F0B400",
    "#C34A36", "#6C3483", "#138D75", "#F39C12", "#E74C3C"
];

type GradeDistribution = {
    a: number;
    b: number;
    c: number;
    d: number;
  };

type SubjectDistribution = {
    id: number;
    namaMataPelajaran: string;
    jumlahSiswa: number;
    rerataNilai: number;
    distribusiNilai: {
      a: number;
      b: number;
      c: number;
      d: number;
    };
  };

type SubjectDistributionByKomponen = {
    id: number;
    namaMataPelajaran: string;
    jenis: 'Pengetahuan' | 'Keterampilan';
    rerataNilai: number;
    distribusiNilai: {
      a: number;
      b: number;
      c: number;
      d: number;
    };
  };

type topAndRiskStudent = {
    id: number;
    namaSiswa: string;
    rerataNilai: number;
    nilaiPengetahuan: number;
    nilaiKeterampilan: number;
  };

export default function Page() {
    const params = useParams();
    const classId = params?.id;
    const [filterType, setFilterType] = useState("Pengetahuan");
    const [loading, setLoading] = useState(false);

    const [kelas, setKelas] = useState("");
    const [totalSiswa, setTotalSiswa] = useState([]);
    const [tahunAjaran, setTahunAjaran] = useState("");

    // PIE CHART
    const [subjectData, setSubjectData] = useState([]);
    const [notes, setNotes] = useState([]);

    // CARD
    const [moreThan8A, setMoreThan8A] = useState(0);
    const [between18A, setBetween18A] = useState(0);
    const [zeroA, setZeroA] = useState(0);
    const [moreThan5C, setMoreThan5C] = useState(0);
    const [between15C, setBetween15C] = useState(0);
    const [zeroC, setZeroC] = useState(0);
    const [moreThan3D, setMoreThan3D] = useState(0);
    const [between13D, setBetween13D] = useState(0);
    const [zeroD, setZeroD] = useState(0);
    const [passedLessThanHalf, setPassedLessThanHalf] = useState(0);
    const [passedHalfToAll, setPassedHalfToAll] = useState(0);
    const [passedAll, setPassedAll] = useState(0);
    const [belowClassAvg, setBelowClassAvg] = useState(0);
    const [betweenAvgAndThreshold, setBetweenAvgAndThreshold] = useState(0);
    const [aboveThreshold, setAboveThreshold] = useState(0);
    const [avgBelow75, setAvgBelow75] = useState(0);
    const [avgBetween75And84, setAvgBetween75And84] = useState(0);
    const [avg84OrMore, setAvg84Ormore] = useState(0);
    const [classAverage, setClassAverage] = useState(0);
    const [classThreshold, setClassThreshold] = useState(0);

    // TABLE
    const [classDistribution, setClassDistribution] = useState<GradeDistribution | null>(null);
    const [subjectDistributionAll, setSubjectDistributionAll] = useState<SubjectDistribution[]>([]);
    const [subjectDistributionByKomponen, setSubjectDistributionByKomponen] = useState<SubjectDistributionByKomponen[]>([])
    const [topStudent, setTopStudent] = useState<topAndRiskStudent[]>([])
    const [riskStudent, setRiskStudent] = useState<topAndRiskStudent[]>([])
  
    const [error, setError] = useState("");

    const getAuthToken = () => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return null;
        }
        return token;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
          try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
    
            const response = await fetch("/api/kelas/dashboard", {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} classId ${classId}`,
              },
            });
    
            const result = await response.json();
            console.log(result)
    
            if (response.ok && result.status === 200) {
                setKelas(result.kelas);
                setTotalSiswa(result.total_siswa);
                setTahunAjaran(result.tahun_ajaran);

                // Pie Chart
                const pieChartData = result.subject_data.classes.map((item: any, index: number) => ({
                    name: item.name,
                    value: item.value,
                    color: chartColors[index % chartColors.length],
                }));
                setSubjectData(pieChartData);
                setNotes(result.subject_data.classes_notes);

                // Card
                const insights = result.insights;
                setMoreThan8A(insights.more_than_8_A || 0);
                setBetween18A(insights.between_1_8_A || 0);
                setZeroA(insights.zero_A || 0);
                setMoreThan5C(insights.more_than_5_C || 0);
                setBetween15C(insights.between_1_5_C || 0);
                setZeroC(insights.zero_C || 0);
                setMoreThan3D(insights.more_than_3_D || 0);
                setBetween13D(insights.between_1_3_D || 0);
                setZeroD(insights.zero_D || 0);
                setPassedLessThanHalf(insights.passed_less_than_half || 0);
                setPassedHalfToAll(insights.passed_half_to_all || 0);
                setPassedAll(insights.passed_all || 0);
                setBelowClassAvg(insights.below_class_avg || 0);
                setBetweenAvgAndThreshold(insights.between_avg_and_threshold || 0);
                setAboveThreshold(insights.above_threshold || 0);
                setAvgBelow75(insights.avg_below_75 || 0);
                setAvgBetween75And84(insights.avg_between_75_84 || 0);
                setAvg84Ormore(insights.avg_84_or_more || 0);
                setClassAverage(Math.round(insights.class_avg) || 0);
                setClassThreshold(Math.round(insights.class_threshold) || 0);

                // Grade distribution
                const classDistributionRaw = result.class_distribution;
                setClassDistribution(classDistributionRaw.distribusi);
                const subjectDistributionAllRaw = result.subject_distribution_all;
                setSubjectDistributionAll(subjectDistributionAllRaw.map((item: any) => ({
                    id: item.id_mata_pelajaran,
                    namaMataPelajaran: item.mata_pelajaran,
                    jumlahSiswa: item.jumlah_siswa,
                    rerataNilai: Number(item.rata_rata),
                    distribusiNilai: {
                      a: item.distribusi?.a ?? 0,
                      b: item.distribusi?.b ?? 0,
                      c: item.distribusi?.c ?? 0,
                      d: item.distribusi?.d ?? 0,
                    },
                  })));
                const subjectDistributionByKomponenRaw = result.subject_distribution_by_komponen;
                setSubjectDistributionByKomponen(subjectDistributionByKomponenRaw.map((item: any) => ({
                    id: item.id_mata_pelajaran,
                    namaMataPelajaran: item.mata_pelajaran,
                    jenis: item.jenis,
                    rerataNilai: Number(item.rata_rata),
                    distribusiNilai: {
                      a: item.distribusi?.a ?? 0,
                      b: item.distribusi?.b ?? 0,
                      c: item.distribusi?.c ?? 0,
                      d: item.distribusi?.d ?? 0,
                    },
                  })));
                  
                  // Top and risk student
                  const studentData = result.student_data;
                  setTopStudent(studentData.siswa_terbaik.map((item: any) => ({
                      id: item.id,
                      namaSiswa: item.namaSiswa,
                      rerataNilai: Number(item.rerataNilai),
                      nilaiPengetahuan: Number(item.nilaiPengetahuan),
                      nilaiKeterampilan: Number(item.nilaiKeterampilan),
                    })));
                  setRiskStudent(studentData.siswa_risiko_akademik.map((item: any) => ({
                      id: item.id,
                      namaSiswa: item.namaSiswa,
                      rerataNilai: Number(item.rerataNilai),
                      nilaiPengetahuan: Number(item.nilaiPengetahuan),
                      nilaiKeterampilan: Number(item.nilaiKeterampilan),
                    })));
                

            } else {
              throw new Error(result.message || "Gagal memuat data insight");
            }
          } catch (err: any) {
            console.error(err);
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchDashboardData();
    }, []);    

  const filteredData = subjectDistributionByKomponen.filter((item) => item.jenis === filterType);

  return (
    <div>
        {/* Header section */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold text-blue-900">{`${kelas}`}</h1>
          <p className="text-medium">Jumlah Siswa: {`${totalSiswa}`} | Tahun Ajaran: {`${tahunAjaran}/${Number(tahunAjaran)+1}`}</p>
          <div className="flex items-center gap-2 text-blue-900">
            <Info className="w-4 h-4" />
            <span className="text-sm">Arahkan kursor ke masing-masing bagian pada grafik untuk melihat informasi jumlah siswa secara detail</span>
          </div>
        </div>
    
        <div className="space-y-4">
          {/* Row 1: Donut chart and bar stats */}
          <div className="grid grid-cols-1">
            <DonutChart
              title="Distribusi Pendaftaran Mata Pelajaran"
              data={subjectData}
              notes={notes}
            />
          </div>
    
          {/* Row 2: First row of ThreeBarStatCard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThreeBarStatCard
              titleColor="text-green-600"
              title={`${(zeroA+between18A+moreThan8A) > 0 ? ((moreThan8A / (zeroA+between18A+moreThan8A)) * 100).toFixed(2) : "0.00"}%`}
              subtitle={`${moreThan8A} dari ${zeroA+between18A+moreThan8A}`}
              description="Siswa dengan nilai A pada lebih dari delapan mata pelajaran"
              columns={[
                { label: "0", sublabel:"Mata Pelajaran", value: zeroA },
                { label: "1 - 8", sublabel:"Mata Pelajaran", value: between18A },
                { label: "> 8", sublabel:"Mata Pelajaran", value: moreThan8A },
              ]}
            />
            <ThreeBarStatCard
              titleColor="text-yellow-600"
              title={`${(zeroC+between15C+moreThan5C) > 0 ? ((moreThan5C / (zeroC+between15C+moreThan5C)) * 100).toFixed(2) : "0.00"}%`}
              subtitle={`${moreThan5C} dari ${zeroC+between15C+moreThan5C}`}
              description="Siswa dengan nilai C pada lebih dari lima mata pelajaran"
              columns={[
                { label: `0`, sublabel:"Mata Pelajaran", value: zeroC },
                { label: "1 - 5", sublabel:"Mata Pelajaran", value: between15C },
                { label: "> 5", sublabel:"Mata Pelajaran", value: moreThan5C },
              ]}
            />
            <ThreeBarStatCard
              titleColor="text-red-600"
              title={`${(zeroD+between13D+moreThan3D) > 0 ? ((moreThan3D / (zeroD+between13D+moreThan3D)) * 100).toFixed(2) : "0.00"}%`}
              subtitle={`${moreThan3D} dari ${zeroD+between13D+moreThan3D}`}
              description="Siswa dengan nilai D pada lebih dari tiga mata pelajaran"
              columns={[
                { label: "0", sublabel:"Mata Pelajaran", value: zeroD },
                { label: "1 - 3", sublabel:"Mata Pelajaran", value: between13D },
                { label: "> 3", sublabel:"Mata Pelajaran", value: moreThan3D },
              ]}
            />
          </div>
    
          {/* Row 3: Second row of ThreeBarStatCard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThreeBarStatCard
                titleColor="text-green-600"
                title={`${(passedLessThanHalf+passedHalfToAll+passedAll) > 0 ? ((passedAll / (passedLessThanHalf+passedHalfToAll+passedAll)) * 100).toFixed(2) : "0.00"}%`}
                subtitle={`${passedAll} dari ${passedLessThanHalf+passedHalfToAll+passedAll}`}
                description="Siswa lulus pada seluruh mata pelajaran"
                columns={[
                  { label: "< 50%", sublabel:"Mata Pelajaran", value: passedLessThanHalf },
                  { label: "< 100%", sublabel:"Mata Pelajaran", value: passedHalfToAll },
                  { label: "100%", sublabel:"Mata Pelajaran", value: passedAll },
                ]}
              />
              <ThreeBarStatCard
                titleColor="text-yellow-600"
                title={`${(belowClassAvg+betweenAvgAndThreshold+aboveThreshold) > 0 ? ((belowClassAvg / (belowClassAvg+betweenAvgAndThreshold+aboveThreshold)) * 100).toFixed(2) : "0.00"}%`}
                subtitle={`${belowClassAvg} dari ${belowClassAvg+betweenAvgAndThreshold+aboveThreshold}`}
                description={`Siswa dengan rerata nilai di bawah rata-rata nilai kelas (x̄=${classAverage})`}
                columns={[
                  { label: `< ${classAverage}`, sublabel:"Rata-Rata Kelas", value: belowClassAvg },
                  { label: `< ${classThreshold}`, sublabel:"Ambang Atas", value: betweenAvgAndThreshold },
                  { label: `≥ ${classThreshold}`, sublabel:"Ambang Atas", value: aboveThreshold },
                ]}
              />
              <ThreeBarStatCard
                titleColor="text-red-600"
                title={`${(avgBelow75+avgBetween75And84+avg84OrMore) > 0 ? ((avgBelow75 / (avgBelow75+avgBetween75And84+avg84OrMore)) * 100).toFixed(2) : "0.00"}%`}
                subtitle={`${avgBelow75} dari ${zeroD+between13D+moreThan3D}`}
                description="Siswa dengan rata-rata nilai di bawah KKM"
                columns={[
                  { label: "< 75", sublabel:"KKM", value: avgBelow75 },
                  { label: "< 84", sublabel:"Ambang Atas", value: avgBetween75And84 },
                  { label: "≥ 84", sublabel:"Ambang Atas", value: avg84OrMore },
                ]}
              />
          </div>
    
          {/* Row 4: Grade distribution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Title */}
              <h2 className="text-xl font-semibold text-blue-900 whitespace-nowrap">
                Distribusi Nilai Keseluruhan
              </h2>

              {/* Grade Legend as Card */}
              <div className="bg-white border rounded-lg p-2">
                <div className="flex items-center gap-6 flex-wrap text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-300 inline-block" />
                    <span className="font-semibold text-green-600">A</span>
                    <span>(100 - 93)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-200 inline-block" />
                    <span className="font-semibold text-green-600">B</span>
                    <span>(92 - 84)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-200 inline-block" />
                    <span className="font-semibold text-yellow-600">C</span>
                    <span>(83 - 75)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-200 inline-block" />
                    <span className="font-semibold text-red-600">D</span>
                    <span>(&lt; 75)</span>
                  </div>
                </div>
              </div>
            </div>

            <GradeDistributionChart 
                a={classDistribution?.a || 0} 
                b={classDistribution?.b || 0} 
                c={classDistribution?.c || 0} 
                d={classDistribution?.d || 0} 
            />
          </div>
    
          {/* Row 5: Data Tables */}
          <div className="flex gap-4">
            {/* Left Table */}
            <div className="basis-1/2 space-y-2">
              <h2 className="text-medium text-black font-semibold h-[40px] flex items-center">
                Berdasarkan Mata Pelajaran
              </h2>
              <DataTableDistribusiNilai
                columns={distribusiNilaiColumns}
                data={subjectDistributionAll}
              />
            </div>
    
            {/* Right Table with Select */}
            <div className="basis-1/2 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-medium text-black font-semibold h-[40px] flex items-center">
                  Berdasarkan Komponen Penilaian
                </h2>
                <div className="w-[180px]">
                  <Select defaultValue="Pengetahuan" onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pengetahuan">Pengetahuan</SelectItem>
                      <SelectItem value="Keterampilan">Keterampilan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DataTableDistribusiNilaiKomponen
                columns={distribusiNilaiKomponenColumns}
                data={filteredData}
              />
            </div>
          </div>
    
          {/* Row 6: Data Tables */}
          <div className="space-y-2">
            {/* Header with Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-blue-900">
                Ringkasan Nilai Siswa
              </h2>
              <Button asChild>
                <Link href={`/guru/kelas/rekapitulasi-nilai/${classId}`}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Lihat Rekapitulasi Nilai
                </Link>
              </Button>
            </div>
    
            {/* Tables */}
            <div className="flex gap-4">
              {/* Left Table */}
              <div className="basis-1/2 space-y-2">
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex flex-col">
                    <h2 className="text-medium text-black font-semibold">
                      10 Siswa dengan Rata-Rata Nilai Tertinggi
                    </h2>
                  </div>

                  {/* Right side: Contextual Info (e.g., percentage or filter) */}
                  <div className="text-sm font-medium text-white bg-white px-3 py-1 rounded">
                    biar rata aja #pusing
                  </div>
                </div>
                
                <DataTableDashboardSiswa
                  columns={dashboardSiswaColumns}
                  data={topStudent}
                />
              </div>
    
              {/* Right Table */}
              <div className="basis-1/2 space-y-2">
                <div className="flex items-center justify-between px-1 py-1">
                  {/* Left side: Title + Jumlah Siswa */}
                  <div className="flex flex-col">
                    <h2 className="text-medium text-black font-semibold">
                      Siswa dengan Risiko Akademik
                    </h2>
                  </div>

                  {/* Right side: Contextual Info (e.g., percentage or filter) */}
                  <div className="text-sm font-medium text-red-900 bg-red-200 px-3 py-1 rounded">
                    Jumlah Siswa: {riskStudent.length}
                  </div>
                </div>

                <DataTableDashboardSiswa
                  columns={dashboardSiswaColumns}
                  data={riskStudent}
                />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}