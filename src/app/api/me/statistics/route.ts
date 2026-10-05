import { and, count, countDistinct, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listeningHistory, music } from "@/lib/db/schema";
import { apiError } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour consulter tes statistiques.", 401);

  const [summary] = await db
    .select({
      totalListens: count(listeningHistory.id),
      uniqueTracks: countDistinct(listeningHistory.musicId),
      listenedSeconds: sql<number>`coalesce(sum(${music.durationSeconds}), 0)`,
    })
    .from(listeningHistory)
    .innerJoin(music, eq(listeningHistory.musicId, music.id))
    .where(eq(listeningHistory.userId, user.id));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recent] = await db
    .select({ listens: count(listeningHistory.id) })
    .from(listeningHistory)
    .where(and(eq(listeningHistory.userId, user.id), gte(listeningHistory.listenedAt, thirtyDaysAgo)));
  return NextResponse.json({
    totalListens: summary.totalListens,
    uniqueTracks: summary.uniqueTracks,
    listenedSeconds: Number(summary.listenedSeconds),
    listensLast30Days: recent.listens,
  });
}
