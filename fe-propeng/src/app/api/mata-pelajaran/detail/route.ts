import { NextResponse } from "next/server";

export async function GET(req: Request) {

    const url = new URL(req.url);
    // const id = url.pathname.split("/").pop();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const id = authHeader?.split(" ")[3];


    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const res = await fetch(`http://127.0.0.1:8000/api/matpel/${id}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    console.log(res);
    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ error: data.message || "Gagal mengambil data mata pelajaran." }, { status: 400 });
    }

    return NextResponse.json(data);
}