import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export async function GET(request: Request) {
    // Parse the URL and extract the ID from the path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const userId = pathSegments[pathSegments.length - 1]; 

    // Ambil token dari Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        if (!userId) {
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }

        // Fetch user profile data langsung pakai userId dari JWT
        const profileRes = await fetch(`http://203.194.113.127/api/auth/profile/${userId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!profileRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user profile" }, { status: profileRes.status });
        }

        const profileData = await profileRes.json();
        return NextResponse.json(profileData);

    } catch (error) {
        console.error("Error decoding token or fetching data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
