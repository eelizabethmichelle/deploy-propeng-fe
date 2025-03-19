"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const roles = [
  { id: "teacher", label: "Guru" },
  { id: "student", label: "Siswa" },
];

export default function AddAccountForm() {
    const router = useRouter();
    const currentYear = new Date().getFullYear();
    
    const form = useForm({
        defaultValues: {
            username: "",
            password: "",
            name: "",
            role: "",
            nomorInduk: "",
            angkatan: currentYear.toString(),
        },
    });
    
    const { username, password, name, role, nomorInduk, angkatan } = form.watch();
    const isStudent = role === "student";
    const isTeacher = role === "teacher";
    const isFormValid = username && password && name && role && nomorInduk && angkatan;
    
    const [selectedAngkatan, setSelectedAngkatan] = React.useState("Pilih Tahun");

    const onSubmit = async (data: unknown) => {
      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      try {
        const response = await fetch("/api/account/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();
        console.log(responseData)

        if (!response.ok) {
          throw new Error(responseData.message || "Gagal menambahkan akun.");
        }

        toast.success("Akun " + responseData.user_name + " berhasil dibuat");
        router.push("/admin/akun");
      } catch (error) {
        console.error("Error creating user:", error);

        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat akun.";
        toast.error(errorMessage);
      }
    }; 

  return (
    <div className="max-w-md mx-auto p-6 mt-20 mb-20 bg-white shadow-md rounded-lg">
      <h2 className="text-center text-xl font-bold mb-4">Tambah Akun</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            rules={{
              required: "Username wajib diisi",
              pattern: {
                value: /^\S+$/,
                message: "Username tidak boleh mengandung spasi",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: ujang.jajaki" {...field} />
                </FormControl>
                <FormDescription>*Username wajib diisi</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: "Password wajib diisi",
              minLength: {
                value: 8,
                message: "Password minimal 8 karakter",
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: "Password harus memiliki huruf besar, huruf kecil, angka, dan simbol",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Contoh: Ujang123!" {...field} />
                </FormControl>
                <FormDescription>
                  *Password harus memiliki minimal 8 karakter, mengandung huruf
                  besar dan huruf kecil, serta setidaknya memiliki 1 angka
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            rules={{ 
                required: "Nama wajib diisi"
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Ujang Jajaki" {...field} />
                </FormControl>
                <FormDescription>*Nama wajib diisi dengan nama lengkap pengguna</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role Selection */}
          <FormField
            control={form.control}
            name="role"
            rules={{ required: "Role wajib dipilih" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value}>
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={role.id} />
                        <FormLabel className="text-sm font-medium">{role.label}</FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  *Role wajib diisi untuk menentukan autorisasi akun pengguna
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nomor Induk Field */}
          {(isStudent || isTeacher) && <FormField
            control={form.control}
            name="nomorInduk"
            rules={{ 
                required: "Nomor Induk wajib diisi",
                pattern: {
                    value: /^\d+$/,
                    message: "Nomor Induk harus berupa angka saja",
                  }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isTeacher ? "NISP *" : isStudent ? "NISN *" : "Nomor Induk *"}</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 1962061119880001009" {...field} />
                </FormControl>
                <FormDescription>*Nomor Induk wajib diisi dengan nomor yang terdaftar secara resmi</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />}

          {/* Angkatan Field */}
          {(isStudent || isTeacher) && (
            <FormField
              control={form.control}
              name="angkatan"
              rules={{ required: "Angkatan wajib diisi" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isTeacher ? "Tahun Masuk *" : isStudent ? "Angkatan *" : "Angkatan *"}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="Contoh: 2025"/>
                  </FormControl>
                  <FormDescription>
                    {isTeacher ? "*Tahun Masuk diisi dengan tahun masuk saat guru mulai mengajar" : 
                    isStudent ? "*Angkatan diisi dengan tahun masuk saat siswa memulai kelas 1 SMA." : ""}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/akun")}>
              Kembali
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Tambah Akun
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}