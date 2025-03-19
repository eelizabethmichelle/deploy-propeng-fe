import { useParams } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(request: Request,) {
    const params = useParams();
    const userId = params?.id; 

    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch user profile data using userId from params
        const profileRes = await fetch(`http://203.194.113.127/api/auth/profile/${userId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!profileRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user profile with id" + userId }, { status: profileRes.status });
        }

        const profileData = await profileRes.json();
        return NextResponse.json(profileData);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}