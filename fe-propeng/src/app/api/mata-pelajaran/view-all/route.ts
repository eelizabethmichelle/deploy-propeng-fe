import { NextResponse, NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const authCheck = await fetch(`http://${API_BASE_URL}/api/auth/protected/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!authCheck.ok) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: authCheck.status });
    }

    const res = await fetch(`http://${API_BASE_URL}/api/matpel/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.Message || "Failed to fetch mata pelajaran" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
