import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
export async function GET(request: Request) {

    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const kelasId = authHeader?.split(" ")[3];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch user profile
        const profileRes = await fetch(`http://${API_BASE_URL}/api/absen/kelas/${kelasId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (profileRes.status == 401) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        else if (profileRes.status === 404) {
            return NextResponse.json({ message: "Not Found" }, { status: 404 });
        }
        else if (profileRes.status === 500) {
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
        else {
            const profileData = await profileRes.json();
            return NextResponse.json(profileData);
        }


    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}