import { Resume, PaginationResponse } from "@/types/schemas";
import { toast } from "react-toastify";

export const resumesServer = {
  getResumes: async (params: {
    limit?: number;
  }): Promise<PaginationResponse<Resume>> => {
    try {
      const response = await fetch(`/api/resumes?limit=${params.limit || 100}`);
      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching resumes:", error);
      throw error;
    }
  },
  getResumeById: async (id: string): Promise<Resume> => {
    try {
      const response = await fetch(`/api/resumes/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch resume");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching resume:", error);
      throw error;
    }
  },
  uploadResume: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload resume");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading resume:", error);
    }
  },
  analyzeResume: async (id: string, jobDescription?: string) => {
    try {
      const response = await fetch(`/api/resumes/${id}/analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription: jobDescription || undefined,
        }),
      });
      if (!response.ok) {
        toast.error("Failed to analyze resume");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error analyzing resume:", error);
    }
  },
  deleteResume: async (id: string) => {
    try {
      await fetch(`/api/resumes/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error(error);
    }
  },
};
