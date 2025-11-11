"use client";

import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAnalyzeResume, useResumeById } from "@/hooks/resumes";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;

  const [jobDescription, setJobDescription] = useState("");
  const [progress, setProgress] = useState(0);

  const { data: resume, isLoading } = useResumeById(resumeId);
  const analyzeResume = useAnalyzeResume();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Icon
            name="Loader"
            className="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
          />
          <p className="text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="FileX" className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Resume Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The resume you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/resumes">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Resumes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setProgress(0);
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await analyzeResume.mutateAsync({
        resumeId,
        jobDescription: jobDescription ?? "",
      });

      clearInterval(progressInterval);

      setProgress(100);
      // Wait a moment to show 100% progress
      setTimeout(() => {
        router.push(`/resumes/${resumeId}`);
      }, 500);
    } catch (err) {
      console.error(err);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
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
          <h1 className="text-4xl font-bold mb-2">Analyze Resume</h1>
          <p className="text-muted-foreground">{resume.fileName}</p>
        </div>

        {/* Main Card */}
        <div className="p-8 rounded-lg border bg-card space-y-6">
          {/* AI Analysis Info */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon name="Sparkles" className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">AI-Powered Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our AI will analyze your resume and provide detailed insights
                including:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="w-4 h-4 text-green-600" />
                  Overall quality score (0-100)
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="w-4 h-4 text-green-600" />
                  Extracted skills and competencies
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="w-4 h-4 text-green-600" />
                  Experience and education breakdown
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="w-4 h-4 text-green-600" />
                  ATS compatibility check
                </li>
              </ul>
            </div>
          </div>

          {/* Optional Job Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Briefcase" className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Job Description (Optional)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Add a job description to get targeted analysis and matching
              insights for a specific role.
            </p>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="resize-none"
              disabled={analyzeResume.isPending}
            />
          </div>

          {/* Progress Bar */}
          {analyzeResume.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Analyzing resume...
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {analyzeResume.error?.message && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <Icon
                name="CircleAlert"
                className="w-5 h-5 text-destructive shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-1">
                  Analysis Failed
                </h4>
                <p className="text-sm text-destructive/90">
                  {analyzeResume.error.message}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={analyzeResume.isPending}
              className="flex-1"
            >
              {analyzeResume.isPending ? (
                <>
                  <Icon name="Loader" className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" className="w-5 h-5 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={analyzeResume.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon name="Zap" className="w-4 h-4 text-primary" />
              </div>
              <h4 className="font-semibold">Fast</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Get results in seconds with our optimized AI model
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon name="Shield" className="w-4 h-4 text-primary" />
              </div>
              <h4 className="font-semibold">Secure</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and never shared with third parties
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon name="Target" className="w-4 h-4 text-primary" />
              </div>
              <h4 className="font-semibold">Accurate</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by advanced AI trained on thousands of resumes
            </p>
          </div>
        </div>

        {/* Existing Analysis Notice */}
        {resume.analysis && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Icon
              name="Info"
              className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-600 mb-1">
                Previous Analysis Found
              </h4>
              <p className="text-sm text-blue-600/90">
                This resume was analyzed on{" "}
                {new Date(resume.analysis.createdAt || "").toLocaleDateString()}
                . Starting a new analysis will replace the previous results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
