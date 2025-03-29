import { NextResponse } from "next/server";

export async function PUT(request: Request) {
    try {
        // Ambil body dari request
        const { old_password, new_password } = await request.json();

        // Ambil token dari Authorization header
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Kirim request ke Django
        const response = await fetch("http://127.0.0.1:8000/api/auth/change-password/", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ old_password, new_password }),
        });

        // Ambil JSON response dari Django
        const responseData = await response.json();

        if (!response.ok) {
            return NextResponse.json({ 
                message: responseData.Message || "Terjadi kesalahan", 
                status: response.status 
            }, { status: response.status });
        }

        // Jika berhasil, kembalikan respons Django
        return NextResponse.json({ message: responseData.Message, status: response.status });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
