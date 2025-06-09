import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { namaKomponen, bobotKomponen, tipeKomponen, mataPelajaran } = await request.json();

        const res = await fetch(`${API_BASE_URL}/api/komponen/create/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ namaKomponen, bobotKomponen, tipeKomponen, mataPelajaran }),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ message: data.Message || "Failed to create komponen" }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}