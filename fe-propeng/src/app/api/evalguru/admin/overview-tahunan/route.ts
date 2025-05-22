import { API_BASE_URL } from "@/lib/api";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    try {

        const fetchUrl = `${API_BASE_URL}/api/evalguru/overview-tahunan/`
        const result = await fetch(fetchUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        const data = await result.json();
        return NextResponse.json(data);
    }
    catch (error) {
        console.error("Error fetching:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}