import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: Request) {    
    
    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    console.log(token);
    
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    try {
        console.log(`${API_BASE_URL}/api/linimasa/angkatan/`);

        const res = await fetch(`${API_BASE_URL}/api/linimasa/angkatan/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        console.log(res);
        console.log("oke loh");
        if (!res.ok) {
            return NextResponse.json({ message: "Gagal mengambil data linimasa:" }, { status: res.status });
        }

        const angkatanData = await res.json();
        console.log(angkatanData);
        return NextResponse.json(angkatanData);

    } catch (error) {
        console.error("Gagal mengambil data linimasa:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}