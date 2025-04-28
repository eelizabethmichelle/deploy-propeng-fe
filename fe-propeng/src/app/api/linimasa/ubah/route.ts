import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function PUT(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Get request body
    const requestData = await request.json();
    console.log("Update request data:", requestData);
    
    // Make API request to the backend
    const response = await fetch(`http://${API_BASE_URL}/api/linimasa/ubah/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Forward the response from the backend
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error("Error updating linimasa:", error);
    return NextResponse.json(
      { status: 500, error: "Gagal Mengubah Linimasa", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 