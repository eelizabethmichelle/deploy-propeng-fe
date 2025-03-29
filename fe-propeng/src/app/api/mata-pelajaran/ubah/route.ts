import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const url = new URL(req.url);

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, nama, kode, kategoriMatpel, angkatan, tahunAjaran, teacher } = await req.json();
  const payload = {
    nama,
    kode,
    kategoriMatpel,
    angkatan,
    tahunAjaran,
    teacher,
  };
  
  const res = await fetch(`http://203.194.113.127/api/matpel/update/${id}/`, {
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
