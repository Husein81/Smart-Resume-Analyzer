import { resumesServer } from "@/server/resumes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useResumes = (params: { limit?: number }) =>
  useQuery({
    queryKey: ["resumes", params],
    queryFn: () => resumesServer.getResumes(params),
  });

export const useResumeById = (id: string) =>
  useQuery({
    queryKey: ["resume", id],
    queryFn: () => resumesServer.getResumeById(id),
  });

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => resumesServer.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
};

export const useAnalyzeResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { resumeId: string; jobDescription: string }) =>
      resumesServer.analyzeResume(data.resumeId, data.jobDescription),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["resume", variables.resumeId],
      });
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumesServer.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
};
