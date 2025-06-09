import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  const eventId = authHeader?.split(" ")[3];

  if (!token || !eventId) {
    return NextResponse.json({ message: "Unauthorized or missing event ID" }, { status: 401 });
  }
  console.log("aaaaak")
  console.log(token)
  console.log(eventId)

  try {
    const res = await fetch(`${API_BASE_URL}/api/linimasa/submisi/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Gagal mengambil data submisi." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mengambil data." },
      { status: 500 }
    );
  }
}
