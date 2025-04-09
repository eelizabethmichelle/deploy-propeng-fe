import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: Request) {    
    
    // Extract JWT token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const id = authHeader?.split(" ")[2];
    console.log(token);
    
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    try {
        console.log(`http://${API_BASE_URL}/api/linimasa/delete/${id}`);

        const res = await fetch(`http://${API_BASE_URL}/api/linimasa/delete/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        console.log(res);
        console.log("oke loh");
        if (!res.ok) {
            return NextResponse.json({ message: "Gagal mengambil data linimasa:" }, { status: res.status });
        }

        const linimasaData = await res.json();
        console.log(linimasaData);
        return NextResponse.json(linimasaData);

    } catch (error) {
        console.error("Gagal mengambil data linimasa:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {    
    // Extract JWT token and ID from headers
    const authHeader = request.headers.get("Authorization");
    const parts = authHeader?.split(" ") || [];
    const token = parts[1];
    const id = parts[3]; // The ID is the 4th part after "Bearer", token, and "id"
    
    console.log("Delete request - Token:", token);
    console.log("Delete request - ID:", id);
    
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    if (!id) {
        return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    
    try {
        console.log(`http://${API_BASE_URL}/api/linimasa/delete/${id}`);

        const res = await fetch(`http://${API_BASE_URL}/api/linimasa/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        
        if (!res.ok) {
            return NextResponse.json({ message: "Gagal menghapus data linimasa" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Gagal menghapus data linimasa:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}