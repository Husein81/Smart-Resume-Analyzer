import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/**
 * POST /api/subscription/create-checkout
 * Create a Stripe checkout session
 */
export async function POST(req: NextRequest) {
  try {
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, mode = "subscription" } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string | undefined;

    // Check if user already has a Stripe customer ID stored
    // You might want to add a stripeCustomerId field to your User model
    // For now, we'll search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: authSession.user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: authSession.user.email,
        name: authSession.user.name,
        metadata: {
          userId: authSession.user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_API_URL}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/pricing?canceled=true`,
      metadata: {
        userId: authSession.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
