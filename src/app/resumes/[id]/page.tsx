import ResumesDetailsPage from "./ResumeDetailsPage";
import { cookies } from "next/headers";

const getResumeById = async (id: string) => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("next-auth.session-token");

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      }/resumes/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie
            ? `next-auth.session-token=${sessionCookie.value}`
            : "",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch resume");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching resume:", error);
    return null;
  }
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resume = await getResumeById(id);

  return <ResumesDetailsPage resume={resume} />;
}
