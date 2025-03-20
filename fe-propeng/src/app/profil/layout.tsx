"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import ProfilePageStudent from "./@student/page";
import ProfilePageTeacher from "./@teacher/page";
import ProfilePageAdmin from "./@admin/page";
// tutprr

interface TokenPayload {
  user_id: number;
  email: string;
  role: string;
  exp: number;
}

interface ProfileData {
  user_id: number;
  username: string;
  email: string;
  role: string;
  name: string;
  nisp: string;
  angkatan: number;
  isActive: boolean;
}

export default function ProfileLayout({
  admin,
  student,
  teacher,
}: {
  admin: React.ReactNode;
  student: React.ReactNode;
  teacher: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (!token) {
      console.log("Token tidak ditemukan, redirect ke /login");
      router.push("/login");
      return;
    }

    try {
      const decoded: TokenPayload = jwtDecode<TokenPayload>(token);
      console.log("Decoded JWT:", decoded);

      if (Date.now() >= decoded.exp * 1000) {
        console.error("Token expired, redirect ke /login");
        router.push("/login");
        return;
      }

      setRole(decoded.role);
      fetchProfile(decoded.user_id);
    } catch (error) {
      console.error("Invalid token, redirect ke /login", error);
      router.push("/login");
    }
  }, []);

  const fetchProfile = async (userId: number) => {
    try {
      const accessToken =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        const response = await fetch(`http://203.194.113.127/api/auth/profile/${userId}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken} Id ${userId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      console.log("Fetched profile:", data.data);
      setProfile(data.data);
    } catch (error) {
      console.error(error);
      router.push("/login");
    }
  };

  if (!role || !profile) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <>
      {role === "admin" && <ProfilePageAdmin user_id={profile?.user_id} />}
      {role === "student" && <ProfilePageStudent user_id={profile?.user_id} />}
      {role === "teacher" && <ProfilePageTeacher user_id={profile?.user_id} />}
    </>
  );

}
