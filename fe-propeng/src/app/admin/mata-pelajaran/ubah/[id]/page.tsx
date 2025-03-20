"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectPills } from "@/components/ui/multiple-select";

interface DataGuru {
  id: string;
  name: string;
  username?: string;
  nisp?: string;
  status?: string;
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
  classId: z.string().min(1, { message: "ID mata pelajaran wajib diisi" }),
  namaPelajaran: z.string().min(1, { message: "Nama pelajaran wajib diisi" }),
  kategoriMatpel: z.enum(["Wajib", "Peminatan"]),
  angkatan: z.string().min(1, { message: "Angkatan wajib dipilih" }),
  siswa: z
    .array(z.string())
    .min(1, { message: "Minimal satu siswa harus dipilih" }),
  tahunAjaran: z.string().min(1, { message: "Tahun ajaran wajib diisi" }),
  guru: z.string().min(1, { message: "Guru wajib dipilih" }),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

function UbahMataPelajaranContent() {
  const router = useRouter();
  const params = useParams();
  const matpelId = params?.id;

  const [daftarGuru, setDaftarGuru] = useState([]);
  const [siswa, setSiswa] = useState<DataSiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedAngkatan, setSelectedAngkatan] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: "",
      namaPelajaran: "",
      kategoriMatpel: "Wajib",
      tahunAjaran: "",
      angkatan: "",
      guru: "",
      siswa: [],
      status: "active",
    },
  });

  useEffect(() => {
    const fetchAvailableTeachers = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) return router.push("/login");

        const response = await fetch(
          "/api/mata-pelajaran/list_teacher/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 401) return router.push("/login");

        const data = await response.json();
        if (data.status === 200) setDaftarGuru(data.data);
      } catch (err) {
        toast.error("Gagal mengambil data guru");
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

        const response = await fetch("/api/mata-pelajaran/list_student/", {
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

        if (data.status === 200) {
          console.log("All students data:", data.data);

          const angkatanTerpilih = parseInt(selectedAngkatan);
          console.log(angkatanTerpilih);

          const filteredStudents = data.data.filter(
            (siswa: any) => siswa.angkatan === angkatanTerpilih
          );

          console.log(filteredStudents)

          if (filteredStudents.length > 0) {
            setSiswa(filteredStudents);
            form.setValue("siswa", []);
          } else {
            setSiswa([]);
            toast.warning("Tidak ada siswa", {
              description: `Tidak ada siswa tanpa kelas untuk angkatan ${selectedAngkatan}`,
            });
          }
        } else {
          throw new Error(data.errorMessage || "Gagal mendapatkan daftar siswa");
        }
      } catch (err: any) {
        console.error("Error fetching students:", err);
        toast.error("Gagal mengambil data siswa", { description: err.message });
      } finally {
        setLoadingStudents(false);
      }
    };

    if (selectedAngkatan) {
      fetchStudents();
    }
  }, [selectedAngkatan, form, router]);

  useEffect(() => {
    if (!matpelId) {
      toast.error("Data mata pelajaran tidak ditemukan");
      router.push("/admin/mata-pelajaran");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token =
          localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }
    
        const res = await fetch(`/api/mata-pelajaran/detail/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} Id ${matpelId}`,
          },
        });
    
        const result = await res.json();
        console.log(result);

        if (res.ok) {
          const { data } = result;
    
          const registeredStudents = data.siswa_terdaftar?.map((siswa: DataSiswa) => ({
            id: siswa.id,
            name: siswa.name
          })) || [];
          
          setSiswa(registeredStudents);
          setSelectedStudents(registeredStudents.map((s: DataSiswa) => s.name));

          form.setValue("siswa", registeredStudents.map((s: DataSiswa) => s.name));
          
          form.reset({
            classId: data.id,
            namaPelajaran: data.nama || "",
            kategoriMatpel: data.kategoriMatpel || "Wajib",
            tahunAjaran: data.tahunAjaran?.toString() || "",
            angkatan: data.kode?.split("_")[1] || "",
            guru: data.teacher?.id?.toString() || "",
            status: "active",
          });

          const newAngkatan = data.kode?.split("_")[1] || "";
          form.setValue("angkatan", newAngkatan);
          setSelectedAngkatan(newAngkatan);
        } else {
          toast.error("Gagal memuat data mata pelajaran");
        }
      } catch (error) {
        console.error("Error fetching mata pelajaran:", error);
        toast.error("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };    

    fetchData();
  }, [matpelId, form, router]);

  useEffect(() => {
    if (selectedStudents.length > 0) {
      form.setValue("siswa", selectedStudents);
    }
  }
  , [selectedStudents, form]);

  useEffect(() => {
    const angkatanValue = form.watch("angkatan"); 
  
    if (angkatanValue) {
      setSelectedAngkatan(angkatanValue);
    }
  }, [form.watch("angkatan")]); 

  const currentYear = new Date().getFullYear();
  const tahunAjaran = parseInt(
    form.watch("tahunAjaran") || currentYear.toString()
  );

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
    try {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const studentIds = data.siswa.map((selectedName) => {
        const matchedStudent = siswa.find((student) => student.name === selectedName);
        return matchedStudent ? matchedStudent.id : null;
      }).filter((id) => id !== null);      

      const requestBody = {
        id: matpelId,
        nama: data.namaPelajaran,
        kategoriMatpel: data.kategoriMatpel,
        angkatan: Number(data.angkatan),
        tahunAjaran: data.tahunAjaran,
        teacher: data.guru || null,
        siswa_terdaftar: studentIds,
        is_archived: data.status === "inactive",
      };

      const response = await fetch(
        `/api/mata-pelajaran/ubah`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        localStorage.removeItem("selectedMatpelId"); // Clean up after successful update
        toast.success("Mata Pelajaran berhasil diperbarui!");
        router.push("/admin/mata-pelajaran");
      } else {
        const responseData = await response.json();
        toast.error(responseData.message || "Gagal memperbarui mata pelajaran");
      }
    } catch (error) {
      console.error("Error updating mata pelajaran:", error);
      toast.error("Terjadi kesalahan saat memperbarui mata pelajaran");
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Ubah Mata Pelajaran</CardTitle>
          <CardDescription>Perbarui data mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Nama Mata Pelajaran */}
              <FormField
                control={form.control}
                name="namaPelajaran"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mata Pelajaran*</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Matematika" {...field} />
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
                    <FormLabel>Kategori Mata Pelajaran*</FormLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <RadioGroupItem value="Wajib" /> Wajib
                          </label>
                          <label className="flex items-center gap-2">
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
                    <FormLabel>Tahun Ajaran (TA 2023/2024)*</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">TA</span>
                        <Input
                          type="number"
                          placeholder="Contoh: 2024"
                          className="flex-1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <span className="text-sm font-medium">/</span>
                        <Input
                          type="number"
                          value={
                            field.value
                              ? (parseInt(field.value) + 1).toString()
                              : ""
                          }
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
                    <FormLabel>Angkatan*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih angkatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {angkatanOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
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
                    <FormLabel>Guru Pengajar*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih guru" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {daftarGuru.map((guru: DataGuru) => (
                          <SelectItem key={guru.id} value={guru.id.toString()}>
                            {guru.name}
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
                name="siswa"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Siswa*</FormLabel>
                  <FormControl onClick={(e) => e.preventDefault()} onKeyDown={(e) => e.preventDefault()}> 
                    {loadingStudents ? (
                    <p>Loading...</p>
                    ) : siswa.length > 0 ? (
                    <SelectPills
                      data={siswa.map((s: DataSiswa) => ({
                      id: s.id.toString(),
                      name: s.name,
                      }))}
                      value={selectedStudents} // Set default values to selectedStudents
                      onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedStudents(value); // Update selectedStudents state
                      }}
                      placeholder="Pilih siswa"
                    />
                    ) : (
                    <p className="text-gray-500">
                      Tidak ada siswa tersedia
                    </p>
                    )}
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
                />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buttons */}
              <div className="flex justify-between items-center gap-2 pt-2">
                <Button
                  className="bg-gray-300 text-black hover:bg-gray-400 transition px-4 py-2 text-sm"
                  type="button"
                  onClick={() => router.back()}
                >
                  Kembali
                </Button>
                <Button
                  className="bg-blue-500 text-white hover:bg-blue-600 transition px-6 py-2 text-base"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UbahMataPelajaran() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UbahMataPelajaranContent />
    </Suspense>
  );
}
