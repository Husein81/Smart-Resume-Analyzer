"use client";

import Icon from "@/components/icon";
import UsageBadge from "@/components/subscription/UsageBadge";
import { Badge, Button, Shad } from "@/components/ui";
import { useGetUsage } from "@/hooks/subscriptions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Activity, useState } from "react";

export default function SubscriptionClient({ success }: { success?: boolean }) {
  const { data: session } = useSession();
  const [managingBilling] = useState(false);
  const { data: usage } = useGetUsage();

  if (!session) {
    return null;
  }

  const usages = usage && [
    {
      feature: "Resume Uploads",
      used: Number(usage.limits.resumes.used),
      limit: usage.limits.resumes.limit,
      plan: usage.plan,
      icon: "FileText",
      showProgress: usage.plan === "FREE",
    },
    {
      feature: "AI Analysis (Monthly)",
      used: Number(usage.limits.analysisPerMonth.used),
      limit: usage.limits.analysisPerMonth.limit,
      plan: usage.plan,
      icon: "Sparkles",
    },
    {
      feature: "Job Matches (Monthly)",
      used: Number(usage.limits.matchesPerMonth.used),
      limit: usage.limits.matchesPerMonth.limit,
      plan: usage.plan,
      icon: "Target",
    },
    {
      feature: "Saved Jobs",
      used: Number(usage.limits.jobDescriptions.used),
      limit: usage.limits.jobDescriptions.limit,
      plan: usage.plan,
      icon: "Briefcase",
      showProgress: usage.plan === "FREE",
    },
  ];

  const handleManageBilling = async () => {
    try {
      // TODO: Implement manage billing functionality
    } catch (error) {
      console.error("Error managing billing:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Success Message */}
      <Activity mode={success ? "visible" : "hidden"}>
        <Shad.Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-950">
          <Shad.CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                <Icon name="Check" className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Subscription Activated!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Welcome to Premium! You now have unlimited access to all
                  features.
                </p>
              </div>
            </div>
          </Shad.CardContent>
        </Shad.Card>
      </Activity>

      <div className="grid gap-8">
        {/* Current Plan */}
        <Shad.Card>
          <Shad.CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Shad.CardTitle className="text-2xl">
                  Current Plan
                </Shad.CardTitle>
                <Shad.CardDescription>
                  Manage your subscription and billing
                </Shad.CardDescription>
              </div>
              {session.user.plan === "PREMIUM" ? (
                <Badge className="bg-linear-to-r from-violet to-pink text-white px-4 py-2">
                  <Icon name="Crown" className="w-4 h-4 mr-2" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-4 py-2">
                  Free
                </Badge>
              )}
            </div>
          </Shad.CardHeader>
          <Shad.CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {session.user.plan === "PREMIUM"
                    ? "You have access to all premium features"
                    : "Upgrade to unlock unlimited features"}
                </p>
              </div>
              <div className="flex gap-2">
                {session.user.plan === "PREMIUM" ? (
                  <Button
                    onClick={handleManageBilling}
                    variant="outline"
                    disabled={managingBilling}
                  >
                    {managingBilling ? (
                      <>
                        <Icon
                          name="Loader"
                          className="w-4 h-4 mr-2 animate-spin"
                        />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Icon name="Settings" className="w-4 h-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/pricing">
                      <Icon name="Crown" className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Shad.CardContent>
        </Shad.Card>

        {/* Usage Statistics */}
        <Shad.Card>
          <Shad.CardHeader>
            <Shad.CardTitle>Usage & Limits</Shad.CardTitle>
            <Shad.CardDescription>
              Track your feature usage and remaining quota
            </Shad.CardDescription>
          </Shad.CardHeader>
          <Shad.CardContent>
            {usage ? (
              <div className="grid gap-6 md:grid-cols-2">
                {usages?.map((u) => (
                  <UsageBadge
                    key={u.feature}
                    feature={u.feature}
                    used={u.used}
                    limit={u.limit}
                    plan={u.plan}
                    icon={u.icon}
                    showProgress={u.showProgress}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Failed to load usage data
              </p>
            )}
          </Shad.CardContent>
        </Shad.Card>

        {/* Benefits */}
        {session.user.plan === "FREE" && (
          <Shad.Card className="border-primary/50">
            <Shad.CardHeader>
              <Shad.CardTitle>Unlock Premium Features</Shad.CardTitle>
              <Shad.CardDescription>
                Upgrade now and get unlimited access
              </Shad.CardDescription>
            </Shad.CardHeader>
            <Shad.CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="flex items-start gap-3">
                  <Icon
                    name="Check"
                    className="w-5 h-5 text-primary shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-medium">Unlimited Uploads</p>
                    <p className="text-sm text-muted-foreground">
                      Upload as many resumes as you need
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon
                    name="Check"
                    className="w-5 h-5 text-primary shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-medium">Unlimited AI Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Get instant AI-powered insights
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon
                    name="Check"
                    className="w-5 h-5 text-primary shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-medium">Unlimited Matching</p>
                    <p className="text-sm text-muted-foreground">
                      Match resumes with unlimited jobs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon
                    name="Check"
                    className="w-5 h-5 text-primary shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-medium">Priority Support</p>
                    <p className="text-sm text-muted-foreground">
                      Get help when you need it
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href="/pricing">
                  <Icon name="Crown" className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Link>
              </Button>
            </Shad.CardContent>
          </Shad.Card>
        )}
      </div>
    </div>
  );
}
