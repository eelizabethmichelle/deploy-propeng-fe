"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Skema validasi dengan Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  username: z
    .string()
    .min(2, { message: "Username minimal 2 karakter." })
    .max(20, { message: "Username maksimal 20 karakter." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username hanya boleh berisi huruf, angka, dan underscore." }),
  email: z.string().email({ message: "Format email tidak valid." }),
  role: z.enum(["siswa", "guru"]),
  nisn: z.string().length(10, { message: "NISN harus memiliki 12 angka." }).optional(),
  nip: z.string().length(18, { message: "NIP harus memiliki 18 angka." }).optional(),
  angkatan: z.string().optional(),
});

// Definisi tipe berdasarkan skema Zod
type FormData = z.infer<typeof formSchema>;

export default function TambahPengguna() {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      role: "siswa",
      nisn: "",
      nip: "",
      angkatan: new Date().getFullYear().toString(),
    },
  });

  const role = form.watch("role");

  const onSubmit = (data: FormData) => {
    console.log("Form Data:", data);

    toast("", {
      description: (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
            <Check className="text-background w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground font-sans">Pengguna Ditambahkan!</p>
            <p className="text-sm text-muted-foreground font-sans">
              Informasi pengguna baru telah berhasil disimpan.
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

    setTimeout(() => {
      router.push("/admin/lihat-murid");
    }, 1500);
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-6 mt-10">
      <Toaster />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Tambah Pengguna</CardTitle>
          <CardDescription>Masukkan data pengguna baru</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="siswa">Siswa</SelectItem>
                      <SelectItem value="guru">Guru</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {role === "siswa" && (
                <>
                  <FormField control={form.control} name="nisn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>NISN</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan NISN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="angkatan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Angkatan</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="Masukkan tahun angkatan" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}

              {role === "guru" && (
                <FormField control={form.control} name="nip" render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan NIP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Kembali</Button>
                <Button className="w-full" type="submit">Tambah</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
