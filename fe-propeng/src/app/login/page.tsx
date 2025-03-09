"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
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
                                type="text" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Masukkan password akun" 
                                required 
                            />
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