import { NextResponse, NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Step 1: Get authenticated user data
    const authRes = await fetch(`${API_BASE_URL}/api/auth/protected/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!authRes.ok) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: authRes.status });
    }

    const authData = await authRes.json();
    const teacherId = authData?.data_user?.user_id;

    if (!teacherId) {
      return NextResponse.json({ message: "Teacher ID is missing" }, { status: 404 });
    }

    // Step 2: Fetch mata pelajaran for the teacher
    const matpelRes = await fetch(`${API_BASE_URL}/api/matpel/by-teacher/${teacherId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const matpelData = await matpelRes.json();

    if (!matpelRes.ok) {
      return NextResponse.json(
        { message: matpelData.message || "Failed to fetch mata pelajaran" },
        { status: matpelRes.status }
      );
    }

    return NextResponse.json(matpelData);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}