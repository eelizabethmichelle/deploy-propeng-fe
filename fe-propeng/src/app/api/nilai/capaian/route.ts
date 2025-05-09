// Lokasi: app/api/capaian/[subjectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from "@/lib/api"; // Pastikan variabel ini ada dan benar

// Handler GET untuk mengambil deskripsi capaian
export async function GET(request: NextRequest) { // Remove params from signature
    const { searchParams } = request.nextUrl; // Get searchParams from request.nextUrl
    const subjectId = searchParams.get('subjectId'); // Get subjectId from searchParams
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!subjectId || !token) {
        return NextResponse.json({ message: 'Parameter subjectId atau token hilang' }, { status: 400 });
    }

    try {
        // Panggil endpoint Django untuk GET capaian
        const djangoUrl = `${API_BASE_URL}/api/capaiankompetensi/${subjectId}/`;
        console.log(`[API Route /api/capaian] Forwarding GET request to Django: ${djangoUrl}`);

        const djangoHeaders: HeadersInit = { 'Authorization': `Bearer ${token}` };
        const response = await fetch(djangoUrl, { method: 'GET', headers: djangoHeaders, cache: 'no-store' });

        const data = await response.json();

        if (!response.ok) {
            console.error("[API Route /api/capaian] Error from Django GET:", data);
            // Teruskan pesan error dari Django jika ada
            return NextResponse.json(data || { message: `Django API error: ${response.status}` }, { status: response.status });
        }

        console.log("[API Route /api/capaian] Successfully fetched capaian data from Django.");
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("[API Route /api/capaian] Internal server error during GET:", error);
        return NextResponse.json({ message: "Terjadi kesalahan pada server Next.js saat mengambil data capaian." }, { status: 500 });
    }
}

// Handler POST untuk membuat/update/hapus deskripsi capaian
export async function POST(request: NextRequest) { // Remove params from signature
    const { searchParams } = request.nextUrl; // Get searchParams
    const subjectId = searchParams.get('subjectId'); // Get subjectId
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];


    if (!subjectId || !token) {
        return NextResponse.json({ message: 'Parameter subjectId atau token hilang' }, { status: 400 });
    }

    try {
        const body = await request.json();

        // Validasi sederhana di sini (opsional, karena Django juga validasi)
        if (!body || (body.pengetahuan === undefined && body.keterampilan === undefined)) {
             return NextResponse.json({ message: 'Request body JSON harus berisi kunci "pengetahuan" atau "keterampilan".' }, { status: 400 });
        }

        // Panggil endpoint Django untuk POST capaian
        const djangoUrl = `${API_BASE_URL}/api/capaiankompetensi/${subjectId}/`;
        console.log(`[API Route /api/capaian] Forwarding POST request to Django: ${djangoUrl}`);

        const djangoHeaders: HeadersInit = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        const response = await fetch(djangoUrl, { method: 'POST', headers: djangoHeaders, body: JSON.stringify(body) });

        const data = await response.json(); // Django selalu mengembalikan body JSON (state terbaru atau error)

        if (!response.ok) {
            console.error("[API Route /api/capaian] Error from Django POST:", data);
            // Teruskan pesan error dari Django
            return NextResponse.json(data || { message: `Django API error: ${response.status}` }, { status: response.status });
        }

        console.log("[API Route /api/capaian] Successfully posted capaian data to Django.");
        // Kembalikan state terbaru dari Django dengan status 200 OK
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("[API Route /api/capaian] Internal server error during POST:", error);
        // Tangani error parsing JSON body
        if (error instanceof SyntaxError) {
             return NextResponse.json({ message: "Format JSON pada request body tidak valid." }, { status: 400 });
        }
        return NextResponse.json({ message: "Terjadi kesalahan pada server Next.js saat menyimpan data capaian." }, { status: 500 });
    }
}