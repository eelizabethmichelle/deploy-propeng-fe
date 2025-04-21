// Lokasi: app/api/gradedata/route.ts
import { NextRequest, NextResponse } from 'next/server';


// Handler GET
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const userId = authHeader?.split(" ")[3];
    console.log(userId);
    console.log(token);
    console.log(authHeader);
    try {
        // const djangoUrl = `http://203.194.113.127/api/nilai/subjects/${subjectId}/gradedata/`;
        const djangoUrl = `http://localhost:8000/api/nilai/subjects/${subjectId}/gradedata/`;
        console.log(`[API Route /api/gradedata] Forwarding GET request to Django: ${djangoUrl}`);

        const djangoHeaders: HeadersInit = {'Content-Type': 'application/json','Authorization': `Bearer ${token}`};
        const response = await fetch(djangoUrl, { method: 'GET', headers: djangoHeaders, cache: 'no-store' });

        
         if (!response.ok) {
             let errorData;
             try {
                 errorData = await response.json();
             } catch (e) {
                errorData = { message: `Django API error: ${response.status} ${response.statusText}` };
             }
             console.error("[API Route /api/gradedata] Error from Django POST:", errorData);
             return NextResponse.json(errorData, { status: response.status });
         }

         // Jika sukses, teruskan respons dari Django
         const data = await response.json();
         console.log("[API Route /api/gradedata] Successfully posted data to Django.");
         return NextResponse.json(data, { status: response.status }); // Biasanya 200 atau 201

     } catch (error) {
         console.error("[API Route /api/gradedata] Internal server error during POST:", error);
         if (error instanceof SyntaxError) {
              return NextResponse.json({ message: "Format JSON pada request body tidak valid." }, { status: 400 });
         }
         return NextResponse.json({ message: "Terjadi kesalahan pada server Next.js saat menyimpan." }, { status: 500 });
     }
}

// Handler POST
export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const userId = authHeader?.split(" ")[3];
    console.log(userId);
    console.log(token);
    console.log(authHeader);
    try {
        const body = await request.json();
        // const result = await fetch(`http://203.194.113.127/api/nilai/subjects/`, {
        // const djangoUrl = `http://203.194.113.127/api/nilai/subjects/${subjectId}/gradedata/`;
        const djangoUrl = `http://localhost:8000/api/nilai/subjects/${subjectId}/gradedata/`;
        console.log(`[API Route /api/gradedata] Forwarding POST request to Django: ${djangoUrl}`);

        const djangoHeaders: HeadersInit = {'Content-Type': 'application/json','Authorization': `Bearer ${token}`};
        const response = await fetch(djangoUrl, { method: 'POST', headers: djangoHeaders, body: JSON.stringify(body) });

         
         // Cek jika Django merespons error
         if (!response.ok) {
             let errorData;
             try {
                 errorData = await response.json();
             } catch (e) {
                errorData = { message: `Django API error: ${response.status} ${response.statusText}` };
             }
             console.error("[API Route /api/gradedata] Error from Django POST:", errorData);
             return NextResponse.json(errorData, { status: response.status });
         }

         const data = await response.json();
         console.log("[API Route /api/gradedata] Successfully posted data to Django.");
         return NextResponse.json(data, { status: response.status }); // Biasanya 200 atau 201

     } catch (error) {
         console.error("[API Route /api/gradedata] Internal server error during POST:", error);
         if (error instanceof SyntaxError) {
              return NextResponse.json({ message: "Format JSON pada request body tidak valid." }, { status: 400 });
         }
         return NextResponse.json({ message: "Terjadi kesalahan pada server Next.js saat menyimpan." }, { status: 500 });
     }
}