"use client";

import { useState, useEffect } from "react";
import ResumeCard from "@/components/resume/ResumeCard";
import { Resume } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/icon";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch resumes from API
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch("/api/resumes?limit=100");
        if (response.ok) {
          const data = await response.json();
          // API returns { success, resumes, pagination }
          setResumes(data.resumes || []);
        } else {
          console.error("Failed to fetch resumes:", response.status);
        }
      } catch (error) {
        console.error("Error fetching resumes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  // Filter and sort resumes
  const filteredResumes = resumes
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
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon name="FileText" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumes.length}</p>
                <p className="text-sm text-muted-foreground">Total Resumes</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon name="CircleCheck" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {resumes.filter((r) => r.analysis).length}
                </p>
                <p className="text-sm text-muted-foreground">Analyzed</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon name="TrendingUp" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(
                    resumes.reduce(
                      (acc, r) => acc + (r.analysis?.score || 0),
                      0
                    ) / resumes.length
                  )}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </div>
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
        {loading ? (
          <div className="text-center py-12">
            <Icon
              name="Loader"
              className="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
            />
            <Spinner />
          </div>
        ) : filteredResumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Icon name="FileX" className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No resumes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Upload your first resume to get started"}
            </p>
            <Button asChild>
              <Link href="/upload">
                <Icon name="Upload" className="w-4 h-4 mr-2" />
                Upload Resume
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
