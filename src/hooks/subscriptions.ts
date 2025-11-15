import { subscriptionServer } from "@/server/subscriptions";
import { useQuery } from "@tanstack/react-query";

export const useGetUsage = () =>
  useQuery({
    queryKey: ["usage"],
    queryFn: () => subscriptionServer.getUsage(),
  });
