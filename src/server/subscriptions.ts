import { UsageLimits } from "@/types/schemas";

export const subscriptionServer = {
  getUsage: async (): Promise<UsageLimits> => {
    try {
      const response = await fetch(`/api/subscription/usage`);
      if (!response.ok) {
        throw new Error("Failed to fetch usage data");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },
};
