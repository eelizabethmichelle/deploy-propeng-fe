import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch("http://203.194.113.127/api/auth/list_student/", {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch students" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
