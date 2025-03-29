import { NextRequest, NextResponse } from "next/server";

// Hardcoded backend API URL
const BASE_API_URL = "http://127.0.0.1:8000/api";

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers using your preferred format
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse token and ID from auth header
    const parts = authHeader.split(" ");
    const token = parts[1];
    const classId = parts[3]; // Get ID from header instead of searchParams
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`${BASE_API_URL}/kelas/kode/${classId}`, {
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
    console.error("Berhasil mendapatkan kode absen:", error);
    return NextResponse.json(
      { error: "Gagal mendapatkan kode absen" },
      { status: 500 }
    );
  }
}
