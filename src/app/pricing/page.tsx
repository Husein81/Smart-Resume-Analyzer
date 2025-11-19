"use client";

import PricingCard from "@/components/subscription/PricingCard";
import { Switch } from "@/components/ui";
import { Limit, Plan } from "@/types/schemas";
import { useSession } from "next-auth/react";
import { Activity, useState } from "react";
import { plans } from "./config";

interface PricingPlan {
  name: Plan;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: Limit;
  popular?: boolean;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.name === "FREE") {
      return;
    }

    if (!session) {
      window.location.href = "/sign-in?redirect=/pricing";
      return;
    }

    try {
      setProcessingPlan(plan.name);

      // Get Stripe price ID from environment variables
      const priceId =
        billingPeriod === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_YEARLY;

      if (!priceId) {
        console.error("Stripe price ID not configured");
        alert("Payment configuration error. Please contact support.");
        return;
      }

      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of your resume with AI-powered analysis and
          unlimited job matching.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span
          className={`text-sm font-medium ${
            billingPeriod === "monthly"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Monthly
        </span>
        <Switch
          checked={billingPeriod === "yearly"}
          onCheckedChange={(checked) =>
            setBillingPeriod(checked ? "yearly" : "monthly")
          }
        />
        <span
          className={`text-sm font-medium ${
            billingPeriod === "yearly"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Yearly
        </span>
        <Activity mode={billingPeriod === "yearly" ? "visible" : "hidden"}>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Save 17%
          </span>
        </Activity>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            {...plan}
            currentPlan={session?.user?.plan === plan.name}
            billingPeriod={billingPeriod}
            onSelect={() => handleSelectPlan(plan)}
            isLoading={processingPlan === plan.name}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-20">
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Can I upgrade or downgrade at any time?
            </h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade to Premium at any time. If you need to
              cancel, you can do so from your subscription settings, and
              you&apos;ll retain access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              What happens when I reach my free plan limits?
            </h3>
            <p className="text-muted-foreground">
              You&apos;ll be prompted to upgrade to Premium to continue using
              the feature. Your existing data is safe and will be accessible
              once you upgrade.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Do monthly limits reset?
            </h3>
            <p className="text-muted-foreground">
              Yes, usage limits for analyses and matches reset on the 1st of
              each month. Resume and job description limits are cumulative
              totals.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Is my payment information secure?
            </h3>
            <p className="text-muted-foreground">
              Absolutely. We use Stripe for payment processing, which is PCI DSS
              Level 1 certified. We never store your credit card information on
              our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
