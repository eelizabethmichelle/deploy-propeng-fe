import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Parse the request body to get class_ids
    const requestBody = await request.json();
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`${API_BASE_URL}/api/kelas/delete_multiple/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ class_ids: requestBody.class_ids })
    });
    
    // Forward the response from your backend
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error("Error deleting classes:", error);
    return NextResponse.json(
      { error: "Failed to delete classes" },
      { status: 500 }
    );
  }
}
