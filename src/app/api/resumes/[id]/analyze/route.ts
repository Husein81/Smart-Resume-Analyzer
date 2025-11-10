import { groq } from "@/lib/groq";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: params.id },
    });

    if (!resume?.parsedText) {
      return NextResponse.json(
        { error: "No resume to analyze" },
        { status: 404 }
      );
    }

    const prompt = `
      Analyze the following resume text and return a JSON object with:
      - summary
      - skills (list)
      - experience (list)
      - education (list)
      - score (integer 0–100)

      Resume text:
      ${resume.parsedText}
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const aiText = completion.choices[0]?.message?.content;
    const analysisData = JSON.parse(aiText || "{}");

    const analysis = await prisma.analysis.create({
      data: {
        resumeId: params.id,
        ...analysisData,
        aiModel: "llama-3.3-70b-versatile",
      },
    });

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
