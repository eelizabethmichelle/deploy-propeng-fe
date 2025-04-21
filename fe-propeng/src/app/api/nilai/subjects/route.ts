import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: Request) {    
    
    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    console.log(token);
    console.log(authHeader);

    try {
        // Fetch user profile
        const result = await fetch(`http://203.194.113.127/api/nilai/subjects/`, {
        // const result = await fetch(`http://localhost:8000/api/nilai/subjects/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        console.log(result);
        if (!result.ok) {
            return NextResponse.json({ message: "Failed to fetch" }, { status: result.status });
        }

        const data = await result.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error fetching:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}