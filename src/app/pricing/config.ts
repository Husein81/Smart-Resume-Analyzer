import { Limit, Plan } from "@/types/schemas";

type PricingPlan = {
  name: Plan;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: Limit;
  popular?: boolean;
};

const FEATURE_LIMITS: Record<string, Limit> = {
  FREE: {
    resumes: { used: 0, limit: 3 },
    analysisPerMonth: { used: 0, limit: 3 },
    matchesPerMonth: { used: 0, limit: 5 },
    jobDescriptions: { used: 0, limit: 3 },
  },
  PREMIUM: {
    resumes: { used: 0, limit: Infinity },
    analysisPerMonth: { used: 0, limit: Infinity },
    matchesPerMonth: { used: 0, limit: Infinity },
    jobDescriptions: { used: 0, limit: Infinity },
  },
};

export const plans: PricingPlan[] = [
  {
    name: "FREE",
    displayName: "Free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      "3 resume uploads",
      "3 AI analyses per month",
      "5 job matches per month",
      "3 saved job descriptions",
      "ATS compatibility check",
      "Basic resume scoring",
      "Community support",
    ],
    limits: {
      resumes: FEATURE_LIMITS.FREE.resumes,
      analysisPerMonth: FEATURE_LIMITS.FREE.analysisPerMonth,
      matchesPerMonth: FEATURE_LIMITS.FREE.matchesPerMonth,
      jobDescriptions: FEATURE_LIMITS.FREE.jobDescriptions,
    },
  },
  {
    name: "PREMIUM",
    displayName: "Premium",
    price: {
      monthly: 9.99,
      yearly: 99,
    },
    features: [
      "Unlimited resume uploads",
      "Unlimited AI analyses",
      "Unlimited job matches",
      "Unlimited saved job descriptions",
      "Advanced ATS optimization",
      "Detailed skill gap analysis",
      "Priority support",
      "Export to multiple formats",
      "Advanced analytics dashboard",
    ],
    limits: {
      resumes: FEATURE_LIMITS.PREMIUM.resumes,
      analysisPerMonth: FEATURE_LIMITS.PREMIUM.analysisPerMonth,
      matchesPerMonth: FEATURE_LIMITS.PREMIUM.matchesPerMonth,
      jobDescriptions: FEATURE_LIMITS.PREMIUM.jobDescriptions,
    },
    popular: true,
  },
];
