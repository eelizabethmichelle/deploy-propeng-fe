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
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const roles = [
  { id: "teacher", label: "Guru" },
  { id: "student", label: "Siswa" },
];

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
    },
    shouldUnregister: false,
  });

  const { watch, control, handleSubmit, reset } = form;
  const role = watch("role");
  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isFormValid = watch("username") && watch("name") && watch("role") && (watch("nisn") || watch("nisp")) && watch("angkatan");

  const [selectedAngkatan, setSelectedAngkatan] = useState("Pilih Tahun");
  const angkatanOptions = Array.from({ length: 17 }, (_, i) => (currentYear - 15 + i).toString());

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        router.push("/404")
      }

      const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      try {
        const response = await fetch(`/api/profile/${userId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status == 404) {
            router.push("/404")
          }
          throw new Error("Gagal mengambil data dari server");
        }

        const data = await response.json();
        const userData = data.data;

        reset({
          id: userId?.at(0) || "",
          username: userData.username || "",
          name: userData.name || "",
          role: userData.role || "",
          nisn: userData.nisn || "",
          nisp: userData.nisp || "",
          angkatan: userData.angkatan || currentYear.toString(),
        });

        setSelectedAngkatan(data.angkatan || "Pilih Tahun");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId, reset]);

  return (
    <div className="flex justify-center items-center mt-8 p-4">
      <div className="w-full max-w-3xl p-8 shadow-lg rounded-xl">
        <h2 className="text-center text-2xl font-bold mb-6">Lihat Detail Akun</h2>
        <Form {...form}>
          <form className="space-y-5">
            {/* Username Field */}
            <FormField control={control} name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input value={field.value} readOnly/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Field */}
            <FormField control={control} name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input value={field.value} readOnly/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Selection */}
            <FormField control={control} name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nomor Induk Field */}
            {(isStudent) && (
              <FormField control={control} name="nisn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NISN</FormLabel>
                    <FormControl>
                      <Input value={field.value} readOnly/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(isTeacher) && (
              <FormField control={control} name="nisp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NISP</FormLabel>
                    <FormControl>
                      <Input value={field.value} readOnly/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Angkatan Field */}
            {(isStudent || isTeacher) && (
              <FormField control={control} name="angkatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{ isStudent ? "Angkatan" : "Tahun Masuk" }</FormLabel>
                    <FormControl>
                      <Input value={field.value} readOnly/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/akun")}>Kembali</Button>
              <Button type="button" onClick={() => router.push(`/admin/akun/ubah/${userId}`)}>Ubah</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
