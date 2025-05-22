import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

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
    const classId = parts[3];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    
    console.log("ini class id di pemanggilan dashboard")
    console.log(classId);
    console.log("ini api base url di pemanggilan dashboard")
    console.log(API_BASE_URL)
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`http://${API_BASE_URL}/api/kelas/${classId}/insight/`, {
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
    console.error("Error fetching class details:", error);
    return NextResponse.json(
      { error: "Failed to fetch class details" },
      { status: 500 }
    );
  }
}
