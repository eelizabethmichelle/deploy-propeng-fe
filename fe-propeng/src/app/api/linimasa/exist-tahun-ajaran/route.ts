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
    console.log("DISIN I COOOOKKK\n\n\n\n\n\nWOOWOW");
    try {
        console.log("DISINI");
        const res = await fetch(`http://${API_BASE_URL}/api/linimasa/tahun-ajaran/`, {
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

        const matpelData = await res.json();
        console.log("DISINI 2");
        console.log(matpelData);
        return NextResponse.json(matpelData);

    } catch (error) {
        console.error("Gagal mengambil data linimasa:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}