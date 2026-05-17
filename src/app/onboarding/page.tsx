import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Onboarding | SKILLA",
  description: "Complete your profile focus targets to join SKILLA.",
};

export default async function OnboardingPage() {
  // Fetch Clerk user details
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Security Gate: Check if user already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
  });

  // If user is already onboarded, send them directly to home dashboard
  if (existingUser) {
    redirect("/home");
  }

  // Handle name formatting securely
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const displayName = `${firstName} ${lastName}`.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4">
      {/* Visual Header / Brand Identifier */}
      <div className="mb-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-black text-orange-500 tracking-wider">
          SKILLA
        </h1>
        <p className="text-[10px] text-zinc-500 mt-1.5 uppercase tracking-widest font-bold">
          Elevate your study flow
        </p>
      </div>

      {/* Main Interactive Form Component */}
      <OnboardingForm
        initialData={{
          name: displayName,
          profilePic: user.imageUrl || "",
        }}
      />

      {/* Footer Meta Details */}
      <footer className="mt-8 text-zinc-600 text-xs">
        Logged in as {user.emailAddresses[0]?.emailAddress}
      </footer>
    </div>
  );
}
