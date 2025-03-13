"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z
  .object({
    username: z
      .string()
      .min(2, { message: "Username minimal 2 karakter." })
      .max(20, { message: "Username maksimal 20 karakter." })
      .regex(/^[a-zA-Z0-9_]+$/, { message: "Username hanya boleh berisi huruf, angka, dan underscore." }),

    password: z
      .string()
      .min(8, { message: "Password minimal 8 karakter." })
      .max(32, { message: "Password maksimal 32 karakter." })
      .regex(/[A-Z]/, { message: "Password harus memiliki minimal satu huruf kapital." })
      .regex(/[a-z]/, { message: "Password harus memiliki minimal satu huruf kecil." })
      .regex(/[0-9]/, { message: "Password harus memiliki minimal satu angka." })
      .regex(/[@$!%*?&]/, { message: "Password harus memiliki minimal satu simbol (@, $, !, %, *, ?, &)." }),

    // email: z
    //   .string()
    //   .email({ message: "Format email tidak valid." })
    //   .nonempty({ message: "Email wajib diisi." }),

    // phone: z
    //   .string()
    //   .nonempty({ message: "Nomor telepon wajib diisi." })
    //   .regex(/^\+62\d+$/, { message: "Nomor telepon harus diawali dengan +62 dan hanya berisi angka." }),

    // age: z
    //   .number({ invalid_type_error: "Usia harus berupa angka." })
    //   .min(6, { message: "Usia minimal 6 tahun." })
    //   .max(99, { message: "Usia maksimal 99 tahun." }),

    // level: z
    //   .number({ invalid_type_error: "Tingkatan harus berupa angka." })
    //   .min(1, { message: "Tingkatan minimal 1." })
    //   .max(3, { message: "Tingkatan maksimal 3." }),

    // class: z
    //   .number({ invalid_type_error: "Kelas harus berupa angka." })
    //   .min(1, { message: "Kelas minimal 1." })
    //   .max(12, { message: "Kelas maksimal 12." }),

//     confirmPassword: z.string(),

//     oldPassword: z.string().optional(),

//     choices: z
//       .array(z.string().min(1, { message: "Setiap pilihan harus diisi." }))
//       .min(1, { message: "Minimal pilih 1." })
//       .max(3, { message: "Maksimal hanya bisa memilih 3." }),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Konfirmasi password tidak sesuai dengan password baru.",
//     path: ["confirmPassword"],
//   })
//   .refine((data) => data.password !== data.oldPassword, {
//     message: "Password baru tidak boleh sama dengan password lama.",
//     path: ["password"],
  });



export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { username: "", password: "" },
    });

    const handleLogin = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
    
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
    
            if (!response.ok) {
                throw new Error("Login failed");
            }
    
            const data = await response.json();
            localStorage.setItem("accessToken", data.access);
            sessionStorage.setItem("accessToken", data.access)
            router.push("/dashboard"); // Redirect after login
        } catch (error) {
            console.error("Login error:", error);
            alert("Login gagal! Periksa kembali kredensial Anda.");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            {/* Logo */}
            <Image src="/Logo-Full.png" alt="SIMAK SMA Kristen Anglo" width={300} height={150} className="mb-4" />

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">Portal Masuk</CardTitle>
                    <CardDescription>Masuk menggunakan akun yang telah disediakan admin sekolah</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                        {/* Username Input */}
                        <div>
                            <label className="text-sm font-medium">Username</label>
                            <Input 
                                type="text" 
                                {...form.register("username")}
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                placeholder="Masukkan username akun" 
                                required 
                            />
                            {form.formState.errors.username && (
                                <p className="text-red-500 text-sm">{form.formState.errors.username.message}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="text-sm font-medium">Password</label>
                            <PasswordInput 
                                type="text" 
                                {...form.register("password")}
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Masukkan password akun" 
                                required 
                            />
                            {form.formState.errors.password && (
                                <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Memproses..." : "Masuk"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}