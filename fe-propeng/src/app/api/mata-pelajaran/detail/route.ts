import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const id = authHeader?.split(" ")[3];


    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const res = await fetch(`${API_BASE_URL}/api/matpel/${id}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ error: data.message || "Gagal mengambil data mata pelajaran." }, { status: 400 });
    }

    return NextResponse.json(data);
}