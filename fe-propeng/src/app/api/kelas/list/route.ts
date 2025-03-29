import { NextRequest, NextResponse } from "next/server";

// Hardcoded backend API URL
const BASE_API_URL = "http://127.0.0.1:8000/api";

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`${BASE_API_URL}/kelas/`, {
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
    console.error("Error fetching class list:", error);
    return NextResponse.json(
      { error: "Failed to fetch class list" },
      { status: 500 }
    );
  }
}
