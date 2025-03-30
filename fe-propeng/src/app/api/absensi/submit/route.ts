import { NextResponse } from "next/server";

export async function POST(request: Request) {
    // Extract the JWT token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const authCheck = await fetch("http://203.194.113.127/api/auth/protected/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!authCheck.ok) {
            return NextResponse.json({ message: "Unauthorized access" }, { status: authCheck.status });
        }

        const { idKelas, idSiswa, kodeAbsen } = await request.json();

        const res = await fetch("http://203.194.113.127/api/absen/absen-submit/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idKelas, idSiswa, kodeAbsen}),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ message: data.Message || "Gagal submit absensi" }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error submit absensi:", error);
        return NextResponse.json({ message: "Error submit absensi:", error }, { status: 500 });
    }
}