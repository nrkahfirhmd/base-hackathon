import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Proxy mengirim ke Backend:", body);

    const backendRes = await fetch(
      "https://deqrypt-be.argradin.my.id/api/lending/deposit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    // Ambil teks mentah dulu, baru coba parse ke JSON
    const text = await backendRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    console.log("Backend merespon dengan status:", backendRes.status);

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error("Proxy Error Detail:", error);
    return NextResponse.json(
      { message: "Internal Proxy Error", detail: error.message },
      { status: 500 },
    );
  }
}
