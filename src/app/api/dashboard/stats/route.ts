import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user
 */
export async function GET() {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authSession.user.id;

    // Fetch all stats in parallel
    const [
      totalResumes,
      analyzedResumes,
      totalJobs,
      totalMatches,
      averageScore,
      recentResumes,
      topMatches,
    ] = await Promise.all([
      // Total resumes
      prisma.resume.count({
        where: { userId },
      }),

      // Analyzed resumes (with analysis)
      prisma.resume.count({
        where: {
          userId,
          analysis: {
            isNot: null,
          },
        },
      }),

      // Total job descriptions
      prisma.jobDescription.count({
        where: { userId },
      }),

      // Total matches
      prisma.matchResult.count({
        where: {
          resume: {
            userId,
          },
        },
      }),

      // Average resume score
      prisma.analysis.aggregate({
        where: {
          resume: {
            userId,
          },
        },
        _avg: {
          score: true,
        },
      }),

      // Recent resumes (last 5)
      prisma.resume.findMany({
        where: { userId },
        include: {
          analysis: {
            select: {
              score: true,
            },
          },
          matchResults: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      // Top matches (by score)
      prisma.matchResult.findMany({
        where: {
          resume: {
            userId,
          },
        },
        include: {
          resume: {
            select: {
              fileName: true,
            },
          },
          jobDescription: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          matchScore: "desc",
        },
        take: 5,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalResumes,
          analyzedResumes,
          pendingAnalysis: totalResumes - analyzedResumes,
          totalJobs,
          totalMatches,
          averageScore: averageScore._avg.score
            ? Math.round(averageScore._avg.score)
            : 0,
          recentResumes: recentResumes.map((resume) => ({
            id: resume.id,
            fileName: resume.fileName,
            fileUrl: resume.fileUrl,
            score: resume.analysis?.score || null,
            matchCount: resume.matchResults.length,
            createdAt: resume.createdAt,
          })),
          topMatches: topMatches.map((match) => ({
            id: match.id,
            resumeFileName: match.resume.fileName,
            jobTitle: match.jobDescription.title,
            matchScore: match.matchScore,
            createdAt: match.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
