import { JobDescription } from "@/types/resume";
import { PaginationResponse } from "@/types/schemas";

export const jobsServer = {
  getJobs: async (params: {
    limit?: number;
    offset?: number;
  }): Promise<PaginationResponse<JobDescription>> => {
    try {
      const queryParams = new URLSearchParams({
        limit: (params.limit || 20).toString(),
        offset: (params.offset || 0).toString(),
      });
      const response = await fetch(`/api/jobs?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  getJobById: async (
    id: string
  ): Promise<{ success: boolean; job: JobDescription }> => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  },

  createJob: async (
    data: Partial<JobDescription>
  ): Promise<{ success: boolean; job: JobDescription }> => {
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create job");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  deleteJob: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  },
};
