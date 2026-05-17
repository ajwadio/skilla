"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleKudosAction(sessionId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    select: { kudosIds: true },
  });

  if (!session) throw new Error("Session not found");

  const hasKudos = session.kudosIds.includes(dbUser.id);

  let newKudosIds;
  if (hasKudos) {
    newKudosIds = session.kudosIds.filter((id) => id !== dbUser.id);
  } else {
    newKudosIds = [...session.kudosIds, dbUser.id];
  }

  await prisma.studySession.update({
    where: { id: sessionId },
    data: { kudosIds: newKudosIds },
  });

  revalidatePath("/home");
}

export async function addCommentAction(sessionId: string, content: string) {
  if (!content || content.trim() === "") {
    throw new Error("Comment cannot be empty");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  await prisma.comment.create({
    data: {
      content: content.trim(),
      sessionId: sessionId,
      userId: dbUser.id,
    },
  });

  revalidatePath("/home");
}
