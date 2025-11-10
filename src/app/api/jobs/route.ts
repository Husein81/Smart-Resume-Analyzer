import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, title, description, skills } =
      (await req.json()) as Prisma.JobDescriptionCreateInput & {
        userId: string;
      };

    const job = await prisma.jobDescription.create({
      data: { userId, title, description, skills },
    });

    return NextResponse.json({ success: true, job });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create job description" },
      { status: 500 }
    );
  }
}
