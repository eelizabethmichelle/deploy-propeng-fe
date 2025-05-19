import { NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token from Authorization header
    const token = authHeader.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "Invalid token format" }, { status: 401 })
    }

    // Get kelasId from URL params
    const url = new URL(request.url)
    const kelasId = url.searchParams.get("kelasId")
    if (!kelasId) {
      return NextResponse.json({ message: "Kelas ID missing" }, { status: 400 })
    }

    if (!API_BASE_URL) {
      console.error("API_BASE_URL is not defined.")
      return NextResponse.json(
        { message: "API base URL configuration not found." },
        { status: 500 },
      )
    }

    const backendUrl = `${API_BASE_URL}/api/absen/kelas/${kelasId}/yearly-summary`

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await backendResponse.json()

    if (backendResponse.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (backendResponse.status === 404) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 })
    }

    if (backendResponse.status === 500) {
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in yearly summary:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    )
  }
}
