import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
export async function POST(request: Request) {
    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const id = authHeader?.split(" ")[3];
    const absensiDate = authHeader?.split(" ")[5];
    const status = authHeader?.split(" ")[7];
    console.log(authHeader)
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

        const res = await fetch(`${API_BASE_URL}/api/absen/update-status/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, absensiDate, status}),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ message: data.Message || "Gagal submit absensi" }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error submit absensi:", error);
        return NextResponse.json({ message: "Error submit absensi:", error }, { status: 500 });
    }
}