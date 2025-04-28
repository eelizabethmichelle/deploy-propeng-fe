import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function PUT(request: Request) {
    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // TODO : api_base_url ga recognize tapi yg bawah kedeclare..
        const authCheck = await fetch(`http://${API_BASE_URL}/api/auth/protected/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!authCheck.ok) {
            return NextResponse.json({ message: "Unauthorized access" }, { status: authCheck.status });
        }

        const { id, name, username, nisn, nisp, angkatan, isActive, password } = await request.json();
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Buat payload data yang akan dikirim
        const payload: any = { name, username, nisn, nisp, angkatan, isActive };
        if (password) {
            payload.password = password; // Jika ada password baru, tambahkan ke payload
        }

        // Lakukan request ke Django backend
        const res = await fetch(`http://${API_BASE_URL}/api/auth/edit/${id}/`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ message: data.message || "Failed to save changes" }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}