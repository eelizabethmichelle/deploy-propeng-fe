import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: Request) {    
    
    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const tahunAjaran = authHeader?.split(" ")[3];
    console.log(token);
    
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    try {
        console.log(`http://${API_BASE_URL}/api/matpel/`);
        console.log(tahunAjaran);
        console.log("DISINI \n\n\n\n\nn\n\n\n\n\n\ntahun-ajaran");
        const res = await fetch(`http://${API_BASE_URL}/api/matpel/tahun-ajaran/${tahunAjaran}/`, {
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
        console.log(matpelData);
        return NextResponse.json(matpelData);

    } catch (error) {
        console.error("Gagal mengambil data linimasa:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}