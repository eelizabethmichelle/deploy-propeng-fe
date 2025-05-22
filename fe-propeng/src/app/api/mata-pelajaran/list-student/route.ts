import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  const angkatan = authHeader?.split(" ")[3];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {    
    if (!angkatan) {
      return NextResponse.json(
        { error: "Angkatan is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/student/${angkatan}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const result = await response.json();
    const filteredData = result.data.filter((student: any) => {
      return String(student.angkatan) === String(angkatan);
    });

    if (!response.ok) {
      return NextResponse.json({ message: result.message || "Failed to fetch students" }, { status: response.status });
    }

    return NextResponse.json(
      {
        status: 200,
        message: `Successfully retrieved students with angkatan ${angkatan}`,
        data: filteredData,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
