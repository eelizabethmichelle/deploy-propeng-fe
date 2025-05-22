import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api"; // Pastikan import benar

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Token tidak ditemukan." }, { status: 401 });
    }

    if (!API_BASE_URL) {
        console.error("API_BASE_URL tidak terdefinisi.");
        return NextResponse.json({ message: "Konfigurasi API base URL tidak ditemukan." }, { status: 500 });
    }

    // --- Pastikan PATH ini sudah benar ---
    const backendUrl = `${API_BASE_URL}/api/nilai/student/my-grades/`;

    try {
        const backendResponse = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: 'no-store',
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            console.error(`Backend error (${backendResponse.status}) fetching ${backendUrl}:`, data);
            return NextResponse.json(
                { message: data.message || data.detail || "Gagal mengambil data nilai." },
                { status: backendResponse.status }
            );
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error(`Error fetching ${backendUrl}:`, error);
        return NextResponse.json(
            { message: "Terjadi kesalahan internal saat menghubungi server backend." },
            { status: 500 }
        );
    }
}