"use client";

import { Badge } from "@/components/ui/badge";
import { Shad, Progress } from "@/components/ui";
import Icon from "../icon";
import { MatchResult } from "@/types/schemas";

type Props = {
  match: MatchResult;
};

export default function MatchResultCard({ match }: Props) {
  const {
    matchScore,
    missingSkills,
    suggestedEdits,
    aiSummary,
    jobDescription,
  } = match;

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "bg-linear-to-r from-violet to-pink bg-clip-text text-transparent";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Poor Match";
  };

  return (
    <div className="space-y-6">
      {/* Match Score Header */}
      <Shad.Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
        <Shad.CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Shad.CardTitle className="text-lg mb-1">
                Match Score
              </Shad.CardTitle>
              <Shad.CardDescription>
                {jobDescription?.title || "Job Position"}
              </Shad.CardDescription>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${getScoreColor(matchScore)}`}
              >
                {matchScore}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {getScoreLabel(matchScore)}
              </div>
            </div>
          </div>
          <Progress value={matchScore} className="h-2 mt-4" />
        </Shad.CardHeader>
      </Shad.Card>

      {/* AI Summary */}
      {aiSummary && (
        <Shad.Card>
          <Shad.CardHeader>
            <Shad.CardTitle className="text-base flex items-center gap-2">
              <Icon name="Sparkles" className="w-5 h-5 text-primary" />
              AI Analysis
            </Shad.CardTitle>
          </Shad.CardHeader>
          <Shad.CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiSummary}
            </p>
          </Shad.CardContent>
        </Shad.Card>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <Shad.Card>
          <Shad.CardHeader>
            <Shad.CardTitle className="text-base flex items-center gap-2">
              <Icon name="CircleAlert" className="w-5 h-5 text-yellow-600" />
              Missing Skills
            </Shad.CardTitle>
            <Shad.CardDescription>
              Skills required for this job that aren&apos;t in your resume
            </Shad.CardDescription>
          </Shad.CardHeader>
          <Shad.CardContent>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </Shad.CardContent>
        </Shad.Card>
      )}

      {/* Suggested Edits */}
      {suggestedEdits.length > 0 && (
        <Shad.Card>
          <Shad.CardHeader>
            <Shad.CardTitle className="text-base flex items-center gap-2">
              <Icon name="Lightbulb" className="w-5 h-5 text-primary" />
              Suggested Improvements
            </Shad.CardTitle>
            <Shad.CardDescription>
              Recommendations to improve your match score
            </Shad.CardDescription>
          </Shad.CardHeader>
          <Shad.CardContent>
            <ul className="space-y-2">
              {suggestedEdits.map((edit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Icon
                    name="Dot"
                    className="w-4 h-4 text-primary mt-0.5 shrink-0"
                  />
                  <span className="text-muted-foreground">{edit}</span>
                </li>
              ))}
            </ul>
          </Shad.CardContent>
        </Shad.Card>
      )}

      {/* Job Details */}
      {jobDescription && (
        <Shad.Card>
          <Shad.CardHeader>
            <Shad.CardTitle className="text-base flex items-center gap-2">
              <Icon name="Briefcase" className="w-5 h-5 text-primary" />
              Job Requirements
            </Shad.CardTitle>
          </Shad.CardHeader>
          <Shad.CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {jobDescription.description}
              </p>
            </div>
            {jobDescription.skills && jobDescription.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {jobDescription.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Shad.CardContent>
        </Shad.Card>
      )}
    </div>
  );
}
