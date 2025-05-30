import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function DELETE(request: Request) {
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

        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const res = await fetch(`${API_BASE_URL}/api/komponen/delete/${id}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });
        
        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.message }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}