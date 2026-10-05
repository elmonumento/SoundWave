import { NextResponse } from "next/server";
import { getTracks } from "@/lib/music";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? undefined;
  return NextResponse.json({ tracks: await getTracks(query) });
}
