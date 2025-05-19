import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token and kelasId from headers
    const authHeader = request.headers.get("Authorization");
    const month = request.headers.get("month");
    const year = request.headers.get("year");
    const week = request.headers.get("week");

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse token and kelasId from auth header
    const parts = authHeader.split(" ");
    const token = parts[1];
    const kelasId = parts[3];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!kelasId) {
      return NextResponse.json({ message: "Kelas ID missing" }, { status: 400 });
    }

    if (!API_BASE_URL) {
      console.error("API_BASE_URL is not defined.");
      return NextResponse.json(
        { message: "API base URL configuration not found." },
        { status: 500 },
      );
    }

    // Construct the backend URL with query parameters
    let backendUrl = `${API_BASE_URL}/api/absen/kelas/${kelasId}/weekly-summary`;
    const queryParams = new URLSearchParams();
    
    if (month) queryParams.append("month", month);
    if (year) queryParams.append("year", year);
    if (week) queryParams.append("week", week);
    
    const queryString = queryParams.toString();
    if (queryString) {
      backendUrl += `?${queryString}`;
    }

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await backendResponse.json();

    if (backendResponse.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (backendResponse.status === 404) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    if (backendResponse.status === 500) {
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error in weekly summary:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
