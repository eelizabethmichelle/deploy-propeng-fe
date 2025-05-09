import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(req: Request) {
    const { username, password } = await req.json();

    // Send login request to your Django backend
    const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data); // Return JWT token
}