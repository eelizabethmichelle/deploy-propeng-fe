import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/list_teacher/`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch teachers" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
