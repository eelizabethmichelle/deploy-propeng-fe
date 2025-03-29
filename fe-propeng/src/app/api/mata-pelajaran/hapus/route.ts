import { NextResponse } from "next/server";


export async function DELETE(req: Request) {
    const url = new URL(req.url);
    const { id } = await req.json();
    // const id = url.pathname.split("/").pop();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`http://203.194.113.127/api/matpel/delete/${id}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    const data = await res.json();
  
    if (!res.ok) {
        if (data.message === "Cannot delete MataPelajaran because it has associated grades. Please delete the grades first.") {
            return NextResponse.json({ 
                error: "Has associated grades",
                message: "Tidak dapat menghapus mata pelajaran karena masih memiliki nilai terkait. Harap hapus nilai terlebih dahulu."
            }, { status: 400 });
        }
        return NextResponse.json({ 
            error: "Delete failed",
            message: data.message || "Gagal menghapus mata pelajaran."
        }, { status: 400 });
    }

    return NextResponse.json(data);
}