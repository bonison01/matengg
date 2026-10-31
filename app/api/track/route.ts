// app/api/track/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SHEET_RANGE = "ALL-DATA!A2:G"; // skips the header row
const CACHE_TTL_MS = 60 * 1000; // re-read the sheet at most once a minute

type Row = (string | null | undefined)[];

// Cached across requests (lives while the server process runs)
let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let cachedRows: Row[] | null = null;
let cachedAt = 0;
let inflight: Promise<Row[]> | null = null;

// Reads credentials from GOOGLE_SERVICE_ACCOUNT_B64 (base64 of the JSON key file).
// Falls back to GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY if B64 is not set.
function getCredentials(): { email: string; key: string } {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;

  if (b64) {
    const creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return { email: creds.client_email, key: creds.private_key };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";
  const key = (process.env.GOOGLE_PRIVATE_KEY ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  return { email, key };
}

function getSheets() {
  if (!sheetsClient) {
    const { email, key } = getCredentials();
    const auth = new google.auth.JWT({
      email,
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    sheetsClient = google.sheets({ version: "v4", auth });
  }
  return sheetsClient;
}

async function getRows(): Promise<Row[]> {
  const now = Date.now();

  // Serve from cache if fresh
  if (cachedRows && now - cachedAt < CACHE_TTL_MS) {
    return cachedRows;
  }

  // If a fetch is already running, wait for it instead of starting another
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await getSheets().spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: SHEET_RANGE,
      });
      cachedRows = (res.data.values ?? []) as Row[];
      cachedAt = Date.now();
      return cachedRows;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const rows = await getRows();

    // Columns: A=ref, B=MATENG ID, C=Date, D=Customer, E=Phone, F=Mode, G=Weight
    const matches = rows.filter((r) => String(r[1] ?? "").trim() === id);

    if (matches.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (matches.length > 1) {
      return NextResponse.json({ error: "Duplicate ID" }, { status: 409 });
    }

    const row = matches[0];

    // Phone number (column E) is intentionally NOT returned.
    return NextResponse.json({
      tracking_id: String(row[1] ?? "").trim(),
      reference: row[0] ?? null,
      date: row[2] ?? null,
      customer_name: row[3] ?? null,
      delivery_mode: row[5] ?? null,
      weight_estimate: row[6] ?? null,
    });
  } catch (err) {
    console.error("Sheets error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}