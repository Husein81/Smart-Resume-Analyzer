"use client";

import { useRouter } from "next/navigation";
import { Resume, MatchResult } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/icon";
import Link from "next/link";
import ScoreCircle from "@/components/resume/ScoreCircle";

type Props = {
  resume: Resume | null;
};

export default function ResumeDetailsPage({ resume }: Props) {
  const router = useRouter();

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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <h1 className="text-4xl font-bold mb-2">{resume.fileName}</h1>
            <p className="text-muted-foreground">
              Uploaded on {new Date(resume.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {!resume.analysis ? (
              <Button size="lg" asChild>
                <Link href={`/resumes/${resume.id}/analyze`}>
                  <Icon name="Sparkles" className="w-5 h-5 mr-2" />
                  Analyze Resume
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="lg" asChild>
                  <Link href={`/resumes/${resume.id}/analyze`}>
                    <Icon name="RefreshCw" className="w-5 h-5 mr-2" />
                    Re-analyze
                  </Link>
                </Button>
                <Button size="lg" asChild>
                  <Link href={`/match?resumeId=${resume.id}`}>
                    <Icon name="Target" className="w-5 h-5 mr-2" />
                    Match with Job
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Score Card */}
        {resume.analysis && (
          <div className="p-8 rounded-lg border bg-card">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="shrink-0">
                <ScoreCircle score={resume.analysis.score} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Overall Score</h2>
                <p className="text-muted-foreground mb-4">
                  {resume.analysis.summary}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    <Icon name="Brain" className="w-3 h-3 mr-1" />
                    {resume.analysis.aiModel}
                  </Badge>
                  <Badge variant="outline">
                    <Icon name="Calendar" className="w-3 h-3 mr-1" />
                    {new Date(
                      resume.analysis.createdAt || ""
                    ).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills */}
          {resume.analysis && (
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Code" className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.analysis.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {resume.analysis && (
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Briefcase" className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Experience</h3>
              </div>
              <ul className="space-y-2">
                {resume.analysis.experience.map(
                  (exp: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Icon
                        name="CircleCheck"
                        className="w-4 h-4 text-green-600 mt-1 shrink-0"
                      />
                      <span className="text-sm">{exp}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Education */}
          {resume.analysis && (
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="GraduationCap" className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Education</h3>
              </div>
              <ul className="space-y-2">
                {resume.analysis.education.map((edu: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Icon
                      name="CircleCheck"
                      className="w-4 h-4 text-green-600 mt-1 shrink-0"
                    />
                    <span className="text-sm">{edu}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Match Results */}
          {resume.matchResults && resume.matchResults.length > 0 && (
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Target" className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Job Matches</h3>
              </div>
              <div className="space-y-3">
                {resume.matchResults.map(
                  (match: MatchResult, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {match.jobDescriptionId}
                        </span>
                        <Badge variant="outline">{match.matchScore}%</Badge>
                      </div>
                      <Progress value={match.matchScore} className="h-2" />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Parsed Text */}
        {resume.parsedText && (
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="FileText" className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold">Parsed Resume Text</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted font-mono text-sm whitespace-pre-wrap">
              {resume.parsedText}
            </div>
          </div>
        )}

        {/* No Analysis Message */}
        {!resume.analysis && (
          <div className="p-8 rounded-lg border bg-card text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Sparkles" className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              Ready to Analyze Your Resume?
            </h3>
            <p className="text-muted-foreground mb-4">
              Get AI-powered insights about your resume&apos;s strengths and
              areas for improvement.
            </p>
            <Button size="lg" asChild>
              <Link href={`/resumes/${resume.id}/analyze`}>
                <Icon name="Sparkles" className="w-5 h-5 mr-2" />
                Start Analysis
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
