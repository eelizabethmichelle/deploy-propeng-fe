import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const matpelId = authHeader?.split(" ")[3];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!matpelId) {
        return NextResponse.json({ message: "Mata Pelajaran ID is missing" }, { status: 404 });
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/komponen/by-matpel/${matpelId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            return NextResponse.json({ message: "Failed to fetch komponen data" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching user data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}