import { ca } from "date-fns/locale";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const guru_id = authHeader?.split(" ")[3];
    const tahun_ajaran_id = sessionStorage.getItem("tahun_ajaran_id");
    try {
        const fetchUrl = `http://localhost:8000/api/evalguru/detail-tahunan/?guru_id=${guru_id}&&tahun_ajaran_id=${tahun_ajaran_id}`
        const result = await fetch(fetchUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        const data = await result.json();
        sessionStorage.removeItem("tahun_ajaran_id");
        return NextResponse.json(data);
    }
    catch (error) {
        console.error("Error fetching:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }

}