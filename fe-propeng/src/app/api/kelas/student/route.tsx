// src/app/api/kelas/student/route.tsx
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { API_BASE_URL } from "@/lib/api"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return NextResponse.json({ message: "Token tidak ditemukan." }, { status: 401 })
  }

  if (!API_BASE_URL) {
    console.error("API_BASE_URL tidak terdefinisi.")
    return NextResponse.json({ message: "Konfigurasi API base URL tidak ditemukan." }, { status: 500 })
  }

  const backendUrl = `${API_BASE_URL}/api/kelas/student/my-classes/`

  try {
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!backendResponse.ok) {
      let errorData = { message: `Backend responded with status ${backendResponse.status}` }
      try {
        errorData = await backendResponse.json()
      } catch (e) {
        errorData.message = `Backend error: ${backendResponse.status} ${backendResponse.statusText}`
        console.error("Failed to parse JSON error response from backend.")
      }
      console.error(`Backend error (${backendResponse.status}) fetching ${backendUrl}:`, errorData)
      return NextResponse.json(
        { message: errorData.message || "Gagal mengambil data kelas." },
        { status: backendResponse.status },
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error(`Error fetching ${backendUrl}:`, error)
    if (error instanceof TypeError && error.message.includes("Invalid URL")) {
      return NextResponse.json({ message: "Terjadi kesalahan pada URL backend yang dituju." }, { status: 500 })
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan internal saat menghubungi server backend." },
      { status: 500 },
    )
  }
}
