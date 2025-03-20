import { NextResponse } from "next/server";

export async function GET(req: Request) {

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const res = await fetch(`http://203.194.113.127/api/matpel/${id}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    console.log(res);

    if (!res.ok) {
        return NextResponse.json({ error: "Gagal mengambil data mata pelajaran." }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json(data);
}