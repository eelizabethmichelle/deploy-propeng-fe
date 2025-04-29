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
import { Plus } from "lucide-react";

interface DataGuru {
  id: string;
  name: string;
  username?: string;
  nisp?: string;
  status?: boolean ;
}

interface Angkatan {
  angkatan: number;
}

interface DataSiswa {
  id: string;
  name: string;
  nisn?: string;
  username?: string;
  angkatan: number;
}

const formSchema = z.object({
  namaPelajaran: z.string().min(1, { message: "Nama pelajaran wajib diisi" }),
  kategoriMatpel: z.enum(["Wajib", "Peminatan"]),
  angkatan: z.string().min(1, { message: "Angkatan wajib dipilih" }),
  siswa: z.array(z.string()).min(0, { message: "Minimal satu siswa harus dipilih" }),
  tahunAjaran: z.string()
    .min(1, { message: "Tahun ajaran wajib diisi" })
    .refine((val) => {
      const year = parseInt(val);
      return year >= 2000 && year <= 2100;
    }, { message: "Tahun ajaran harus antara 2000-2100" }),
  guru: z.string().min(1, { message: "Guru wajib dipilih" }),
  // status: z.enum(["active", "inactive"]),
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

export default function TambahMataPelajaran() {
  const router = useRouter();
  const [guruSearch, setGuruSearch] = useState("");
  const [siswa, setSiswa] = useState<DataSiswa[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(true);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExplicitSubmit, setIsExplicitSubmit] = useState<boolean>(false);
  const [daftarGuru, setDaftarGuru] = useState<DataGuru[]>([]);
  const [daftarAngkatan, setDaftarAngkatan] = useState<Angkatan[]>([]);
  const preventEnterKeySubmission = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaPelajaran: "", // String kosong
      kategoriMatpel: "Wajib", // Default ke "Wajib"
      tahunAjaran: "", // String kosong
      angkatan: "", // String kosong
      guru: "", // String kosong untuk ID guru
      siswa: [], // Array kosong untuk siswa yang dipilih
      // status: "active", // ✅ Menambahkan status dengan default "active"
    },
  });

  const selectedAngkatan = form.watch("angkatan");
  const currentYear = new Date().getFullYear();
  const [error, setError] = useState<string | null>(null);


  const tahunAjaran = parseInt(form.watch("tahunAjaran") || currentYear.toString());

  useEffect(() => {
    const fetchAvailableTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          console.error("Token tidak tersedia.");
          router.push("/login");
          return;
        }

        const response = await fetch("/api/mata-pelajaran/list-teacher/", {
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
          setDaftarGuru(data.data);

          // Jika ada guru yang tersedia, atur default wali kelas
          if (data.data.length > 0) {
            form.setValue("guru", data.data[0].id.toString());
          }

          setError(null);
        } else if (data.status === 404) {
          setDaftarGuru([]);
          customToast.warning("Tidak ada guru yang tersedia", "Tambahkan guru terlebih dahulu.");
        } else {
          throw new Error(data.errorMessage || "Gagal mendapatkan daftar guru");
        }
      } catch (err: any) {
        console.error("Error fetching available teachers:", err);
        customToast.error("Gagal mengambil data guru", err.message);
        setError("Gagal mengambil data guru: " + err.message);
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchAvailableTeachers();
  }, [router]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      setSiswa([]); // Reset daftar siswa sebelum fetch

      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          console.error("Token tidak tersedia.");
          router.push("/login");
          return;
        }

        const response = await fetch("/api/mata-pelajaran/list-student/", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token} Angkatan ${selectedAngkatan}`,
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

        if (data.status === 200) {
          const filteredStudents = data.data;

          if (filteredStudents.length > 0) {
            setSiswa(filteredStudents);
            form.setValue("siswa", []);
          } else {
            setSiswa([]);
            customToast.warning(
              "Tidak ada siswa", 
              `Tidak ada siswa tanpa kelas untuk angkatan ${selectedAngkatan}`
            );            
          }
        } else {
          throw new Error(data.errorMessage || "Gagal mendapatkan daftar siswa");
        }
      } catch (err: any) {
        console.error("Error fetching students:", err);
        customToast.error("Gagal mengambil data siswa", err.message);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (selectedAngkatan) {
      fetchStudents();
    }
  }, [selectedAngkatan, form, router]);

  useEffect(() => {
    console.log("Siswa terbaru:", siswa);
  }, [siswa]);


  const angkatanOptions = [
    tahunAjaran - 2,
    tahunAjaran - 1,
    tahunAjaran,
    tahunAjaran + 1,
    tahunAjaran + 2,
  ].map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  const onSubmit = async (data: FormData) => {
    if (!isExplicitSubmit) {
      console.log("Preventing automatic form submission");
      return;
    }

    console.log("Form submission triggered with data:", data);
    setIsSubmitting(true);

    // Validasi sebelum mengirim data
    const newErrors = {
      namaPelajaran: !data.namaPelajaran,
      angkatan: !data.angkatan,
      kategoriMatpel: !data.kategoriMatpel,
      guru: !data.guru,
      // siswa: data.siswa.length === 0,
      tahunAjaran: !data.tahunAjaran
    };

    // Jika ada error, hentikan pengiriman
    if (Object.values(newErrors).some((error) => error)) {
      customToast.error("Gagal Menambahkan Mata Pelajaran", "Mohon isi semua field yang wajib!");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      if (!token) {
        console.error("Token tidak tersedia.");
        router.push("/login");
        return;
      }

      const studentIds = data.siswa.map((selectedName) => {
        const matchedStudent = siswa.find((student) => student.name === selectedName);
        return matchedStudent ? matchedStudent.id : null;
      }).filter((id) => id !== null); 

      const requestBody = {
        nama: data.namaPelajaran,
        kategoriMatpel: data.kategoriMatpel,
        angkatan: Number(data.angkatan), // Pastikan angkatan dikonversi ke angka
        tahunAjaran: Number(data.tahunAjaran),
        teacher: data.guru || null,
        siswa_terdaftar: studentIds,
      };

      console.log("Payload yang dikirim:", requestBody); // Debugging sebelum dikirim

      const response = await fetch("/api/mata-pelajaran/tambah/", {
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
        customToast.success("Berhasil Menambahkan Mata Pelajaran", "Mata pelajaran berhasil ditambahkan");
        setTimeout(() => {
          router.push("/admin/mata-pelajaran");
        }, 1500);
      } else {
        throw new Error(responseData.message || "Gagal menambahkan mata pelajaran");
      }
    } catch (err: any) {
      console.error("Error creating mata pelajaran:", err);
      toast.error("Gagal Menambahkan Mata Pelajaran", {
        description: err.message || "Terjadi kesalahan saat menambahkan mata pelajaran",
      });
    } finally {
      setIsSubmitting(false);
      setIsExplicitSubmit(false);
    }
  };


  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Tambah Mata Pelajaran</CardTitle>
          <CardDescription>Masukkan data mata pelajaran baru</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Nama Mata Pelajaran */}
              <FormField
                control={form.control}
                name="namaPelajaran"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mata Pelajaran *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Matematika"
                        value={field.value}
                        onChange={(e) => {
                          const input = e.target.value;
                          const formatted = input
                            .toLowerCase()
                            .split(' ')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                          field.onChange(formatted); // <-- important!
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kategori Mata Pelajaran */}
              <FormField
                control={form.control}
                name="kategoriMatpel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Mata Pelajaran *</FormLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm font-medium">
                            <RadioGroupItem value="Wajib" /> Wajib
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium">
                            <RadioGroupItem value="Peminatan" /> Peminatan
                          </label>
                        </div>
                      </FormControl>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tahun Ajaran */}
              <FormField
                control={form.control}
                name="tahunAjaran"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Ajaran (TA 2023/2024) *</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">TA</span>
                        <Input
                          type="number"
                          placeholder="Contoh: 2024"
                          className={`flex-1 ${field.value && (parseInt(field.value) < 2000 || parseInt(field.value) > 2100) ? 'text-red-500' : ''}`}
                          min="2000"
                          max="2100"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                            if (value && (parseInt(value) < 2000 || parseInt(value) > 2100)) {
                              form.setError('tahunAjaran', {
                                type: 'manual',
                                message: 'Tahun ajaran harus antara 2000-2100'
                              });
                            } else {
                              form.clearErrors('tahunAjaran');
                            }
                          }}
                        />
                        <span className="text-sm font-medium">/</span>
                        <Input
                          type="number"
                          value={field.value ? (parseInt(field.value) + 1).toString() : ""}
                          className="flex-1 bg-gray-100 cursor-not-allowed"
                          disabled
                          readOnly
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Angkatan */}
              <FormField
                control={form.control}
                name="angkatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Angkatan *</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Guru Pengajar */}
              <FormField
  control={form.control}
  name="guru"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Guru Pengajar *</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Pilih guru" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
  <div className="p-2">
    <Input
      placeholder="Cari guru..."
      value={guruSearch}
      onChange={(e) => setGuruSearch(e.target.value)}
      autoFocus={false} // Tambahkan ini untuk mencegah konflik fokus
      onClick={(e) => e.stopPropagation()} // juga cegah klik dari menutup dropdown
    />
  </div>
  <div className="max-h-56 overflow-auto">
    {daftarGuru
      .filter((guru) =>
        guru.name.toLowerCase().includes(guruSearch.toLowerCase())
      )
      .map((guru) => (
        <SelectItem key={guru.id} value={guru.id.toString()}>
          {guru.name}
        </SelectItem>
      ))}
  </div>
</SelectContent>

      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

                <FormField
                  control={form.control}
                  name="siswa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Siswa *</FormLabel>
                      <FormControl>
                        {loadingStudents ? (
                          <p>Loading...</p>
                        ) : siswa.length > 0 ? (
                          <SelectPills
                            data={siswa.map((s: DataSiswa) => ({ id: s.id.toString(), name: s.name }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Pilih siswa"
                          />
                        ) : (
                          <p className="text-gray-500">Tidak ada siswa tersedia</p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              {/* Container untuk Tombol */}
              <div className="flex justify-between items-center gap-2 pt-2">
                {/* Tombol Kembali - Lebih Kecil */}
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.back()} // Kembali ke halaman sebelumnya
                >
                  Kembali
                </Button>

                {/* Tombol Tambah - Lebih Besar */}
                <Button
                  variant="default"
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setIsExplicitSubmit(true)}
                >
                  <Plus className="h-5 w-5 ml-2" />
                  {isSubmitting ? "Menyimpan..." : "Tambah Mata Pelajaran"}
                </Button>
              </div>


            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}