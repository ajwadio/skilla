"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export interface PostSessionData {
  title: string;
  description?: string;
  durationMinutes: number;
}

export async function postStudySession(data: PostSessionData): Promise<void> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized. Please sign in.");
  }

  // Resolve the MongoDB User record via Clerk ID
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    // User hasn't completed onboarding yet — redirect them there
    redirect("/onboarding");
  }

  // Field validation
  const title = data.title.trim();
  if (!title) {
    throw new Error("Session title is required.");
  }

  const description = data.description?.trim() || undefined;

  const duration = Math.max(1, Math.round(data.durationMinutes));

  await prisma.studySession.create({
    data: {
      userId: user.id,
      title,
      description,
      duration,
    },
  });

  redirect("/home");
}
