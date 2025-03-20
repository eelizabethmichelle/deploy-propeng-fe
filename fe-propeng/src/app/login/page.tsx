"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            const loginResponse = await fetch("api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
    
            if (!loginResponse.ok) {
                throw new Error("Periksa kembali kredensial Anda");
            }
    
            const loginData = await loginResponse.json();
            localStorage.setItem("accessToken", loginData.access);
            sessionStorage.setItem("accessToken", loginData.access)
            router.push("/");
        } catch (error) {
            console.error("Login error:", error);
            alert("Login gagal! Periksa kembali kredensial Anda.");
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = !username || !password || loading;

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Illustration (hanya muncul di layar besar) */}
            <div className="hidden lg:block w-1/2 max-w-[50vw] h-screen bg-gray-100 relative">
                <Image 
                    src="/Login.png" 
                    alt="Illustration" 
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                    className="w-full h-full"
                />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center bg-white h-screen">
                <div className="max-w-md w-full px-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Image src="/Logo-Full.png" alt="SIMAK SMA Kristen Anglo" width={250} height={100} />
                    </div>

                    {/* Login Card */}
                    <Card className="w-full shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl font-bold">Portal Masuk</CardTitle>
                            <CardDescription>Masuk menggunakan akun yang telah disediakan admin sekolah</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* Username Input */}
                                <div>
                                    <label className="text-sm font-medium">Username</label>
                                    <Input 
                                        type="text" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        placeholder="Masukkan username akun" 
                                        required 
                                    />
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <PasswordInput 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        placeholder="Masukkan password akun" 
                                        required 
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" className="w-full" disabled={isDisabled}>
                                    {loading ? "Memproses..." : "Login"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}