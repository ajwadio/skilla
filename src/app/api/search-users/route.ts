import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  // Exclude the searcher's own account from results
  const self = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      ...(self ? { id: { not: self.id } } : {}),
    },
    select: {
      username: true,
      name: true,
      profilePic: true,
      role: true,
    },
    take: 6,
    orderBy: { username: "asc" },
  });

  return NextResponse.json(users);
}
