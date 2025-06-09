import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function DELETE(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse token from auth header
    const parts = authHeader.split(" ");
    const token = parts[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get request body - for DELETE requests, we need to use the request body
    const requestBody = await request.json();
    const { classId, studentId } = requestBody;
    
    if (!classId || !studentId) {
      return NextResponse.json(
        { error: "Class ID and Student ID are required" },
        { status: 400 }
      );
    }
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`${API_BASE_URL}/api/kelas/delete_siswa_from_kelas/${classId}/${studentId}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    // Forward the response from your backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error removing student:", error);
    return NextResponse.json(
      { error: "Failed to remove student" },
      { status: 500 }
    );
  }
}
