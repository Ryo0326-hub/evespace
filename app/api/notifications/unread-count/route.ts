import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/lib/data/notifications";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { count: 0 },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const count = await getUnreadNotificationCount(userId);
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
