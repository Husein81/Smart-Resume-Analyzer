import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/**
 * POST /api/subscription/portal
 * Create a Stripe billing portal session
 */
export async function POST() {
  try {
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user's Stripe customer
    const customers = await stripe.customers.list({
      email: authSession.user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const customerId = customers.data[0].id;

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/subscription`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      {
        error: "Failed to create portal session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
