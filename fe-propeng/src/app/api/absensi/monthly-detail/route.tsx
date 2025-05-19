import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api"; // Ensure this import is correct

export async function GET(request: NextRequest) {
  // Extract JWT token and kelasId from headers
  const authHeader = request.headers.get("Authorization");
  // Assuming format is "Bearer [token] kelasId [kelas_id]" based on your examples
  const parts = authHeader?.split(" ");
  const token = parts?.[1];
  const kelasId = parts?.[3]; // Extracting kelasId from the 4th part

  if (!token) {
    return NextResponse.json({ message: "Unauthorized: Token missing" }, { status: 401 });
  }

  if (!kelasId) {
    // Returning a specific error if kelasId is missing in the header
    return NextResponse.json({ message: "Kelas ID missing in Authorization header" }, { status: 400 });
  }

  if (!API_BASE_URL) {
    console.error("API_BASE_URL is not defined.");
    return NextResponse.json(
      { message: "API base URL configuration not found." },
      { status: 500 },
    );
  }

  // Construct the backend URL for the monthly detail endpoint
  const backendUrl = `${API_BASE_URL}/api/absen/kelas/${kelasId}/monthly-detail/`;
  console.log(`[API Route /api/absensi/monthly-detail] Fetching from: ${backendUrl}`);

  try {
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        // Add other headers if needed
      },
      cache: "no-store",
    });

    // --- Error Handling ---
    if (!backendResponse.ok) {
      let errorData: any = {
        message: `Backend responded with status ${backendResponse.status}`,
      };
      try {
        errorData = await backendResponse.json();
      } catch (e) {
        errorData.message = `Backend error: ${backendResponse.status} ${backendResponse.statusText}`;
        console.error("Failed to parse JSON error response from backend.");
      }
      console.error(
        `Backend error (${backendResponse.status}) fetching ${backendUrl}:`,
        errorData,
      );
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch monthly attendance detail." },
        { status: backendResponse.status },
      );
    }

    // If response is OK, parse JSON
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // Handle fetch errors (e.g., network error)
    console.error(`Error fetching ${backendUrl}:`, error);
    return NextResponse.json(
      { message: "Internal server error while contacting backend." },
      { status: 500 },
    );
  }
}
