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
import { Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

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
  start_date: z.string().min(1, { message: "Tanggal mulai wajib diisi" }),
  end_date: z.string().min(1, { message: "Tanggal selesai wajib diisi" }),
  angkatan: z.string().min(1, { message: "Angkatan wajib dipilih" }),
  tahun_ajaran: z.string().min(1, { message: "Tahun ajaran wajib dipilih" }),
  matpels: z.array(z.number()).length(8, { message: "Harus memilih 8 mata pelajaran" }),
  capacity: z.array(z.number().min(1, { message: "Kapasitas minimal 1" })).length(8, { message: "Harus mengisi kapasitas untuk 8 mata pelajaran" }),
}).refine((data) => {
  // Check if start_date and end_date are not the same
  if (data.start_date === data.end_date) {
    return false;
  }
  return true;
}, {
  message: "Tanggal mulai dan tanggal selesai tidak boleh sama",
  path: ["end_date"],
}).refine((data) => {
  // Check if end_date is not earlier than start_date
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return endDate >= startDate;
  }
  return true;
}, {
  message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
  path: ["end_date"],
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      angkatan: "",
      tahun_ajaran: "",
      matpels: Array(8).fill(0),
      capacity: Array(8).fill(30),
    },
  });

  const selectedAngkatan = form.watch("angkatan");

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
          
          // Set default tahun ajaran if available
          if (options.length > 0) {
            form.setValue("tahun_ajaran", options[0].value);
            setSelectedTahunAjaran(options[0].value);
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
          
          // Set default angkatan if available
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
          if (data.data && data.data.length > 0) {
            const defaultMatpels = Array(8).fill(data.data[0].id);
            form.setValue("matpels", defaultMatpels);
          }
          
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Additional validation for dates
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (startDate.getTime() === endDate.getTime()) {
        customToast.error("Validasi Gagal", "Tanggal mulai dan tanggal selesai tidak boleh sama");
        setIsSubmitting(false);
        return;
      }
      
      if (endDate < startDate) {
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
        start_date: data.start_date,
        end_date: data.end_date,
        angkatan: data.angkatan,
        matpels: data.matpels,
        capacity: data.capacity,
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
      console.log("Response data:", responseData);

      if (response.ok) {
        customToast.success("Berhasil Membuat Kegiatan Seleksi", "Kegiatan Seleksi berhasil dibuat");
        setTimeout(() => {
          router.push("/admin/linimasa");
        }, 1500);
      } else {
        throw new Error(responseData.message || "Gagal membuat Kegiatan Seleksi");
      }
    } catch (err: any) {
      console.error("Gagal Membuat Kegiatan Seleksi:", err);
      toast.error("Gagal Membuat Event", {
        description: err.message || "Terjadi kesalahan saat membuat Kegiatan Seleksi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle>Tambah Linimasa Pengajuan
          Mata Pelajaran Minat</CardTitle>
          <CardDescription>Buat Kegiatan Seleksi baru untuk pemilihan mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Mulai */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mulai *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                        />
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
                    <FormItem>
                      <FormLabel>Tanggal Selesai *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          min={form.watch("start_date") || new Date().toISOString().split('T')[0]} // Set min date to start_date if selected
                        />
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
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih mata pelajaran" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {matpelOptions.map((matpel) => (
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
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih mata pelajaran" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {matpelOptions.map((matpel) => (
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
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Button>

                {/* Tombol Simpan */}
                <Button
                  variant="default"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {isSubmitting ? "Menyimpan..." : "Buat Kegiatan Seleksi"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}