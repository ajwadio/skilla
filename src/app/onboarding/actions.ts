"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function checkUsernameUnique(username: string): Promise<boolean> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return false;

  const existingUser = await prisma.user.findUnique({
    where: { username: cleanUsername },
  });

  return !existingUser;
}

export interface OnboardingData {
  name: string;
  username: string;
  role: string;
  goals: string[];
  profilePic?: string;
}

export async function completeOnboarding(data: OnboardingData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized access. Please sign in.");
  }

  // Double check if user is already onboarded
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (existingUser) {
    redirect("/home");
  }

  // Server-side validation
  const name = data.name.trim();
  const username = data.username.trim().toLowerCase();
  const role = data.role.trim();
  
  if (!name) {
    throw new Error("Display name is required.");
  }

  if (!username) {
    throw new Error("Username is required.");
  }

  // Username validation: alphanumeric, dashes, underscores, between 3 and 20 characters
  const usernameRegex = /^[a-z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new Error("Username must be between 3 and 20 characters and contain only lowercase letters, numbers, underscores, or hyphens.");
  }

  // Check uniqueness on server side as well
  const unique = await checkUsernameUnique(username);
  if (!unique) {
    throw new Error("Username is already taken.");
  }

  // Role validation
  const validRoles = ["Student", "Working Professional", "Other"];
  if (!validRoles.includes(role)) {
    throw new Error("Please select a valid role.");
  }

  // Goals validation: at least 1 focus goal
  const goals = data.goals.map((g) => g.trim()).filter((g) => g.length > 0);
  if (goals.length === 0) {
    throw new Error("You must add at least 1 focus goal to complete your profile.");
  }

  // Set standard adventurer-neutral avatar placeholder if profilePic is not specified
  const profilePic = data.profilePic || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(username)}`;

  // Create User
  try {
    await prisma.user.create({
      data: {
        clerkId: userId,
        username,
        name,
        role,
        goals,
        profilePic,
        friendIds: [],
      },
    });
  } catch (error: any) {
    console.error("Error creating user during onboarding:", error);
    throw new Error("Failed to complete profile creation. Please try again.");
  }

  // Clean redirect
  redirect("/home");
}
