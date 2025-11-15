import { Plan } from "@/types/schemas";
import prisma from "./prisma";

// Feature limits configuration
export const FEATURE_LIMITS = {
  FREE: {
    resumes: 3,
    analysisPerMonth: 3,
    matchesPerMonth: 5,
    jobDescriptions: 3,
  },
  PREMIUM: {
    resumes: Infinity,
    analysisPerMonth: Infinity,
    matchesPerMonth: Infinity,
    jobDescriptions: Infinity,
  },
} as const;

type Feature =
  | "resumes"
  | "analysisPerMonth"
  | "matchesPerMonth"
  | "jobDescriptions";

type UsageLimits = {
  resumes: { used: number; limit: number };
  analysisPerMonth: { used: number; limit: number };
  matchesPerMonth: { used: number; limit: number };
  jobDescriptions: { used: number; limit: number };
};

/**
 * Get the start of the current month
 */

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Check if a user can access a specific feature based on their plan limits
 * @param userId - The user's ID
 * @param feature - The feature to check access for
 * @returns Object with canAccess boolean and remaining quota
 */
export async function checkFeatureAccess(
  userId: string,
  feature: Feature
): Promise<{ canAccess: boolean; remaining: number; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      resumes: true,
      jobDescriptions: true,
      interactions: {
        where: {
          createdAt: { gte: getMonthStart() },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const plan = user.plan as Plan;
  const limit = FEATURE_LIMITS[plan][feature];

  let used = 0;

  switch (feature) {
    case "resumes":
      used = user.resumes.length;
      break;
    case "analysisPerMonth":
      // Count AIInteractions with type 'analysis' this month
      used = user.interactions.filter((i) =>
        i.prompt.includes("analyze resume")
      ).length;
      break;
    case "matchesPerMonth":
      // Count AIInteractions with type 'match' this month
      used = user.interactions.filter((i) =>
        i.prompt.includes("match resume")
      ).length;
      break;
    case "jobDescriptions":
      used = user.jobDescriptions.length;
      break;
  }

  const canAccess = used < limit;
  const remaining = Math.max(0, limit - used);

  return { canAccess, remaining, limit };
}

/**
 * Increment usage for a specific feature by logging to AIInteraction
 * @param userId - The user's ID
 * @param feature - The feature being used
 * @param prompt - The prompt/action description
 * @param response - The AI response or action result
 * @param model - The AI model used (optional)
 * @param tokensUsed - Number of tokens used (optional)
 */
export async function incrementUsage(
  userId: string,
  feature: "analysis" | "match",
  prompt: string,
  response: string,
  model?: string,
  tokensUsed?: number
): Promise<void> {
  await prisma.aIInteraction.create({
    data: {
      userId,
      prompt,
      response,
      model: model || "groq-llama-3.3-70b",
      tokensUsed,
    },
  });
}

export async function getUserLimits(userId: string): Promise<{
  plan: Plan;
  limits: UsageLimits;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      resumes: true,
      jobDescriptions: true,
      interactions: {
        where: {
          createdAt: { gte: getMonthStart() },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const plan = user.plan as Plan;
  const limits = FEATURE_LIMITS[plan];

  const analysisUsed = user.interactions.filter((i) =>
    i.prompt.includes("analyze resume")
  ).length;

  const matchesUsed = user.interactions.filter((i) =>
    i.prompt.includes("match resume")
  ).length;

  return {
    plan,
    limits: {
      resumes: {
        used: user.resumes.length,
        limit: limits.resumes,
      },
      analysisPerMonth: {
        used: analysisUsed,
        limit: limits.analysisPerMonth,
      },
      matchesPerMonth: {
        used: matchesUsed,
        limit: limits.matchesPerMonth,
      },
      jobDescriptions: {
        used: user.jobDescriptions.length,
        limit: limits.jobDescriptions,
      },
    },
  };
}

/**
 * Check if a user can perform a specific action
 * @param userId - The user's ID
 * @param action - The action to validate
 * @returns Boolean indicating if the action is allowed
 */
export async function canPerformAction(
  userId: string,
  action: "upload_resume" | "analyze_resume" | "match_resume" | "create_job"
): Promise<boolean> {
  const featureMap: Record<typeof action, Feature> = {
    upload_resume: "resumes",
    analyze_resume: "analysisPerMonth",
    match_resume: "matchesPerMonth",
    create_job: "jobDescriptions",
  };

  const feature = featureMap[action];
  const { canAccess } = await checkFeatureAccess(userId, feature);
  return canAccess;
}
