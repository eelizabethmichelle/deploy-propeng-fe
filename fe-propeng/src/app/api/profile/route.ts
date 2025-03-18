import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: { id: string } }) {
    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch authenticated user data
        const authRes = await fetch("http://203.194.113.127/api/auth/protected", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!authRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user data" }, { status: authRes.status });
        }

        const authData = await authRes.json();
        const userId = authData.data_user.id;

        // Fetch user profile data
        const profileRes = await fetch(`http://203.194.113.127/api/auth/profile/${userId}`, {
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
        console.error("Error fetching user data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}