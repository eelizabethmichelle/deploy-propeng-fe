import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: Request) {    
    
    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const userId = authHeader?.split(" ")[3];
    console.log(userId);
    console.log(token);
    console.log(authHeader);

    if (!userId) {
        return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }
    
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    try {
        // return NextResponse.json({ message: {url: url, pathSegments: pathSegments, userId: userId, fetchUrl: `http://127.0.0.1:8000/api/auth/profile/${userId}`} }, { status: 401 });
        
        console.log(`${API_BASE_URL}/api/auth/profile/${userId}`);
        // Fetch user profile
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        console.log("API_BASE_URL:", API_BASE_URL);
        if (!profileRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user profile" }, { status: profileRes.status });
        }

        const profileData = await profileRes.json();
        return NextResponse.json(profileData);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}