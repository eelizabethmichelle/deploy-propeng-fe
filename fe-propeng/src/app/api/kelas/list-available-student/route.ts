import { NextRequest, NextResponse } from "next/server";

// Hardcoded backend API URL
const BASE_API_URL = "http://203.194.113.127/api";

export async function GET(request: NextRequest) {
  try {
    // Get angkatan from the URL
    const { searchParams } = new URL(request.url);
    const angkatan = searchParams.get("angkatan");
    
    if (!angkatan) {
      return NextResponse.json(
        { error: "Angkatan is required" },
        { status: 400 }
      );
    }
    
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`${BASE_API_URL}/kelas/list_available_student/${angkatan}`, {
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
    console.error("Error fetching available students:", error);
    return NextResponse.json(
      { error: "Failed to fetch available students" },
      { status: 500 }
    );
  }
}
