"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/icon";
import { Plan } from "@/types/schemas";

interface UsageBadgeProps {
  feature: string;
  used: number;
  limit: number | string;
  plan: Plan;
  icon?: string;
  showProgress?: boolean;
}

export default function UsageBadge({
  feature,
  used,
  limit,
  plan,
  icon = "Activity",
  showProgress = true,
}: UsageBadgeProps) {
  const isUnlimited = limit === Infinity || limit === "Unlimited";
  const percentage = isUnlimited ? 100 : (used / Number(limit)) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getVariant = () => {
    if (plan === "PREMIUM") return "default";
    if (isAtLimit) return "destructive";
    if (isNearLimit) return "outline";
    return "secondary";
  };

  const displayLimit = isUnlimited ? "Unlimited" : limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{feature}</span>
        </div>
        <Badge variant={getVariant()} className="text-xs">
          {used} / {displayLimit}
        </Badge>
      </div>

      {showProgress && !isUnlimited && (
        <Progress value={Math.min(percentage, 100)} className="h-2" />
      )}

      {isAtLimit && !isUnlimited && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <Icon name="CircleAlert" className="w-3 h-3" />
          Limit reached. Upgrade to continue.
        </p>
      )}
    </div>
  );
}
