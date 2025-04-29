"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_BASE_URL } from "@/lib/api";
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
import { SelectPills } from "@/components/ui/multiple-select";
import { Plus, ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import React from "react";
import { LINIMASA_UPDATED_EVENT } from "@/lib/events";

interface DataGuru {
  id: string;
  name: string;
  username?: string;
  nisp?: string;
  status?: boolean ;
}

interface Angkatan {
  id: number;
  angkatan: number;
}

interface TahunAjaran {
  id: number;
  tahunAjaran: number;
}

interface DataSiswa {
  id: string;
  name: string;
  nisn?: string;
  username?: string;
  angkatan: number;
}

interface MatpelOption {
  id: number;
  nama: string;
  capacity: number;
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

export default function CreateLinimasa() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [matpelOptions, setMatpelOptions] = useState<MatpelOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMatpel, setLoadingMatpel] = useState<boolean>(true);
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<{ value: string; label: string; }[]>([]);
  const [loadingTahunAjaran, setLoadingTahunAjaran] = useState<boolean>(true);
  const [angkatanOptions, setAngkatanOptions] = useState<{ value: string; label: string; }[]>([]);
  const [loadingAngkatan, setLoadingAngkatan] = useState<boolean>(true);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>("");
  
  // Create simple state for form validation
  const [isFormValid, setIsFormValid] = useState(false);

  // Simple form without complex validation
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

  // Watch all necessary fields for validation
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  const angkatan = form.watch("angkatan");
  const tahunAjaran = form.watch("tahun_ajaran");
  const matpels = form.watch("matpels");

  // Simple effect to check form validity
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

  // Fetch tahun ajaran options from API
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

        // Jika token tidak valid, logout user
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (data.status === 200) {
          const options = data.data.map((tahunAjaran: TahunAjaran) => ({
            value: tahunAjaran.id.toString(),
            label: tahunAjaran.tahunAjaran.toString(),
          }));
          setTahunAjaranOptions(options);
          
          if (options.length > 0) {
            const defaultTahunAjaran = options[0].value;
            form.setValue("tahun_ajaran", defaultTahunAjaran);
            setSelectedTahunAjaran(defaultTahunAjaran);
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

  // Fetch angkatan options from API
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

        // Jika token tidak valid, logout user
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (data.status === 200) {
          const options = data.data.map((angkatan: Angkatan) => ({
            value: angkatan.id.toString(),
            label: angkatan.angkatan.toString(),
          }));
          setAngkatanOptions(options);
          
          if (options.length > 0) {
            form.setValue("angkatan", options[0].value);
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

  // Fetch available matpel options based on tahun ajaran
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

        console.log("Making API request to:", `/api/linimasa/tahun-ajaran/${selectedTahunAjaran}/`);
        
        const response = await fetch(`/api/linimasa/tahun-ajaran/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token} tahunAjaran ${selectedTahunAjaran}`,
            "Content-Type": "application/json",
          },
        });

        // Jika token tidak valid, logout user
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }

        const data = await response.json();
        console.log("API response:", data);

        if (data.status === 200) {
          setMatpelOptions(data.data || []);
          
          // Jika ada mata pelajaran yang tersedia, atur default untuk setiap tier
          // Removed auto-filling code to let users manually select mata pelajaran
          // if (data.data && data.data.length > 0) {
          //   const defaultMatpels = Array(8).fill(data.data[0].id);
          //   form.setValue("matpels", defaultMatpels);
          // }
          
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

  // Helper functions for mata pelajaran selection
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

  // Simplified submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission if form is valid
    if (!isFormValid) {
      customToast.error("Validasi Gagal", "Harap lengkapi semua field dan pilih semua mata pelajaran");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formValues = form.getValues();
      
      // Simple date validation
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
        start_date: formValues.start_date,
        end_date: formValues.end_date,
        angkatan: formValues.angkatan,
        matpels: formValues.matpels,
        capacity: formValues.capacity,
      };

      console.log("Payload yang dikirim:", requestBody);

      const response = await fetch(`/api/linimasa/tambah/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log("Create response:", responseData);

      if (response.ok && (responseData.status === 200 || responseData.status === 201)) {
        customToast.success("Berhasil Membuat Linimasa", "Linimasa berhasil dibuat");
        
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
          throw new Error(responseData.message || "Gagal membuat linimasa");
        }
      }
    } catch (err: any) {
      console.error("Gagal Membuat Linimasa:", err);
      customToast.error("Gagal Membuat Linimasa", err.message || "Terjadi kesalahan saat membuat linimasa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle>Tambah Linimasa Pendaftaran
          Mata Pelajaran Minat</CardTitle>
          <CardDescription>Buat linimasa baru untuk pemilihan mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
          )}
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Mulai */}
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
                                  field.onChange(formattedDate);
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

                {/* Tanggal Selesai */}
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
                                      // Add 1 day to start_date
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
                {/* Angkatan */}
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

                {/* Tahun Ajaran */}
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
                            console.log("Tahun ajaran selected:", value);
                            field.onChange(value);
                            setSelectedTahunAjaran(value);
                          }}
                          value={field.value}
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

              {/* Mata Pelajaran Selection */}
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
                    {/* Display mata pelajaran options in pairs */}
                    {Array.from({ length: 4 }).map((_, pairIndex) => (
                      <div key={pairIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                        {/* First option in the pair */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Opsi 1</h4>
                          <FormField
                            control={form.control}
                            name={`matpels.${pairIndex * 2}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mata Pelajaran {pairIndex * 2 + 1} *</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    handleMatpelChange(pairIndex * 2, parseInt(value));
                                  }}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih mata pelajaran" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getFilteredOptions(pairIndex * 2).map((matpel) => (
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
                            name={`capacity.${pairIndex * 2}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kapasitas {pairIndex * 2 + 1} *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      // Ensure value is at least 1
                                      field.onChange(value < 1 ? 1 : value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Second option in the pair */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Opsi 2</h4>
                          <FormField
                            control={form.control}
                            name={`matpels.${pairIndex * 2 + 1}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mata Pelajaran {pairIndex * 2 + 2} *</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    handleMatpelChange(pairIndex * 2 + 1, parseInt(value));
                                  }}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih mata pelajaran" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getFilteredOptions(pairIndex * 2 + 1).map((matpel) => (
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
                            name={`capacity.${pairIndex * 2 + 1}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kapasitas {pairIndex * 2 + 2} *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      // Ensure value is at least 1
                                      field.onChange(value < 1 ? 1 : value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Container untuk Tombol */}
              <div className="flex justify-between items-center gap-2 pt-4">
                {/* Tombol Kembali */}
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.back()} // Kembali ke halaman sebelumnya
                >
                  Kembali
                </Button>

                {/* Tombol Simpan */}
                <Button
                  variant="default"
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {isSubmitting 
                    ? "Menyimpan..." 
                    : !isFormValid 
                      ? "Lengkapi Semua Data" 
                      : "Buat Linimasa"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}