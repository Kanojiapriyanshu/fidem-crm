// ================================
// /app/api/modash/report/route.ts (Minor polish; endpoint unchanged)
// Server route: fetches Modash reports for Instagram/YouTube/TikTok
// ================================
import { NextRequest, NextResponse } from "next/server";


const API_BASE = process.env.MODASH_BASE_URL || "https://api.modash.io/v1";


function toCalcMethod(input?: string): "median" | "average" {
return input?.toLowerCase() === "average" ? "average" : "median";
}


export async function GET(req: NextRequest) {
try {
const token = process.env.MODASH_API_KEY;
if (!token) {
return NextResponse.json(
{ error: "Report unavailable" },
{ status: 500 }
);
}


const { searchParams } = new URL(req.url);
const platform = (searchParams.get("platform") || "").toLowerCase();
const userId = searchParams.get("userId") || ""; // handle or numeric id
const calculationMethod = toCalcMethod(searchParams.get("calculationMethod") || undefined);


if (!platform || !["instagram", "tiktok", "youtube"].includes(platform)) {
return NextResponse.json(
{ error: "platform must be instagram|tiktok|youtube" },
{ status: 400 }
);
}
if (!userId) {
return NextResponse.json({ error: "userId is required" }, { status: 400 });
}


const url = `${API_BASE}/${platform}/profile/${encodeURIComponent(
userId
)}/report?calculationMethod=${encodeURIComponent(calculationMethod)}`;


const upstream = await fetch(url, {
method: "GET",
headers: {
Authorization: `Bearer ${token}`,
Accept: "application/json",
},
cache: "no-store",
});


const contentType = upstream.headers.get("content-type") || "application/json";
// If upstream failed, mask sensitive error details before surfacing to client
if (!upstream.ok) {
  let safeMsg = "Report unavailable";
  try {
    const asJson = await upstream.json();
    const raw = asJson?.message || asJson?.error;
    const isSensitive = /api token|developer section|modash|authorization|bearer|modash_api_key|marketer\.modash\.io/i.test(String(raw));
    safeMsg = isSensitive ? "Report unavailable" : (raw || safeMsg);
  } catch {
    // ignore parse errors; fall back to generic
  }
  return NextResponse.json({ error: safeMsg }, { status: upstream.status, headers: { "content-type": "application/json" } });
}

// OK passthrough for valid reports
const text = await upstream.text();
return new NextResponse(text, {
status: upstream.status,
headers: { "content-type": contentType },
});
} catch (err: any) {
console.error("/api/modash/report error", err);
return NextResponse.json(
{ error: err?.message || "Internal error" },
{ status: 500 }
);
}
}
