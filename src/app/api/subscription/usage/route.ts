import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { getUserLimits } from "@/lib/subscription";

/**
 * GET /api/subscription/usage
 * Get current usage statistics for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getUserLimits(authSession.user.id);

    return NextResponse.json({
      success: true,
      ...usage,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
