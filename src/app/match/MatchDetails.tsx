"use client";

import Empty from "@/components/Empty";
import Icon from "@/components/icon";
import JobCard from "@/components/job/JobCard";
import JobForm from "@/components/job/JobForm";
import { Badge, Button, Shad, Spinner } from "@/components/ui";
import { useCreateMatch, useJobs } from "@/hooks/matches";
import { useResumeById } from "@/hooks/resumes";
import { cn } from "@/lib/utils";
import { getScoreColor } from "@/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MatchDetails({ resumeId }: { resumeId?: string }) {
  const router = useRouter();

  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: resume, isLoading: resumeLoading } = useResumeById(
    resumeId || ""
  );
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ limit: 20 });
  const createMatch = useCreateMatch();

  const handleSelectJob = async (jobId: string) => {
    if (!resumeId) return;

    setSelectedJobId(jobId);

    try {
      await createMatch.mutateAsync({ resumeId, jobId });
    } catch (error: unknown) {
      console.error("Match creation error:", error);
      if (error instanceof Error && error.message?.includes("already exists")) {
        alert("A match already exists for this resume and job.");
      } else {
        alert("Failed to create match. Please try again.");
      }
      setSelectedJobId(null);
    }
  };

  const jobs = jobsData?.data || [];

  // Loading state
  if (resumeLoading) {
    return (
      <div className="container mx-auto h-128 px-4 py-12">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    );
  }

  // No resume ID provided
  if (!resumeId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Empty
          title="Resume Required"
          icon="TriangleAlert"
          description="Please select a resume to match with job descriptions."
          backTo="/resumes"
        />
      </div>
    );
  }

  // Resume not found
  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Empty
          title="Resume Not Found"
          icon="FileX"
          description="The resume you are looking for does not exist."
          backTo="/resumes"
        />
      </div>
    );
  }

  // Resume not parsed
  if (!resume.parsedText) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="FileWarning" className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Resume Not Processed</h1>
          <p className="text-muted-foreground mb-6">
            This resume hasn&apos;t been processed yet. Please re-upload it or
            try analyzing it first.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/resumes">
                <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/resumes/${resumeId}`}>
                <Icon name="Eye" className="w-4 h-4 mr-2" />
                View Resume
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-2"
            >
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Match Resume with Job</h1>
            <p className="text-muted-foreground mt-2">
              Select a job description to see how well your resume matches
            </p>
          </div>
        </div>

        {/* Resume Context Card */}
        <div className="p-6 rounded-lg border-2 border-primary/20 bg-card">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon name="FileText" className="text-primary w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {resume.fileName || "Untitled Resume"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {resume.analysis ? (
                  <span className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Icon name="Star" className="w-4 h-4 text-yellow-600" />
                      ATS Score: {resume.analysis.score}/100
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="FileCheck" className="w-4 h-4" />
                      {resume.analysis.skills?.length || 0} skills identified
                    </span>
                  </span>
                ) : (
                  "Resume ready for matching"
                )}
              </p>
              {resume.analysis?.skills && resume.analysis.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {resume.analysis.skills
                    .slice(0, 6)
                    .map((skill: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  {resume.analysis.skills.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{resume.analysis.skills.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {resume.analysis && (
              <div className="text-center">
                <div
                  className={cn(
                    "text-2xl font-bold bg-clip-text text-transparent",
                    getScoreColor(resume.analysis.score)
                  )}
                >
                  {resume.analysis.score}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Match Result Display */}
        <>
          {/* Job Selection */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Select a Job to Match</h2>

            {jobsLoading ? (
              <div className="text-center py-12">
                <Icon
                  name="Loader"
                  className="w-8 h-8 mx-auto mb-4 animate-spin text-primary"
                />
                <p className="text-muted-foreground">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 rounded-lg border bg-card text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Icon
                    name="Briefcase"
                    className="w-8 h-8 text-muted-foreground"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No Job Descriptions Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create job descriptions to start matching them with your
                  resume.
                </p>
                <Button onClick={() => setShowJobForm(true)}>
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Create Job Description
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Choose a job that matches your career interests
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJobForm(true)}
                  >
                    <Icon name="Plus" className="w-4 h-4 mr-2" />
                    New Job
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSelect={handleSelectJob}
                      isLoading={
                        createMatch.isPending && selectedJobId === job.id
                      }
                      isSelected={selectedJobId === job.id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      </div>

      <Shad.Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <Shad.DialogContent className="p-6 rounded-lg w-full max-w-2xl">
          <Shad.DialogHeader>
            <Shad.DialogTitle className="text-xl font-bold">
              Create New Job Description
            </Shad.DialogTitle>
            <Shad.DialogDescription className="mb-4 text-sm text-muted-foreground">
              Fill out the form below to add a new job description for matching.
            </Shad.DialogDescription>
          </Shad.DialogHeader>
          <div className="h-128 overflow-y-auto">
            <JobForm onCancel={() => setShowJobForm(false)} />
          </div>
        </Shad.DialogContent>
      </Shad.Dialog>
    </div>
  );
}
