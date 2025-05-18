import { NextResponse } from "next/server";

export async function GET(request: Request) { 
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    
    const url = new URL(request.url); 
    const guru_id = url.searchParams.get("guru_id");
    const tahun_ajaran_id = url.searchParams.get("tahun_ajaran_id");

    if (!guru_id || !tahun_ajaran_id) {
        return NextResponse.json({ message: "Parameter guru_id dan tahun_ajaran_id diperlukan" }, { status: 400 });
    }
    if (!authHeader || !token) { 
        return NextResponse.json({ message: "Header otorisasi tidak valid atau token tidak ada" }, { status: 401 });
    }

    try {
        const API_BASE_URL = process.env.DJANGO_API_BASE_URL || 'http://localhost:8000';
        const fetchUrl = `${API_BASE_URL}/api/evalguru/detail-tahunan/?guru_id=${guru_id}&tahun_ajaran_id=${tahun_ajaran_id}`; 
        
        console.log(`[API Proxy EvalGuru Detail] Forwarding to: ${fetchUrl}`);

        const result = await fetch(fetchUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            cache: 'no-store'
        });

        if (!result.ok) {
            let errorData;
            try {
                errorData = await result.json(); 
            } catch (e) {
                errorData = { message: `Error dari API Django: ${result.status} ${result.statusText}` };
            }
            console.error("[API Proxy EvalGuru Detail] Error from Django:", errorData);
            return NextResponse.json(errorData, { status: result.status });
        }

        const data = await result.json();

        console.log("[API Proxy EvalGuru Detail] Successfully fetched from Django.");
        return NextResponse.json(data);

    } catch (error) {
        console.error("[API Proxy EvalGuru Detail] Internal Server Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui di proxy";
        return NextResponse.json({ message: "Internal Server Error di Next.js API Route", error: errorMessage }, { status: 500 });
    }
}