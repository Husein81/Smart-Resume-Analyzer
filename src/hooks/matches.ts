import { jobsServer } from "@/server/jobs";
import { matchesServer } from "@/server/matches";
import type { JobDescription } from "@/types/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useJobs = (params: { limit?: number; offset?: number }) =>
  useQuery({
    queryKey: ["jobs", params],
    queryFn: () => jobsServer.getJobs(params),
  });

export const useJobById = (id: string) =>
  useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsServer.getJobById(id),
    enabled: !!id,
  });

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JobDescription>) => jobsServer.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsServer.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
};

export const useCreateMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { resumeId: string; jobId: string }) =>
      matchesServer.createMatch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({
        queryKey: ["matches", { resumeId: variables.resumeId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["resume", variables.resumeId],
      });
    },
  });
};

export const useMatches = (params: {
  resumeId?: string;
  jobId?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
}) =>
  useQuery({
    queryKey: ["matches", params],
    queryFn: () => matchesServer.getMatches(params),
  });

export const useMatchById = (id: string) =>
  useQuery({
    queryKey: ["match", id],
    queryFn: () => matchesServer.getMatchById(id),
    enabled: !!id,
  });

export const useDeleteMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matchesServer.deleteMatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
};
