import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function PUT(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`http://${API_BASE_URL}/api/linimasa/pilihan-siswa/update-status/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json({ error: errorData.message || "Gagal update status." }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
