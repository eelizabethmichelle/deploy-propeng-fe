import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {    
    
    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const kelasId = authHeader?.split(" ")[3];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    try {
        // return NextResponse.json({ message: {url: url, pathSegments: pathSegments, userId: userId, fetchUrl: `http://203.194.113.127/api/auth/profile/${userId}`} }, { status: 401 });
        
        
        // Fetch user profile
        const profileRes = await fetch(`http://203.194.113.127/api/absen/kelas/${kelasId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!profileRes.ok) {
            return NextResponse.json({ message: "Gagal mengambil data kehadiran" }, { status: profileRes.status });
        }

        const profileData = await profileRes.json();
        return NextResponse.json(profileData);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}