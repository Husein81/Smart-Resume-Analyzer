import { Button, Badge, Shad } from "@/components/ui";
import Icon from "@/components/icon";
import { Limit, Plan } from "@/types/schemas";

interface Props {
  name: Plan;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: Limit;
  popular?: boolean;
  currentPlan?: boolean;
  billingPeriod?: "monthly" | "yearly";
  onSelect?: () => void;
  isLoading?: boolean;
}

export default function PricingCard({
  name,
  displayName,
  price,
  features,
  popular,
  currentPlan,
  billingPeriod = "monthly",
  onSelect,
  isLoading,
}: Props) {
  const currentPrice =
    billingPeriod === "monthly" ? price.monthly : price.yearly;
  const savings =
    billingPeriod === "yearly" && price.monthly > 0
      ? Math.round((1 - price.yearly / (price.monthly * 12)) * 100)
      : 0;

  return (
    <Shad.Card
      className={`relative flex flex-col ${
        popular ? "border-primary border-2 shadow-lg" : ""
      } ${currentPlan ? "border-primary/50" : ""}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-linear-to-r from-violet to-pink text-white px-4 py-1">
            <Icon name="Star" className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {currentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary">
            <Icon name="Check" className="w-3 h-3 mr-1" />
            Current Plan
          </Badge>
        </div>
      )}

      <Shad.CardHeader>
        <Shad.CardTitle className="text-2xl">{displayName}</Shad.CardTitle>
        <Shad.CardDescription className="text-3xl font-bold mt-2">
          ${currentPrice}
          <span className="text-base font-normal text-muted-foreground">
            /{billingPeriod === "monthly" ? "month" : "year"}
          </span>
        </Shad.CardDescription>
        {savings > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Save {savings}% with yearly billing
          </p>
        )}
      </Shad.CardHeader>

      <Shad.CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Icon
                name="Check"
                className="w-5 h-5 text-primary shrink-0 mt-0.5"
              />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </Shad.CardContent>

      <Shad.CardFooter>
        <Button
          onClick={onSelect}
          disabled={currentPlan || isLoading}
          className="w-full"
          variant={popular && !currentPlan ? "default" : "outline"}
          size="lg"
        >
          {isLoading ? (
            <>
              <Icon name="Loader" className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : currentPlan ? (
            "Current Plan"
          ) : name === "FREE" ? (
            "Get Started"
          ) : (
            "Upgrade Now"
          )}
        </Button>
      </Shad.CardFooter>
    </Shad.Card>
  );
}
