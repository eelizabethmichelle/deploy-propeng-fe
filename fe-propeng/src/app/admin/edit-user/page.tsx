"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";

// Skema validasi dengan Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  username: z
    .string()
    .min(2, { message: "Username minimal 2 karakter." })
    .max(20, { message: "Username maksimal 20 karakter." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username hanya boleh berisi huruf, angka, dan underscore." }),
  email: z.string().email({ message: "Format email tidak valid." }),
  nisn: z.string().length(10, { message: "NISN harus memiliki 10 angka." }),
  role: z.enum(["Siswa", "Guru"]),
  angkatan: z.string().optional(),
  status: z.string().nonempty({ message: "Status wajib diisi." }),
});

// Definisi tipe berdasarkan skema Zod
type FormData = z.infer<typeof formSchema>;

export default function SidebarTrue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<Partial<FormData> | null>(null);

  // Simulasi Fetch Data (Bisa diganti dengan API call)
  useEffect(() => {
    setTimeout(() => {
      const fetchedData: Partial<FormData> = {
        name: "John Doe",
        username: "",
        email: "johndoe@example.com",
        nisn: "",
        role: "Siswa",
        angkatan: "2024",
        status: "Active",
      };
      setDefaultValues(fetchedData);
      setLoading(false);
    }, 1000);
  }, []);

  // Inisialisasi form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      nisn: "",
      role: "Siswa",
      angkatan: "2024",
      status: "Active",
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const onSubmit = (data: FormData) => {
    console.log("Form Data:", data);

    // Munculkan toast setelah submit
    toast("", {
      description: (
        <div className="flex items-start gap-3">
          {/* Icon di kiri */}
          <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
            <Check className="text-background w-4 h-4" />
          </div>
          <div>
            {/* Judul toast */}
            <p className="text-lg font-semibold text-foreground font-sans">Data Disimpan!</p>
            {/* Deskripsi toast */}
            <p className="text-sm text-muted-foreground font-sans">
              Informasi pengguna telah diperbarui.
            </p>
          </div>
        </div>
      ),
      action: {
        label: (
          <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
            Tutup
          </span>
        ),
        onClick: () => console.log("Tutup"),
      },
    });

    // Delay sebentar sebelum redirect
    setTimeout(() => {
      router.push("/admin/lihat-murid");
    }, 1500);
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Ubah Data Pengguna</CardTitle>
          <CardDescription>Ubah untuk perbarui data</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan username" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan email" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nisn" render={({ field }) => (
                <FormItem>
                  <FormLabel>NISN</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan NISN" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="angkatan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Angkatan</FormLabel>
                  <FormControl>
                    <Input placeholder="2024" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input placeholder="Active" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Kembali</Button>
                <Button className="w-full" type="submit">Submit</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
