"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import { checkUsernameUnique, completeOnboarding } from "./actions";

interface InitialOnboardingData {
  name: string;
  profilePic: string;
}

export function OnboardingForm({
  initialData,
}: {
  initialData: InitialOnboardingData;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(initialData.name || "");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string>("Student");
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");

  // Live Username Uniqueness Checking
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("idle");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_-]{3,20}$/;

    if (!usernameRegex.test(cleanUsername)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const isUnique = await checkUsernameUnique(cleanUsername);
        if (isUnique) {
          setUsernameStatus("available");
        } else {
          setUsernameStatus("taken");
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus("idle");
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(timer);
  }, [username]);

  // Goal Addition
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGoal = newGoal.trim();
    if (!cleanGoal) return;

    if (goals.includes(cleanGoal)) {
      setError("This goal has already been added.");
      return;
    }

    setGoals([...goals, cleanGoal]);
    setNewGoal("");
    setError(null);
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    setGoals(goals.filter((g) => g !== goalToRemove));
  };

  const handleNextStep = () => {
    setError(null);
    if (!name.trim()) {
      setError("Display name is required.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (usernameStatus !== "available") {
      setError("Please choose a valid and available username.");
      return;
    }
    if (!role) {
      setError("Please select a role.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError(null);
    if (goals.length === 0) {
      setError("You must add at least 1 focus goal to complete your profile.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        name,
        username: username.trim().toLowerCase(),
        role,
        goals,
        profilePic: initialData.profilePic,
      });
      // completeOnboarding redirects to /home upon success
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setError(err.message || "Failed to complete onboarding. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      {/* Golden Highlight Border at the Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500" />

      {/* Header and Step Indicators */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Create your profile
          </h2>
          <span className="text-xs text-orange-500 font-semibold uppercase tracking-wider bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
            Step {step} of 2
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          {step === 1
            ? "Tell us about yourself so other Skilla members can connect with you."
            : "Define your study targets. These will guide your session tracking."}
        </p>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-zinc-800 rounded-full mt-5 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${step * 50}%` }}
          />
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span className="text-sm text-red-200 leading-relaxed">{error}</span>
        </motion.div>
      )}

      {/* Form Wizard Pages */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Display Name Input */}
            <div className="space-y-2">
              <label htmlFor="name-input" className="block text-sm font-semibold text-zinc-200">
                Display Name
              </label>
              <div className="relative">
                <input
                  id="name-input"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username-input" className="block text-sm font-semibold text-zinc-200">
                Username
              </label>
              <div className="relative">
                <input
                  id="username-input"
                  type="text"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-4 pr-10 py-3 bg-zinc-950 border rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all text-sm ${
                    usernameStatus === "available"
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      : usernameStatus === "taken" || usernameStatus === "invalid"
                      ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                      : "border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                  }`}
                />
                <div className="absolute right-3.5 top-3.5 flex items-center justify-center">
                  {usernameStatus === "checking" && (
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                  )}
                  {usernameStatus === "available" && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Username validation hints */}
              <div className="mt-1.5 min-h-[1.25rem]">
                {usernameStatus === "idle" && (
                  <p className="text-xs text-zinc-500">
                    Use 3-20 characters: letters, numbers, hyphens, or underscores.
                  </p>
                )}
                {usernameStatus === "invalid" && (
                  <p className="text-xs text-red-400">
                    Username must be 3-20 characters, containing only lowercase letters, numbers, - or _.
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-xs text-emerald-400 font-medium">
                    Excellent! This username is available.
                  </p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-xs text-red-400">
                    This username is already taken.
                  </p>
                )}
              </div>
            </div>

            {/* Premium Role Selection Cards */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-200">
                Choose your current Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "Student",
                    label: "Student",
                    icon: GraduationCap,
                    description: "High school or University",
                  },
                  {
                    value: "Working Professional",
                    label: "Professional",
                    icon: Briefcase,
                    description: "Work, upskilling, trade",
                  },
                  {
                    value: "Other",
                    label: "Other",
                    icon: Sparkles,
                    description: "Personal growth & hobbies",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all focus:outline-none ${
                        isSelected
                          ? "border-orange-500 bg-orange-500/5 text-orange-400 ring-1 ring-orange-500/30"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2.5 ${isSelected ? "text-orange-500 animate-pulse" : "text-zinc-500"}`} />
                      <span className="text-xs font-bold tracking-tight block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-1 block leading-tight">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Action Button */}
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/10 text-sm mt-8 cursor-pointer"
            >
              Continue to Goals
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Dynamic Goals Input */}
            <div className="space-y-2">
              <label htmlFor="goal-input" className="block text-sm font-semibold text-zinc-200">
                Focus Goals (Minimum 1 Required)
              </label>
              <form onSubmit={handleAddGoal} className="flex gap-2">
                <input
                  id="goal-input"
                  type="text"
                  placeholder="e.g. Master TypeScript, Complete 2 hours study daily"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="px-4 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-orange-500 hover:text-orange-400 font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Selected Goals Listing */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Active Focus Targets ({goals.length})
              </span>
              
              {goals.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 bg-zinc-950/20 rounded-xl text-center">
                  <p className="text-sm text-zinc-600">
                    No goals added yet. Add at least one goal to outline your focus.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1">
                  <AnimatePresence>
                    {goals.map((goal) => (
                      <motion.div
                        key={goal}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-orange-500/20 rounded-full text-zinc-200 text-xs"
                      >
                        <span className="font-medium">{goal}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(goal)}
                          className="text-zinc-500 hover:text-red-400 transition-colors focus:outline-none"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Navigation and Submission actions */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-[120px] flex items-center justify-center gap-2 py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold rounded-xl transition-all text-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting || goals.length === 0}
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Profile
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
