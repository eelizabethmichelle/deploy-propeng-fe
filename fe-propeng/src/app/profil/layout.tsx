"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        console.log("Fetched role:", data.data.role);
        setRole(data.data.role);
      } catch (error) {
        console.error(error);
        router.push("/login");
      }
    };

    fetchUserRole();
  }, []);

  // Log the role update
  useEffect(() => {
    if (role) {
      console.log("Updated role:", role);
    }
  }, [role]);

  // Show a loading state while waiting for role
  if (!role) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // 🔥 Dynamically render the correct component based on the role
  return (
    <>
      {role === "admin" && admin}
      {role === "student" && student}
      {role === "teacher" && teacher}
    </>
  );
}