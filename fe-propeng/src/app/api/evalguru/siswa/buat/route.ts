import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(request: Request) {
    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Verify authorization with Django backend
        const authCheck = await fetch(`${API_BASE_URL}/api/auth/protected/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!authCheck.ok) {
            return NextResponse.json({ message: "Unauthorized access" }, { status: authCheck.status });
        }

        // Extract user data from request
        const { isian, kritik_saran, matapelajaran_id } = await request.json();

        const res = await fetch(`${API_BASE_URL}/api/evalguru/create/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({isian, kritik_saran, matapelajaran_id }),
        });
        console.log("Fetching data from backend:", res);

        const data = await res.json();
        console.log("data");
        console.log(data);
        console.log("res");
        console.log(res);
        if (!res.ok) {
            return NextResponse.json({ message: data.Message || "Gagal membuat evaluasi guru" }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}