import { NextRequest, NextResponse } from "next/server";

// Hardcoded backend API URL
const BASE_API_URL = "http://203.194.113.127/api";

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`${BASE_API_URL}/kelas/list_available_homeroom/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    // Forward the response from your backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching available homeroom teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch available homeroom teachers" },
      { status: 500 }
    );
  }
}
