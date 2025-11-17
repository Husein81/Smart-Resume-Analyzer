"use client";

import { Badge, Shad, Button, Progress } from "@/components/ui";
import { Resume } from "@/types/schemas";
import Link from "next/link";
import Icon from "../icon";
import { Activity, useState } from "react";
import { useDeleteResume } from "@/hooks/resumes";

type ResumeCardProps = {
  resume: Resume;
};

export default function ResumeCard({ resume }: ResumeCardProps) {
  const { id, fileName, analysis, matchResults, createdAt } = resume;
  const [showMore, setShowMore] = useState(false);

  const deleteResume = useDeleteResume();

  // Get data from analysis if available
  const score = analysis?.score ?? null;
  const summary = analysis?.summary ?? null;
  const skills = analysis?.skills ?? [];
  const matchCount = matchResults?.length ?? 0;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    await deleteResume.mutateAsync(id);
  };

  return (
    <Shad.Card className="w-full border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/50 group">
      <Shad.CardHeader className="space-y-3 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
              <Icon name="FileText" className="text-primary w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Shad.CardTitle className="text-base w-full sm:w-48 font-semibold truncate mb-1">
                {fileName || "Untitled Resume"}
              </Shad.CardTitle>
              <Shad.CardDescription className="text-xs flex items-center gap-1.5">
                <Icon name="Calendar" className="w-3 h-3" />
                {formatDate(createdAt)}
              </Shad.CardDescription>
            </div>
          </div>

          <Activity mode={score !== null ? "visible" : "hidden"}>
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`text-2xl font-bold bg-linear-to-r from-violet to-pink bg-clip-text text-transparent`}
              >
                {score}
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          </Activity>
          <Button
            variant="outline"
            onClick={() => handleDelete(id ?? "")}
            className="size-8 p-0.5 rounded-lg"
          >
            <Icon name="Trash" className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        <Activity mode={score !== null ? "visible" : "hidden"}>
          <Progress value={score} className={`h-1.5 bg-primary/10`} />
        </Activity>
      </Shad.CardHeader>

      <Shad.CardContent className="space-y-3 flex-1">
        {/* Summary or Status */}
        {summary ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {summary}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="CircleAlert" className="w-4 h-4" />
            <span>Not analyzed yet</span>
          </div>
        )}

        {/* Skills Preview */}
        <Activity mode={skills.length > 0 ? "visible" : "hidden"}>
          <div className="flex flex-wrap gap-1.5">
            {(showMore ? skills : skills.slice(0, 3)).map(
              (skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {skill}
                </Badge>
              )
            )}
            {skills.length > 3 && (
              <Badge
                onClick={() => setShowMore(!showMore)}
                variant="outline"
                className="text-xs px-2 py-0.5 cursor-pointer"
              >
                {showMore ? `less` : `+${skills.length - 3} more`}
              </Badge>
            )}
          </div>
        </Activity>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <Activity mode={matchCount > 0 ? "visible" : "hidden"}>
            <div className="flex items-center gap-1.5">
              <Icon name="Target" className="w-3.5 h-3.5" />
              <span>
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </span>
            </div>
          </Activity>
          <Activity mode={analysis ? "visible" : "hidden"}>
            <div className="flex items-center gap-1.5">
              <Icon name="CircleCheck" className="w-3.5 h-3.5 text-green-600" />
              <span>Analyzed</span>
            </div>
          </Activity>
        </div>
      </Shad.CardContent>

      <Shad.CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/resumes/${id}`}>
            <Icon name="Eye" className="w-4 h-4 mr-1.5" />
            View
          </Link>
        </Button>
        {!analysis ? (
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/resumes/${id}/analysis`}>
              <Icon name="Sparkles" className="w-4 h-4 mr-1.5" />
              Analyze
            </Link>
          </Button>
        ) : (
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/match?resumeId=${id}`}>
              <Icon name="Target" className="w-4 h-4 mr-1.5" />
              Match
            </Link>
          </Button>
        )}
      </Shad.CardFooter>
    </Shad.Card>
  );
}
