import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  return <SubscriptionClient success={success === "true"} />;
}
