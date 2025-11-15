import { z } from "zod";

// ==========================
// ENUMS
// ==========================
export const PlanEnum = z.enum(["FREE", "PREMIUM"]);
export type Plan = z.infer<typeof PlanEnum>;

// ==========================
// USER
// ==========================
export const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  password: z.string(),
  plan: PlanEnum.default("FREE"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

// ==========================
// RESUME
// ==========================
export const ResumeSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  fileUrl: z.string().url(),
  fileName: z.string().nullable().optional(),
  parsedText: z.string().nullable().optional(),
  analysis: z.any().nullable().optional(), // linked via relation
  matchResults: z.array(z.any()).optional(),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
});

export type Resume = z.infer<typeof ResumeSchema>;

// ==========================
// JOB DESCRIPTION
// ==========================
export const JobDescriptionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  companyName: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  matchResults: z
    .array(
      z.object({
        id: z.string().optional(),
        resumeId: z.string(),
        jobDescriptionId: z.string(),
        matchScore: z.number().min(0).max(100),
        missingSkills: z.array(z.string()),
        suggestedEdits: z.array(z.string()),
        aiSummary: z.string().nullable().optional(),
        createdAt: z.date().optional(),
      })
    )
    .optional(),
  createdAt: z.date().optional(),
});

export type JobDescription = z.infer<typeof JobDescriptionSchema>;

// ==========================
// ANALYSIS
// ==========================
export const AnalysisSchema = z.object({
  id: z.string().optional(),
  resumeId: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(z.string()),
  education: z.array(z.string()),
  score: z.number().min(0).max(100),
  aiModel: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

// ==========================
// MATCH RESULT
// ==========================
export const MatchResultSchema = z.object({
  id: z.string().optional(),
  resumeId: z.string(),
  jobDescriptionId: z.string(),
  matchScore: z.number().min(0).max(100),
  missingSkills: z.array(z.string()),
  suggestedEdits: z.array(z.string()),
  aiSummary: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  jobDescription: JobDescriptionSchema.optional(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

// ==========================
// SUBSCRIPTION
// ==========================
export const SubscriptionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  plan: z.string(), // could also use PlanEnum
  status: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().nullable().optional(),
  paymentId: z.string().nullable().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// ==========================
// AI INTERACTION
// ==========================
export const AIInteractionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  prompt: z.string(),
  response: z.string(),
  model: z.string(),
  tokensUsed: z.number().nullable().optional(),
  createdAt: z.date().optional(),
});

export type AIInteraction = z.infer<typeof AIInteractionSchema>;
