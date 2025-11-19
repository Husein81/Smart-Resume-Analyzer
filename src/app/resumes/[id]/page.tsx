import ResumesDetailsPage from "./ResumeDetailsPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Resume } from "@/types/schemas";

const getResumeById = async (id: string, userId: string): Promise<Resume> => {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        analysis: true,
        matchResults: {
          include: {
            jobDescription: true,
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Check ownership
    if (resume.userId !== userId) {
      throw new Error("Unauthorized access");
    }

    return resume;
  } catch (error) {
    console.error("Error fetching resume:", error);
    throw error;
  }
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const resume = await getResumeById(id, session.user.id);

  return <ResumesDetailsPage resume={resume} />;
}
