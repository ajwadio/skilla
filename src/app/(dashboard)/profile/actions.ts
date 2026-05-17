"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Shared result type ───────────────────────────────────────────────────────

export type FriendActionResult =
  | { success: true }
  | { success: false; error: string };

// ─── sendFriendRequest ────────────────────────────────────────────────────────

/**
 * Creates a new Friendship document with status "PENDING".
 *
 * Guards against:
 *   - Unauthenticated callers
 *   - Sending to yourself
 *   - Duplicate requests in either direction
 *   - Non-existent target usernames
 */
export async function sendFriendRequest(
  receiverUsername: string
): Promise<FriendActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized. Please sign in." };

  // Resolve sender's internal User document
  const sender = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, username: true },
  });
  if (!sender) {
    return {
      success: false,
      error: "Your profile was not found. Please complete onboarding.",
    };
  }

  // Normalize and find target user
  const cleanUsername = receiverUsername.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, error: "Username cannot be empty." };
  }

  const receiver = await prisma.user.findUnique({
    where: { username: cleanUsername },
    select: { id: true },
  });
  if (!receiver) {
    return { success: false, error: `User @${cleanUsername} was not found.` };
  }

  // Guard: can't request yourself
  if (sender.id === receiver.id) {
    return {
      success: false,
      error: "You cannot send a friend request to yourself.",
    };
  }

  // Guard: check both directions for an existing row
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: sender.id, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: sender.id },
      ],
    },
    select: { status: true },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return { success: false, error: "You are already friends with this user." };
    }
    return {
      success: false,
      error: "A friend request already exists between you and this user.",
    };
  }

  // Create the pending request
  await prisma.friendship.create({
    data: {
      senderId: sender.id,
      receiverId: receiver.id,
      status: "PENDING",
    },
  });

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/notifications");

  return { success: true };
}

// ─── acceptFriendRequest ──────────────────────────────────────────────────────

/**
 * Transitions an existing PENDING Friendship to ACCEPTED.
 *
 * Also mutates both users' `friendIds` arrays atomically via a Prisma
 * transaction so the flat mutual graph stays in sync with the relational graph —
 * the home feed query relies on `friendIds` for its IN filter.
 *
 * @param senderId  The internal MongoDB ObjectId string of the request sender.
 */
export async function acceptFriendRequest(
  senderId: string
): Promise<FriendActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized. Please sign in." };

  // Resolve the current user (receiver of the request)
  const receiver = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!receiver) {
    return { success: false, error: "Your profile was not found." };
  }

  // Locate the specific pending friendship row using the compound unique key
  const friendship = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId: receiver.id,
      },
    },
    select: { id: true, status: true },
  });

  if (!friendship) {
    return { success: false, error: "Friend request not found." };
  }
  if (friendship.status === "ACCEPTED") {
    return { success: false, error: "This request has already been accepted." };
  }

  // Atomically: flip status + push each user into the other's friendIds array
  await prisma.$transaction([
    // 1. Mark friendship as accepted
    prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: "ACCEPTED" },
    }),
    // 2. Add receiver's ID to sender's friendIds
    prisma.user.update({
      where: { id: senderId },
      data: { friendIds: { push: receiver.id } },
    }),
    // 3. Add sender's ID to receiver's friendIds
    prisma.user.update({
      where: { id: receiver.id },
      data: { friendIds: { push: senderId } },
    }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/notifications");

  return { success: true };
}

// ─── declineFriendRequest ─────────────────────────────────────────────────────

/**
 * Declines a PENDING friend request by deleting the Friendship document.
 */
export async function declineFriendRequest(
  senderId: string
): Promise<FriendActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized. Please sign in." };

  const receiver = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!receiver) {
    return { success: false, error: "Your profile was not found." };
  }

  const friendship = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId: receiver.id,
      },
    },
    select: { id: true, status: true },
  });

  if (!friendship) {
    return { success: false, error: "Friend request not found." };
  }
  if (friendship.status === "ACCEPTED") {
    return { success: false, error: "Cannot decline an already accepted request." };
  }

  await prisma.friendship.delete({
    where: { id: friendship.id },
  });

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/notifications");

  return { success: true };
}
