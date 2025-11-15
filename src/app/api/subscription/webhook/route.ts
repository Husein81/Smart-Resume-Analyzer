import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // Update user plan to PREMIUM
  await prisma.user.update({
    where: { id: userId },
    data: { plan: "PREMIUM" },
  });

  // Create subscription record
  if (session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;

    await prisma.subscription.create({
      data: {
        userId,
        plan: "PREMIUM",
        status: "active",
        paymentId: subscriptionId,
        startDate: new Date(),
      },
    });
  }

  console.log(`User ${userId} upgraded to PREMIUM`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const status = subscription.status;
  const plan = status === "active" ? "PREMIUM" : "FREE";

  // Update user plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  });

  // Update subscription record
  await prisma.subscription.updateMany({
    where: {
      userId,
      paymentId: subscription.id,
    },
    data: {
      status: subscription.status,
      endDate: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : null,
    },
  });

  console.log(`Subscription ${subscription.id} updated for user ${userId}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  // Downgrade user to FREE
  await prisma.user.update({
    where: { id: userId },
    data: { plan: "FREE" },
  });

  // Update subscription record
  await prisma.subscription.updateMany({
    where: {
      userId,
      paymentId: subscription.id,
    },
    data: {
      status: "canceled",
      endDate: new Date(),
    },
  });

  console.log(`User ${userId} downgraded to FREE`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.log("No userId in invoice metadata");
    return;
  }

  console.log(`Payment succeeded for user ${userId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId;

  if (!userId) {
    console.log("No userId in invoice metadata");
    return;
  }

  console.error(`Payment failed for user ${userId}`);
  // You might want to send an email notification here
}
