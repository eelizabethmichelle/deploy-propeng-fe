"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface TokenDecodePayload {
  user_id: number;
  exp: number;
  iat: number;
}

interface UserData {
  user_id: number;
  username: string;
  role: string;
}

async function getMyData(): Promise<UserData | null> {
  try {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) return null;

    const response = await fetch("http://localhost:8000/api/auth/protected/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data dari server");

    const jsonData = await response.json();
    return jsonData.data_user;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");

    // **1. Jika sudah login dan akses home, langsung redirect ke page sesuai role**
    if (token && role) {
      redirectToRolePage(role, router);
      return;
    }

    // **2. Jika belum login, arahkan ke login**
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const decodedToken = jwtDecode<TokenDecodePayload>(token);
        const user = await getMyData();

        if (!user || user.user_id !== decodedToken.user_id) {
          console.error("User tidak valid");
          router.push("/login");
          return;
        }

        localStorage.setItem("role", user.role);
        sessionStorage.setItem("role", user.role);

        redirectToRolePage(user.role, router);
      } catch (error) {
        console.error("Error:", error);
        router.push("/login");
      }
    };

    fetchUserData();
  }, [router]);

  return null;
}

function redirectToRolePage(role: string, router: any) {
  switch (role) {
    case "student":
      router.push("/sample/sidebar-false");
      break;
    case "teacher":
    case "admin":
      router.push("/admin/lihat-murid");
      break;
    default:
      router.push("/login");
  }
}
