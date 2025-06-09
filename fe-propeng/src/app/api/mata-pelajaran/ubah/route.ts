import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function PUT(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, nama, teacher, siswa_terdaftar } = await req.json();

  const payload: Record<string, any> = {};
  if (nama !== undefined) payload.nama = nama;
  if (teacher !== undefined) payload.teacher = teacher;
  if (siswa_terdaftar !== undefined) payload.siswa_terdaftar = siswa_terdaftar;

  const res = await fetch(`${API_BASE_URL}/api/matpel/update/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Gagal memperbarui mata pelajaran." }, { status: 400 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}