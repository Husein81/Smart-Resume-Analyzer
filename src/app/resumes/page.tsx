"use client";

import Empty from "@/components/Empty";
import Icon from "@/components/icon";
import ResumeCard from "@/components/resume/ResumeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useResumes } from "@/hooks/resumes";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function ResumesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data, isLoading, error } = useResumes({ limit: 100 });

  // Filter and sort resumes
  const filteredResumes = useMemo(() => {
    const resumes = data?.data || [];
    return resumes
      .filter((resume) =>
        resume.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "highest-score":
            return (b.analysis?.score || 0) - (a.analysis?.score || 0);
          case "lowest-score":
            return (a.analysis?.score || 0) - (b.analysis?.score || 0);
          default:
            return 0;
        }
      });
  }, [data?.data, searchQuery, sortBy]);

  if (isLoading || error) {
    return (
      <div className="flex items-center h-64 justify-center">
        <Spinner className="size-12" />
      </div>
    );
  }

  const avgScore =
    data?.data &&
    Math.round(
      data?.data?.reduce((acc, r) => acc + (r.analysis?.score || 0), 0) /
        data?.data?.length
    );

  const stats = [
    {
      title: "Total Resumes",
      icon: "FileText",
      value: data?.data?.length,
    },
    {
      title: "Analyzed",
      icon: "CircleCheck",
      value: data?.data?.filter((r) => r.analysis).length,
    },
    {
      title: "Avg Score",
      icon: "TrendingUp",
      value: data?.data && (isNaN(Number(avgScore)) ? 0 : avgScore) + "%",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Resumes</h1>
            <p className="text-muted-foreground">
              Manage and analyze your uploaded resumes
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/upload">
              <Icon name="Plus" className="w-5 h-5 mr-2" />
              Upload New Resume
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.title} className="p-6 rounded-lg border bg-card">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Icon name={stat.icon} className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            />
            <Input
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest-score">Highest Score</SelectItem>
              <SelectItem value="lowest-score">Lowest Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          </div>
        ) : filteredResumes && filteredResumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        ) : (
          <Empty
            title="No resumes found"
            icon="FileX"
            description={
              searchQuery
                ? "Try adjusting your search"
                : "Upload your first resume to get started"
            }
            backTo="/upload"
          />
        )}
      </div>
    </div>
  );
}
