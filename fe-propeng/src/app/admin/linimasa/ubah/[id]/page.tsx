"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LINIMASA_UPDATED_EVENT } from "@/lib/events";

interface Angkatan {
  id: number;
  angkatan: number;
}

interface TahunAjaran {
  id: number;
  tahunAjaran: number;
}

interface MatpelOption {
  id: number;
  nama: string;
  capacity: number;
}

interface Linimasa {
  id: number;
  start_date: string;
  end_date: string;
  angkatan: number;
  submissions_count: number;
  matpel: {
    tier1_option1: { id: number; nama: string; capacity: number };
    tier1_option2: { id: number; nama: string; capacity: number };
    tier2_option1: { id: number; nama: string; capacity: number };
    tier2_option2: { id: number; nama: string; capacity: number };
    tier3_option1: { id: number; nama: string; capacity: number };
    tier3_option2: { id: number; nama: string; capacity: number };
    tier4_option1: { id: number; nama: string; capacity: number };
    tier4_option2: { id: number; nama: string; capacity: number };
  };
  status: string;
}

const formSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  angkatan: z.string(),
  tahun_ajaran: z.string(),
  matpels: z.array(z.number()),
  capacity: z.array(z.number()),
});

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

type FormData = z.infer<typeof formSchema>;

export default function UpdateLinimasa() {
  const router = useRouter();
  const params = useParams();
  const linimasaId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [linimasa, setLinimasa] = useState<Linimasa | null>(null);
  const [matpelOptions, setMatpelOptions] = useState<MatpelOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMatpel, setLoadingMatpel] = useState<boolean>(true);
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<{ value: string; label: string; }[]>([]);
  const [loadingTahunAjaran, setLoadingTahunAjaran] = useState<boolean>(true);
  const [angkatanOptions, setAngkatanOptions] = useState<{ value: string; label: string; }[]>([]);
  const [loadingAngkatan, setLoadingAngkatan] = useState<boolean>(true);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>("");
  const [hasSubmissions, setHasSubmissions] = useState<boolean>(false);
  
  const [isFormValid, setIsFormValid] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      start_date: "",
      end_date: "",
      angkatan: "",
      tahun_ajaran: "",
      matpels: Array(8).fill(0),
      capacity: Array(8).fill(30),
    },
  });

  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  const angkatan = form.watch("angkatan");
  const tahunAjaran = form.watch("tahun_ajaran");
  const matpels = form.watch("matpels");

  useEffect(() => {
    const hasBasicFields = !!(startDate && endDate && angkatan && tahunAjaran);
    const hasAllMatpels = matpels.every(m => m > 0);
    
    console.log("Form validity check:", {
      hasBasicFields,
      hasAllMatpels,
      matpels
    });
    
    setIsFormValid(hasBasicFields && hasAllMatpels);
  }, [startDate, endDate, angkatan, tahunAjaran, matpels]);

  const isMatpelSelectedElsewhere = (matpelId: number, currentIndex: number) => {
    const currentMatpels = form.getValues("matpels");
    return currentMatpels.some((id, idx) => idx !== currentIndex && id === matpelId);
  };

  const handleMatpelChange = (index: number, matpelId: number) => {
    console.log(`Setting matpel at index ${index} to ${matpelId}`);
    const newMatpels = [...form.getValues("matpels")];
    newMatpels[index] = matpelId;
    form.setValue("matpels", newMatpels);
  };

  useEffect(() => {
    const fetchLinimasaData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          console.error("Token tidak tersedia.");
          router.push("/login");
          return;
        }

        console.log("Fetching linimasa data with ID:", linimasaId);
        
        const response = await fetch(`/api/linimasa/get`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token} id ${linimasaId}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.status === 200 && Array.isArray(data.data) && data.data.length > 0) {
          const linimasaData = data.data.find((item: any) => item.id.toString() === linimasaId);
          
          if (linimasaData) {
            console.log("Found linimasa data:", linimasaData);
            setLinimasa(linimasaData);
            setHasSubmissions(linimasaData.submissions_count > 0);
            
            form.setValue("start_date", linimasaData.start_date);
            form.setValue("end_date", linimasaData.end_date);
            
            form.setValue("angkatan", linimasaData.angkatan.toString());
            
            if (linimasaData.tahun_ajaran !== undefined) {
              form.setValue("tahun_ajaran", linimasaData.tahun_ajaran.toString());
              setSelectedTahunAjaran(linimasaData.tahun_ajaran.toString());
            }
            
            const matpels = [
              linimasaData.matpel.tier1_option1.id,
              linimasaData.matpel.tier1_option2.id,
              linimasaData.matpel.tier2_option1.id,
              linimasaData.matpel.tier2_option2.id,
              linimasaData.matpel.tier3_option1.id,
              linimasaData.matpel.tier3_option2.id,
              linimasaData.matpel.tier4_option1.id,
              linimasaData.matpel.tier4_option2.id,
            ];
            
            const capacities = [
              linimasaData.matpel.tier1_option1.capacity,
              linimasaData.matpel.tier1_option2.capacity,
              linimasaData.matpel.tier2_option1.capacity,
              linimasaData.matpel.tier2_option2.capacity,
              linimasaData.matpel.tier3_option1.capacity,
              linimasaData.matpel.tier3_option2.capacity,
              linimasaData.matpel.tier4_option1.capacity,
              linimasaData.matpel.tier4_option2.capacity,
            ];
            
            form.setValue("matpels", matpels);
            form.setValue("capacity", capacities);
            
            setError(null);
          } else {
            throw new Error("Linimasa dengan ID tersebut tidak ditemukan");
          }
        } else {
          throw new Error(data.message || "Gagal mengambil data linimasa");
        }
      } catch (err: any) {
        console.error("Error fetching linimasa data:", err);
        setError("Gagal mengambil data linimasa: " + err.message);
        customToast.error("Gagal mengambil data", err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (linimasaId) {
      fetchLinimasaData();
    }
  }, [linimasaId, router, form]);

  useEffect(() => {
    const fetchTahunAjaranOptions = async () => {
      setLoadingTahunAjaran(true);
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          console.error("Token tidak tersedia.");
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/linimasa/exist-tahun-ajaran/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();
        console.log("Tahun ajaran options API response:", data);

        if (data.status === 200) {
          const options = data.data.map((tahunAjaran: TahunAjaran) => ({
            value: tahunAjaran.id.toString(),
            label: tahunAjaran.tahunAjaran.toString(),
          }));
          
          console.log("Mapped tahun ajaran options:", options);
          setTahunAjaranOptions(options);
          
          if (!form.getValues("tahun_ajaran") && options.length > 0) {
            const defaultTahunAjaran = options[0].value;
            console.log("Setting default tahun ajaran:", defaultTahunAjaran);
            form.setValue("tahun_ajaran", defaultTahunAjaran);
            setSelectedTahunAjaran(defaultTahunAjaran);
          } else {
            console.log("Keeping existing tahun ajaran:", form.getValues("tahun_ajaran"));
          }
          
          setError(null);
        } else {
          throw new Error(data.message || "Gagal mendapatkan daftar tahun ajaran");
        }
      } catch (err: any) {
        console.error("Error fetching tahun ajaran options:", err);
        customToast.error("Gagal mengambil data tahun ajaran", err.message);
        setError("Gagal mengambil data tahun ajaran: " + err.message);
      } finally {
        setLoadingTahunAjaran(false);
      }
    };

    fetchTahunAjaranOptions();
  }, [router, form]);

  useEffect(() => {
    const fetchAngkatanOptions = async () => {
      setLoadingAngkatan(true);
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          console.error("Token tidak tersedia.");
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/linimasa/angkatan/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();
        console.log("Angkatan options API response:", data);

        if (data.status === 200) {
          const options = data.data.map((angkatan: Angkatan) => ({
            value: angkatan.id.toString(),
            label: angkatan.angkatan.toString(),
          }));
          
          console.log("Mapped angkatan options:", options);
          setAngkatanOptions(options);
          
          if (!form.getValues("angkatan") && options.length > 0) {
            console.log("Setting default angkatan:", options[0].value);
            form.setValue("angkatan", options[0].value);
          } else {
            console.log("Keeping existing angkatan:", form.getValues("angkatan"));
          }
          
          setError(null);
        } else {
          throw new Error(data.message || "Gagal mendapatkan daftar angkatan");
        }
      } catch (err: any) {
        console.error("Error fetching angkatan options:", err);
        customToast.error("Gagal mengambil data angkatan", err.message);
        setError("Gagal mengambil data angkatan: " + err.message);
      } finally {
        setLoadingAngkatan(false);
      }
    };

    fetchAngkatanOptions();
  }, [router, form]);

  useEffect(() => {
    const fetchMatpelOptions = async () => {
      if (!selectedTahunAjaran) {
        console.log("No tahun ajaran selected, skipping matpel fetch");
        return;
      }
      
      console.log("Fetching matpel options for tahun ajaran:", selectedTahunAjaran);
      setLoadingMatpel(true);
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          console.error("Token tidak tersedia.");
          router.push("/login");
          return;
        }
        
        const response = await fetch(`/api/linimasa/tahun-ajaran/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token} tahunAjaran ${selectedTahunAjaran}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();
        console.log("Matpel options API response:", data);

        if (data.status === 200) {
          console.log("Setting matpel options:", data.data);
          setMatpelOptions(data.data || []);
          
          const currentMatpels = form.getValues("matpels");
          console.log("Current matpels values:", currentMatpels);
          
          setError(null);
        } else if (data.status === 404) {
          setMatpelOptions([]);
          customToast.warning("Tidak ada mata pelajaran yang tersedia", "Tambahkan mata pelajaran terlebih dahulu.");
        } else {
          throw new Error(data.message || "Gagal mendapatkan daftar mata pelajaran");
        }
      } catch (err: any) {
        console.error("Error fetching matpel options:", err);
        customToast.error("Gagal mengambil data mata pelajaran", err.message);
        setError("Gagal mengambil data mata pelajaran: " + err.message);
      } finally {
        setLoadingMatpel(false);
      }
    };

    fetchMatpelOptions();
  }, [router, form, selectedTahunAjaran]);

  // Function to filter out already selected mata pelajaran options
  const getFilteredOptions = (currentFieldIndex: number) => {
    const allSelectedValues = form.getValues("matpels");
    console.log(`Filtering options for field ${currentFieldIndex}. All selected:`, allSelectedValues);
    
    // Filter matpels that aren't selected in other fields
    return matpelOptions.filter(option => {
      // If this option is already selected in the current field, allow it
      if (allSelectedValues[currentFieldIndex] === option.id) {
        return true;
      }
      
      // Otherwise, check if it's selected in any other field
      const isSelectedElsewhere = allSelectedValues.some((value, index) => 
        index !== currentFieldIndex && 
        value !== null && 
        value !== undefined && 
        value > 0 && 
        value === option.id
      );
      
      return !isSelectedElsewhere;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      customToast.error("Validasi Gagal", "Harap lengkapi semua field dan pilih semua mata pelajaran");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formValues = form.getValues();
      
      const startDateObj = new Date(formValues.start_date);
      const endDateObj = new Date(formValues.end_date);
      
      if (startDateObj.getTime() === endDateObj.getTime()) {
        customToast.error("Validasi Gagal", "Tanggal mulai dan tanggal selesai tidak boleh sama");
        setIsSubmitting(false);
        return;
      }
      
      if (endDateObj < startDateObj) {
        customToast.error("Validasi Gagal", "Tanggal selesai tidak boleh lebih awal dari tanggal mulai");
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      if (!token) {
        console.error("Token tidak tersedia.");
        router.push("/login");
        return;
      }

      const requestBody = {
        id: parseInt(linimasaId),
        start_date: formValues.start_date,
        end_date: formValues.end_date,
        angkatan: parseInt(formValues.angkatan),
        matpels: formValues.matpels,
        capacity: formValues.capacity,
      };

      console.log("Sending update request:", requestBody);

      const response = await fetch(`/api/linimasa/ubah/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log("Update response:", responseData);

      if (response.ok && (responseData.status === 200 || responseData.status === 201)) {
        customToast.success("Berhasil Memperbarui Linimasa", "Linimasa berhasil diperbarui");
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(LINIMASA_UPDATED_EVENT));
        }
        
        setTimeout(() => {
          router.push("/admin/linimasa");
        }, 1500);
      } else {
        if (responseData.status === 400 && responseData.message) {
          throw new Error(responseData.message + (responseData.error ? `: ${responseData.error}` : ""));
        } else {
          throw new Error(responseData.message || "Gagal memperbarui linimasa");
        }
      }
    } catch (err: any) {
      console.error("Gagal Memperbarui Linimasa:", err);
      customToast.error("Gagal Memperbarui Linimasa", err.message || "Terjadi kesalahan saat memperbarui linimasa");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Memuat data...</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle>Edit Linimasa Pendaftaran
          Mata Pelajaran Minat</CardTitle>
          <CardDescription>Perbarui Kegiatan Seleksi untuk pemilihan mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
          )}
          {hasSubmissions && (
            <div className="mb-4 p-4 bg-amber-50 text-amber-700 rounded border border-amber-200">
              <p className="font-medium">Perhatian!</p>
              <p>Linimasa ini sudah memiliki pendaftaran. Mengubah mata pelajaran tidak dianjurkan.</p>
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start space-y-2">
                      <FormLabel>Tanggal Mulai *</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), "PPP")
                                : <span>Pilih tanggal</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={date => {
                                if (date) {
                                  const localDate = new Date(date.setHours(12));
                                  const formattedDate = 
                                    `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                                  
                                  const currentEndDate = form.getValues("end_date");
                                  
                                  if (currentEndDate) {
                                    // Check if new start date is after end date
                                    const startDate = new Date(formattedDate);
                                    const endDate = new Date(currentEndDate);
                                    
                                    if (startDate >= endDate) {
                                      customToast.error("Validasi Tanggal", "Tanggal mulai tidak boleh sama atau setelah tanggal selesai");
                                    } else {
                                      field.onChange(formattedDate);
                                    }
                                  } else {
                                    field.onChange(formattedDate);
                                  }
                                } else {
                                  field.onChange("");
                                }
                              }}
                              initialFocus
                              fromDate={new Date()}
                            /> 
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start space-y-2">
                      <FormLabel>Tanggal Selesai *</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), "PPP")
                                : <span>Pilih tanggal</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={date => {
                                if (date) {
                                  const localDate = new Date(date.setHours(12));
                                  const formattedDate = 
                                    `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                                  field.onChange(formattedDate);
                                } else {
                                  field.onChange("");
                                }
                              }}
                              initialFocus
                              fromDate={
                                form.watch("start_date")
                                  ? (() => {
                                      const minDate = new Date(form.watch("start_date"));
                                      minDate.setDate(minDate.getDate() + 1);
                                      return minDate;
                                    })()
                                  : new Date()
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="angkatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Angkatan *</FormLabel>
                      {loadingAngkatan ? (
                        <div className="text-sm text-gray-500">Memuat data angkatan...</div>
                      ) : angkatanOptions.length === 0 ? (
                        <div className="text-sm text-amber-600">Tidak ada data angkatan tersedia</div>
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={hasSubmissions}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih angkatan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {angkatanOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tahun_ajaran"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Ajaran *</FormLabel>
                      {loadingTahunAjaran ? (
                        <div className="text-sm text-gray-500">Memuat data tahun ajaran...</div>
                      ) : tahunAjaranOptions.length === 0 ? (
                        <div className="text-sm text-amber-600">Tidak ada data tahun ajaran tersedia</div>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTahunAjaran(value);
                          }}
                          value={field.value}
                          disabled={hasSubmissions}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun ajaran" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tahunAjaranOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pilihan Mata Pelajaran</h3>
                {loadingMatpel ? (
                  <div className="text-center py-4">Memuat data mata pelajaran...</div>
                ) : matpelOptions.length === 0 ? (
                  <div className="text-center py-4 text-amber-600">
                    Tidak ada mata pelajaran yang tersedia untuk tahun ajaran ini. Silakan tambahkan mata pelajaran terlebih dahulu.
                  </div>
                ) : (
                  <>
                    {/* Display mata pelajaran options vertically */}
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="space-y-4">
                          <h4 className="font-medium">Pilihan Pelajaran Peminatan {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`matpels.${index * 2}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mata Pelajaran Peminatan {index * 2 + 1} *</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      handleMatpelChange(index * 2, parseInt(value));
                                    }}
                                    value={field.value.toString()}
                                    disabled={hasSubmissions}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Pilih mata pelajaran" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getFilteredOptions(index * 2).map((matpel) => (
                                        <SelectItem
                                          key={matpel.id}
                                          value={matpel.id.toString()}
                                        >
                                          {matpel.nama}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`capacity.${index * 2}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kapasitas Mata Pelajaran Peminatan {index * 2 + 1} *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        // Ensure value is at least 1 and at most 50
                                        if (value < 1) {
                                          customToast.error("Nilai Kapasitas", "Kapasitas minimum adalah 1");
                                          field.onChange(1);
                                        } else if (value > 100) {
                                          customToast.error("Nilai Kapasitas", "Kapasitas maksimum adalah 100");
                                          field.onChange(100);
                                        } else {
                                          field.onChange(value);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Second subject for each peminatan */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={form.control}
                              name={`matpels.${index * 2 + 1}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mata Pelajaran Peminatan {index * 2 + 2} *</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      handleMatpelChange(index * 2 + 1, parseInt(value));
                                    }}
                                    value={field.value.toString()}
                                    disabled={hasSubmissions}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Pilih mata pelajaran" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getFilteredOptions(index * 2 + 1).map((matpel) => (
                                        <SelectItem
                                          key={matpel.id}
                                          value={matpel.id.toString()}
                                        >
                                          {matpel.nama}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`capacity.${index * 2 + 1}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kapasitas Mata Pelajaran Peminatan {index * 2 + 2} *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        // Ensure value is at least 1 and at most 50
                                        if (value < 1) {
                                          customToast.error("Nilai Kapasitas", "Kapasitas minimum adalah 1");
                                          field.onChange(1);
                                        } else if (value > 100) {
                                          customToast.error("Nilai Kapasitas", "Kapasitas maksimum adalah 100");
                                          field.onChange(100);
                                        } else {
                                          field.onChange(value);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-between items-center gap-2 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.back()} // Kembali ke halaman sebelumnya
                >
                  Kembali
                </Button>

                <Button
                  variant="default"
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
