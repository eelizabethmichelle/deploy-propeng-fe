"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
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
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { custom } from "zod";
import { notEqual } from "assert";

const roles = [
  { id: "teacher", label: "Guru" },
  { id: "student", label: "Siswa" },
];

const status = [
  { id: true, label: "Aktif" },
  { id: false, label: "Tidak Aktif" },
];

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

export default function EditAccountForm() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;
  const currentYear = new Date().getFullYear();

  const form = useForm({
    defaultValues: {
      id: "",
      username: "",
      password: "",
      name: "",
      role: "",
      nisn: "",
      nisp: "",
      angkatan: currentYear.toString(),
      isActive: "",
    }
  });

  const { watch, control, handleSubmit, reset, getValues } = form;
  const role = watch("role");
  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isFormValid =
    watch("username") &&
    watch("name") &&
    watch("role") &&
    (watch("nisn") || watch("nisp")) &&
    watch("angkatan") &&
    watch("isActive") !== undefined;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        router.push("/404");
        return;
      }

      const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      try {
        const response = await fetch(`/api/account/detail`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken} Id ${userId}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/404");
          }
          throw new Error("Gagal mengambil data dari server");
        }

        const data = await response.json();
        console.log(data)
        const userData = data.data;

        reset({
          id: userData.user_id || "",
          username: userData.username || "",
          name: userData.name || "",
          role: userData.role || "",
          nisn: userData.nisn || "",
          nisp: userData.nisp || "",
          angkatan: userData.angkatan || currentYear.toString(),
          isActive: userData.isActive ? "true" : "false",
        });

      } catch (error) {
        console.error("Error fetching user data:", error);
        customToast.error("Error", "Gagal mengambil data akun pengguna");
      }
    };

    fetchUserData();
  }, [userId, reset]);

  const onSubmit = async (data: any) => {
    const accessToken =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    try {
      console.log(data)
      const response = await fetch(`/api/account/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Gagal memperbarui akun");
      }
      customToast.success(
        "Berhasil Diperbarui!", 
        `Akun ${responseData.detail.original_data.name} berhasil diperbarui`
      );
      
      router.push("/admin/akun");
    } catch (error) {
      console.log(error)
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui akun."
      customToast.error("Error", errorMessage);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 mt-10 mb-10 bg-white shadow-lg rounded-xl">
      <h2 className="text-center text-2xl font-bold mb-6">Edit Akun</h2>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username Field */}
          <FormField control={control} name="username"
            rules={{ required: "Username wajib diisi" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan username" {...field} disabled/>
                </FormControl>
                <FormDescription>*Username wajib diisi</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name Field */}
          <FormField control={control} name="name"
            rules={{ required: "Nama wajib diisi" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap *</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama lengkap" {...field} />
                </FormControl>
                <FormDescription>*Nama wajib diisi dengan nama lengkap pengguna</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role Selection */}
          <FormField control={control} name="role"
            rules={{ required: "Role wajib dipilih" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} disabled>
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-3">
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
          {(isStudent) && (
            <FormField control={control} name="nisn"
              rules={{ required: "Nomor Induk wajib diisi", pattern: { value: /^\d+$/, message: "Nomor Induk harus berupa angka" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"NISN *"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan Nomor Induk" {...field} disabled/>
                  </FormControl>
                  <FormDescription>*Nomor Induk wajib diisi dengan nomor yang terdaftar secara resmi</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {(isTeacher) && (
            <FormField control={control} name="nisp"
              rules={{ required: "Nomor Induk wajib diisi", pattern: { value: /^\d+$/, message: "Nomor Induk harus berupa angka" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"NISP *"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan Nomor Induk" {...field} disabled/>
                  </FormControl>
                  <FormDescription>*Nomor Induk wajib diisi dengan nomor yang terdaftar secara resmi</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Angkatan Field */}
          {(isStudent || isTeacher) && (
            <FormField control={control} name="angkatan"
              rules={{ required: "Tahun masuk wajib diisi" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isTeacher ? "Tahun Masuk *" : isStudent ? "Angkatan *" : "Angkatan *"}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="Contoh: 2025" disabled/>
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

          {/* Status Field */}
          <FormField control={control} name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value}>
                    {status.map((status) => (
                      <div key={String(status.id)} className="flex items-center space-x-3">
                        <RadioGroupItem value={String(status.id)} />
                        <FormLabel className="text-sm font-medium">{status.label}</FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  {isTeacher ? "*Pilih aktif jika guru masih aktif mengajar" : 
                  isStudent ? "*Pilih aktif jika siswa masih aktif terdaftar mengikuti kegiatan belajar mengajar" : ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField control={control} name="password"
            rules={{
              minLength: {
                value: 8,
                message: "Password minimal 8 karakter",
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: "Password harus memiliki huruf besar, huruf kecil, angka, dan simbol",
              },
               validate: {
                notSameAsUsername: (value) => {
                  // 'value' adalah isi dari field 'password' (password baru)
                  // Dapatkan nilai username saat ini
                  const usernameValue = getValues("username");
                  // Validasi hanya jika password diisi dan username ada
                  if (value && usernameValue && value === usernameValue) {
                    return "Password tidak boleh sama dengan username.";
                  }
                  return true; // Validasi lolos
                }
                // Anda bisa menambahkan validasi kustom lainnya di sini, misal:
                // notSameAsOldPassword: (value) => { ... } (jika Anda punya cara aman mendapatkan password lama)
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password Baru</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Contoh: Ujang123!" {...field} />
                </FormControl>
                <FormDescription>*Password bersifat opsional. Field ini hanya perlu diisi jika ingin mengubah password akun pengguna</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Buttons */}
          <div className="flex justify-between">
            <Button variant="secondary" type="button" onClick={() => router.push("/admin/akun")}>Kembali</Button>
            <Button variant="default" type="submit" disabled={!isFormValid}>{"Simpan Perubahan"}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
