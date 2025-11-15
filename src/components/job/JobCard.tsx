"use client";

import { Badge } from "@/components/ui/badge";
import { Shad } from "@/components/ui";
import { Button } from "@/components/ui/button";
import Icon from "../icon";
import { useDeleteJob } from "@/hooks/matches";
import { Activity } from "react";
import { JobDescription } from "@/types/resume";
import MatchResultCard from "../match/MatchResultCard";

type JobCardProps = {
  job: JobDescription;
  onSelect: (jobId: string) => void;
  isLoading?: boolean;
  isSelected?: boolean;
};

export default function JobCard({
  job,
  onSelect,
  isLoading = false,
  isSelected = false,
}: JobCardProps) {
  const { id, title, description, skills, createdAt } = job;

  const deleteJob = useDeleteJob();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (id: string) => await deleteJob.mutateAsync(id);
  console.log(job.matchResults);
  const match =
    job.matchResults && job.matchResults.find((m) => id === m.jobDescriptionId);

  return (
    <Shad.Card
      className={`w-full border shadow-sm hover:shadow-lg transition-all duration-300 group ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border/50 hover:border-primary/50"
      }`}
    >
      <Shad.CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg shrink-0 transition-colors ${
              isSelected
                ? "bg-primary/20"
                : "bg-primary/10 group-hover:bg-primary/20"
            }`}
          >
            <Icon name="Briefcase" className="text-primary size-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-normal text-muted-foreground">
              {job.companyName}
            </span>
            <Shad.CardTitle className="text-base font-semibold line-clamp-2 mb-1">
              {title}
            </Shad.CardTitle>
            <Shad.CardDescription className="text-xs flex items-center gap-1.5">
              <Icon name="Calendar" className="w-3 h-3" />
              {formatDate(createdAt ?? new Date())}
            </Shad.CardDescription>
          </div>
          <Button variant={"outline"} onClick={() => handleDelete(id ?? "")}>
            <Icon
              name="Trash2"
              className="text-destructive hover:text-destructive/90"
            />
          </Button>
        </div>
      </Shad.CardHeader>

      <Shad.CardContent className="space-y-3 flex-1">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {description}
        </p>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-0.5"
              >
                {skill}
              </Badge>
            ))}
            {skills.length > 4 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{skills.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
          <Icon name="FileCheck" className="w-3.5 h-3.5" />
          <span>{skills.length} skills required</span>
        </div>
      </Shad.CardContent>

      <Shad.CardFooter>
        <Activity
          mode={
            job.matchResults && job.matchResults.length > 0
              ? "hidden"
              : "visible"
          }
        >
          <Button
            onClick={() => onSelect(id ?? "")}
            disabled={isLoading}
            className="w-full"
            variant={isSelected ? "secondary" : "default"}
          >
            {isLoading ? (
              <>
                <Icon name="Loader" className="w-4 h-4 mr-2 animate-spin" />
                Matching...
              </>
            ) : isSelected ? (
              <>
                <Icon name="Check" className="w-4 h-4 mr-2" />
                Selected
              </>
            ) : (
              <>
                <Icon name="Target" className="w-4 h-4 mr-2" />
                Match with this Job
              </>
            )}
          </Button>
        </Activity>
        <Activity
          mode={
            job.matchResults && job.matchResults.length > 0
              ? "visible"
              : "hidden"
          }
        >
          <div className="flex flex-col gap-2 w-full">
            <div className="text-center w-full text-sm font-medium bg-linear-to-r from-violet to-pink bg-clip-text text-transparent">
              <Icon name="Award" className="w-6 h-6 mx-auto mb-1 text-violet" />
              Match Score: {match?.matchScore}%
            </div>
            <Shad.Dialog>
              <Shad.DialogTrigger asChild>
                <Button>
                  <Icon name="Eye" className="size-5" />
                  View Result
                </Button>
              </Shad.DialogTrigger>
              <Shad.DialogContent className="w-full max-w-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Shad.DialogTitle>
                      <span className="text-2xl font-bold">Match Results</span>
                    </Shad.DialogTitle>
                    <Button variant="outline" size={"sm"} className="mr-4">
                      <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                      Match Another Job
                    </Button>
                  </div>
                  <div className="h-164 overflow-y-auto">
                    {match && <MatchResultCard match={match} />}
                  </div>
                </div>
              </Shad.DialogContent>
            </Shad.Dialog>
          </div>
        </Activity>
      </Shad.CardFooter>
    </Shad.Card>
  );
}
