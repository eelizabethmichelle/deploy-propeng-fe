// src/app/api/absensi/student/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const kelasId = authHeader?.split(" ")[3];
    console.log("Kelas ID:", kelasId);
    console.log("API_BASE_URL:", API_BASE_URL);

    if (!token) return NextResponse.json({ message: "Token tidak ditemukan." }, { status: 401 });
    if (!API_BASE_URL) {
        console.error("API_BASE_URL tidak terdefinisi.");
        console.log(API_BASE_URL);
        return NextResponse.json({ message: "Konfigurasi API base URL tidak ditemukan." }, { status: 500 });
    }
    if (!API_BASE_URL) return NextResponse.json({ message: "Konfigurasi API base URL tidak ditemukan." }, { status: 500 });

    if (!kelasId) return NextResponse.json({ message: "ID kelas diperlukan." }, { status: 400 });

    // NOTE: Use the REAL backend endpoint here (this is your production endpoint)
    const backendUrl = `${API_BASE_URL}/api/absen/student/summary-by-class/${kelasId}/`;
    console.log("Fetching backend URL:", backendUrl);
    try {
        const backendResponse = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!backendResponse.ok) {
            let errorData = { message: `Backend responded with status ${backendResponse.status}` };
            try { errorData = await backendResponse.json(); } catch (e) {}
            return NextResponse.json(
                { message: errorData.message || "Gagal mengambil rekap kehadiran." },
                { status: backendResponse.status }
            );
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal saat menghubungi server backend." },
            { status: 500 }
        );
    }
}
