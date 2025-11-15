import { MatchResult } from "@/types/resume";
import { PaginationResponse } from "@/types/schemas";

export const matchesServer = {
  createMatch: async (data: {
    resumeId: string;
    jobId: string;
  }): Promise<{ success: boolean; match: MatchResult; message: string }> => {
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create match");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  },

  getMatches: async (params: {
    resumeId?: string;
    jobId?: string;
    minScore?: number;
    limit?: number;
    offset?: number;
  }): Promise<PaginationResponse<MatchResult>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.resumeId) queryParams.set("resumeId", params.resumeId);
      if (params.jobId) queryParams.set("jobId", params.jobId);
      if (params.minScore !== undefined)
        queryParams.set("minScore", params.minScore.toString());
      if (params.limit) queryParams.set("limit", params.limit.toString());
      if (params.offset) queryParams.set("offset", params.offset.toString());

      const response = await fetch(`/api/matches?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  getMatchById: async (
    id: string
  ): Promise<{ success: boolean; match: MatchResult }> => {
    try {
      const response = await fetch(`/api/matches/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch match");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching match:", error);
      throw error;
    }
  },

  deleteMatch: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete match");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      throw error;
    }
  },
};
