// Lokasi file: app/api/absensi/summarystudent/route.ts (REVISED - No Params)

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

    // --- URL Backend Langsung (TANPA searchParams) ---
    const backendUrl = `${API_BASE_URL}/api/absen/student/summary`; // Path sesuai user
    // Jika backend memerlukan trailing slash, tambahkan:
    // const backendUrl = `${API_BASE_URL}/api/absen/student/summary/`;

    console.log(`[API Route /api/absensi/summarystudent] Fetching from: ${backendUrl}`); // Log URL yang dituju

    try {
        // --- Gunakan backendUrl langsung, bukan backendUrlWithParams ---
        const backendResponse = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: 'no-store',
        });

        // --- Error Handling Tetap Sama ---
        // Periksa status respons sebelum mencoba parsing JSON
        if (!backendResponse.ok) {
            let errorData = { message: `Backend responded with status ${backendResponse.status}` }; // Default error
            try {
                // Coba parse JSON, mungkin berisi detail error dari backend
                errorData = await backendResponse.json();
            } catch (e) {
                // Jika parsing JSON gagal (misal respons HTML error), gunakan status text
                errorData.message = `Backend error: ${backendResponse.status} ${backendResponse.statusText}`;
                console.error("Failed to parse JSON error response from backend.");
            }
            console.error(`Backend error (${backendResponse.status}) fetching ${backendUrl}:`, errorData);
            return NextResponse.json(
                { message: errorData.message || "Gagal mengambil rekap kehadiran." },
                { status: backendResponse.status }
            );
        }

        // Jika respons OK, parse JSON
        const data = await backendResponse.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
         // Tangani error fetch (misal network error, invalid URL *sebelumnya*)
        console.error(`Error fetching ${backendUrl}:`, error);
        // Cek apakah ini error URL lagi (seharusnya tidak jika syntax benar)
        if (error instanceof TypeError && error.message.includes('Invalid URL')) {
             return NextResponse.json( { message: "Terjadi kesalahan pada URL backend yang dituju." }, { status: 500 });
        }
        return NextResponse.json(
            { message: "Terjadi kesalahan internal saat menghubungi server backend." },
            { status: 500 }
        );
    }
}