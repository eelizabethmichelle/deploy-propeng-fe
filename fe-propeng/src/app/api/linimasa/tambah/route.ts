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
    
    // Get request body
    const requestData = await request.json();
    console.log("requestData yang dikirim:", requestData);
    
    // Make API request to your backend using hardcoded URL
    const response = await fetch(`http://${API_BASE_URL}/api/linimasa/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    console.log("requestData:", requestData);
    // Forward the response from your backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Gagal Membuat Kegiatan Seleksi   :", error);
    return NextResponse.json(
      { error: "Gagal Membuat Kegiatan Seleksi" },
      { status: 500 }
    );
  }
}