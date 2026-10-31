import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const folder = path.join(
      process.cwd(),
      "public",
      "employee-contract-pdfs"
    );

    const files = fs
      .readdirSync(folder)
      .filter((f) => f.toLowerCase().endsWith(".pdf"));

    return NextResponse.json({ pdfs: files });
  } catch (err: any) {
    console.error("listPdfs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
