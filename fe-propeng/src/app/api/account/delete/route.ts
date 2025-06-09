import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function DELETE(request: Request) {
    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const userId = authHeader?.split(" ")[3];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/delete/${userId}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
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