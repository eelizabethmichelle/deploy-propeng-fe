'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons";

// Define custom toast for consistent styling
const customToast = {
  success: (title: string, description: string) => {
    toast.success(title, {
      description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
    });
  },
  error: (title: string, description: string) => {
    toast.error(title, {
      description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
    });
  },
  warning: (title: string, description: string) => {
    toast.warning(title, {
      description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
    });
  }
};

interface TeacherData {
  id: number;
  name: string;
}

interface SubjectData {
  id: number;
  nama: string;
  kategoriMatpel: string;
  tahunAjaran: number;
  angkatan: number;
  teacher: TeacherData;
}

interface EvaluationQuestion {
  id: number;
  variable: string;
  variableId: number;
  indicator: string;
  indicatorId: number;
  category: string;
}

export default function TeacherEvaluationForm() {
  const router = useRouter();
  const params = useParams();
  const mataPelajaranId = params.id as string;
  
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState('');

  // Evaluation questions organized by category
  const evaluationQuestions: EvaluationQuestion[] = [
    // Materi Pelajaran (Variable 1)
    {
      id: 1,
      variable: 'Materi Pelajaran',
      variableId: 1,
      indicator: 'Guru menyampaikan rancangan pengajaran dengan jelas di awal semester.',
      indicatorId: 1,
      category: 'Materi Pelajaran'
    },
    {
      id: 2,
      variable: 'Materi Pelajaran',
      variableId: 1,
      indicator: 'Tersedia berbagai sumber pembelajaran yang memudahkan saya memahami materi.',
      indicatorId: 2,
      category: 'Materi Pelajaran'
    },
    // Proses Pembelajaran (Variable 2)
    {
      id: 3,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru menyampaikan materi pelajaran dengan cara yang mudah dipahami.',
      indicatorId: 1,
      category: 'Proses Pembelajaran'
    },
    {
      id: 4,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru menciptakan suasana kelas yang kondusif untuk belajar.',
      indicatorId: 2,
      category: 'Proses Pembelajaran'
    },
    {
      id: 5,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru memberikan contoh yang membantu memahami konsep yang sulit.',
      indicatorId: 3,
      category: 'Proses Pembelajaran'
    },
    {
      id: 6,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru menjawab pertanyaan siswa dengan jelas.',
      indicatorId: 4,
      category: 'Proses Pembelajaran'
    },
    {
      id: 7,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru membantu siswa yang kesulitan dengan memberikan umpan balik yang konstruktif.',
      indicatorId: 5,
      category: 'Proses Pembelajaran'
    },
    {
      id: 8,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru menggunakan metode pengajaran yang bervariasi dan menarik.',
      indicatorId: 6,
      category: 'Proses Pembelajaran'
    },
    {
      id: 9,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru mendorong siswa untuk berpikir kritis dan mengembangkan kemampuan analitis.',
      indicatorId: 7,
      category: 'Proses Pembelajaran'
    },
    {
      id: 10,
      variable: 'Proses Pembelajaran',
      variableId: 2,
      indicator: 'Guru menerima kritik dan saran dari siswa.',
      indicatorId: 8,
      category: 'Proses Pembelajaran'
    },
    // Sikap dan Kepribadian Guru (Variable 3)
    {
      id: 11,
      variable: 'Sikap dan Kepribadian Guru',
      variableId: 3,
      indicator: 'Guru menunjukkan sikap menghargai dan sopan terhadap siswa.',
      indicatorId: 1,
      category: 'Sikap dan Kepribadian Guru'
    },
    {
      id: 12,
      variable: 'Sikap dan Kepribadian Guru',
      variableId: 3,
      indicator: 'Guru menunjukkan antusiasme dalam mengajar.',
      indicatorId: 2,
      category: 'Sikap dan Kepribadian Guru'
    },
    // Evaluasi Pembelajaran (Variable 4)
    {
      id: 13,
      variable: 'Evaluasi Pembelajaran',
      variableId: 4,
      indicator: 'Materi penilaian (kuis, tugas, UTS, UAS, dll) sesuai dengan rancangan pengajaran yang disampaikan di awal semester.',
      indicatorId: 1,
      category: 'Evaluasi Pembelajaran'
    },
    {
      id: 14,
      variable: 'Evaluasi Pembelajaran',
      variableId: 4,
      indicator: 'Bobot penilaian setiap komponen penilaian sesuai dengan beban pengerjaannya.',
      indicatorId: 2,
      category: 'Evaluasi Pembelajaran'
    },
    {
      id: 15,
      variable: 'Evaluasi Pembelajaran',
      variableId: 4,
      indicator: 'Guru memberikan umpan balik terhadap tugas dan evaluasi.',
      indicatorId: 3,
      category: 'Evaluasi Pembelajaran'
    },
  ];

  // Check if student has already filled this evaluation
  useEffect(() => {
    const checkEvaluationStatus = async () => {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      try {
        const response = await fetch(`/api/evalguru/siswa/cek`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken} ${mataPelajaranId}`
          }
        });
        
        // If response is OK, student has already filled this evaluation
        if (response.ok) {
          setAlreadySubmitted(true);
          customToast.success(
            "Evaluasi Sudah Terkirim", 
            "Anda sudah mengisi evaluasi untuk mata pelajaran ini"
          );
        }
      } catch (error) {
        console.error("Error checking evaluation status:", error);
      }
    };
    
    checkEvaluationStatus();
  }, [mataPelajaranId]);

  // Fetch subject data when component mounts
  useEffect(() => {
    const fetchSubjectData = async () => {
      setIsLoading(true);
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      try {
        const response = await fetch(`/api/mata-pelajaran/detail`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken} id ${mataPelajaranId}`
          }
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || "Gagal mengambil data mata pelajaran");
        }
        
        setSubjectData(responseData.data);
      } catch (error) {
        console.error("Error fetching subject data:", error);
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data.";
        customToast.error("Gagal Memuat Data", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubjectData();
  }, [mataPelajaranId]);

  const handleRatingChange = (questionId: number, value: number) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions have been answered
    const unansweredQuestions = evaluationQuestions.filter(q => !ratings[q.id]);
    
    if (unansweredQuestions.length > 0) {
      customToast.warning(
        "Mohon Lengkapi Semua Pertanyaan", 
        "Semua pertanyaan dengan tanda (*) wajib dijawab"
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      if (!accessToken) {
        console.error("Token tidak tersedia");
        router.push("/login");
        return;
      }
      
      // Format the data according to the required structure
      const isian: { [key: string]: { [key: string]: number } } = {};
      
      // Group by variableId
      evaluationQuestions.forEach(question => {
        if (!isian[question.variableId]) {
          isian[question.variableId] = {};
        }
        
        isian[question.variableId][question.indicatorId] = ratings[question.id];
      });
      
      // Prepare the payload
      const payload = {
        isian: isian,
        kritik_saran: feedback,
        matapelajaran_id: parseInt(mataPelajaranId)
      };
      
      // Send the evaluation
      const response = await fetch("/api/evalguru/siswa/buat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Gagal mengirim evaluasi");
      }
      
      // Evaluation submitted successfully
      customToast.success(
        "Berhasil Dikirim!", 
        "Terima kasih atas penilaian dan masukan Anda"
      );
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push("/profil");
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim evaluasi.";
      customToast.error("Gagal Mengirim Evaluasi", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group questions by category for display
  const questionsByCategory = evaluationQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as {[key: string]: EvaluationQuestion[]});

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  // If already submitted, show only a message instead of the form
  if (alreadySubmitted) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircledIcon className="h-5 w-5 text-green-600" />
              <CardTitle>Evaluasi Sudah Terkirim</CardTitle>
            </div>
            <CardDescription>
              Anda sudah mengisi evaluasi untuk mata pelajaran ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjectData && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700">{subjectData.teacher.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                  <span>{subjectData.nama}</span>
                  <span className="mx-2 border-l border-gray-300"></span>
                  <span>Angkatan {subjectData.angkatan}</span>
                  <span className="mx-2 border-l border-gray-300"></span>
                  <span>Tahun Ajaran {subjectData.tahunAjaran}/{subjectData.tahunAjaran + 1}</span>
                </div>
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Terima kasih atas partisipasi Anda dalam memberikan evaluasi untuk pengajar dan mata pelajaran ini.
              Masukan Anda sangat berharga untuk meningkatkan kualitas pembelajaran.
            </p>
            <Button 
              onClick={() => router.push('/siswa/dashboard')}
              className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-md"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the full form if not submitted yet
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Form Evaluasi Guru</h1>
          {subjectData && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-700">{subjectData.teacher.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                <span>{subjectData.nama}</span>
                <span className="hidden sm:inline mx-2 border-l border-gray-300"></span>
                <span>Angkatan {subjectData.angkatan}</span>
                <span className="hidden sm:inline mx-2 border-l border-gray-300"></span>
                <span>Tahun Ajaran {subjectData.tahunAjaran}/{subjectData.tahunAjaran + 1}</span>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {Object.entries(questionsByCategory).map(([category, questions]) => (
            <div key={category} className="mb-8">
              <div className="text-lg font-semibold mb-2 pb-2 border-b border-gray-200">
                {category}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Skala Penilaian (1 Sangat Tidak setuju, 5 Sangat Setuju)
              </div>
              
              {/* Mobile layout - stack items vertically */}
              <div className="block md:hidden">
                {questions.map((question, idx) => (
                  <div key={question.id} className="mb-6 border rounded-md p-4">
                    <div className="flex items-start mb-3">
                      <span className="bg-muted/50 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm">{question.indicator} <span className="text-red-500">*</span></p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <RadioGroup 
                        className="flex justify-between px-2"
                        value={ratings[question.id]?.toString() || ""}
                        onValueChange={(value) => handleRatingChange(question.id, Number(value))}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={value} className="flex flex-col items-center">
                            <RadioGroupItem 
                              value={value.toString()} 
                              id={`q${question.id}-m-${value}`}
                            />
                            <label 
                              htmlFor={`q${question.id}-m-${value}`} 
                              className="text-sm font-medium mt-1"
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop layout - table */}
              <div className="hidden md:block rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th scope="col" className="h-12 w-12 px-4 text-left font-medium text-muted-foreground">
                        No
                      </th>
                      <th scope="col" className="h-12 px-4 text-left font-medium text-muted-foreground">
                        Variabel Penilaian
                      </th>
                      <th scope="col" className="h-12 px-4 text-center font-medium text-muted-foreground">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {questions.map((question, idx) => (
                      <tr key={question.id} className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle text-center font-medium">{idx + 1}</td>
                        <td className="p-4 align-middle">
                          {question.indicator} <span className="text-red-500">*</span>
                        </td>
                        <td className="p-4 align-middle">
                          <RadioGroup 
                            className="flex justify-center gap-4"
                            value={ratings[question.id]?.toString() || ""}
                            onValueChange={(value) => handleRatingChange(question.id, Number(value))}
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <div key={value} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={value.toString()} 
                                  id={`q${question.id}-d-${value}`}
                                />
                                <label 
                                  htmlFor={`q${question.id}-d-${value}`} 
                                  className="text-sm font-medium"
                                >
                                  {value}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          <div className="mt-8">
            <label htmlFor="feedback" className="block mb-2 text-sm font-medium text-gray-700">
              Kritik dan Saran
            </label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Masukkan kritik dan saranmu di sini..."
              rows={5}
              className="w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-2 order-2 sm:order-1"
            >
              Kembali
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-md order-1 sm:order-2"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Evaluasi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
