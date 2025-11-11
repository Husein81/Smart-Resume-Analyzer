import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Icon from "@/components/icon";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

async function getResumeStats() {
  try {
    const [totalResumes, analyzedResumes, allResumes] = await Promise.all([
      prisma.resume.count(),
      prisma.resume.count({
        where: {
          analysis: {
            isNot: null,
          },
        },
      }),
      prisma.resume.findMany({
        where: {
          analysis: {
            isNot: null,
          },
        },
        include: {
          analysis: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

    const avgScore =
      allResumes.length > 0
        ? Math.round(
            allResumes.reduce((acc, r) => acc + (r.analysis?.score || 0), 0) /
              allResumes.length
          )
        : 0;

    return {
      totalResumes,
      avgScore,
      analyzed: analyzedResumes,
      recentResumes: allResumes,
    };
  } catch (error) {
    console.error("Error fetching resume stats:", error);
    return {
      totalResumes: 0,
      avgScore: 0,
      analyzed: 0,
      recentResumes: [],
    };
  }
}

export default async function Home() {
  const stats = await getResumeStats();
  const session = await getServerSession();
  const user = session?.user || null;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <Badge
              variant="outline"
              className="mx-auto px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5"
            >
              <Icon name="Sparkles" className="w-4 h-4 mr-2" />
              AI-Powered Resume Analysis
            </Badge>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-linear-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Transform Your Resume
              <br />
              <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Land Your Dream Job
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get instant AI-powered feedback on your resume, optimize for ATS
              systems, and match with the perfect job opportunities. Stand out
              from the crowd.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" className="gap-2 px-8 h-12 text-base" asChild>
                <Link href={user ? "/upload" : "/sign-in"}>
                  <Icon name="Upload" className="w-5 h-5" />
                  Upload Resume
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 h-12 text-base"
                asChild
              >
                <Link href={user ? "/resumes" : "/sign-in"}>
                  <Icon name="FileText" className="w-5 h-5" />
                  View All Resumes
                </Link>
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-center">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">
                  {stats.totalResumes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Resumes
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">
                  {stats.avgScore}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Score
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">
                  {stats.analyzed}
                </div>
                <div className="text-sm text-muted-foreground">
                  Analyzed Today
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create the perfect resume and land your
              dream job
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon name="Brain" className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Get instant feedback powered by advanced AI. Understand your
                strengths and areas to improve.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon name="Target" className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Job Matching</h3>
              <p className="text-muted-foreground">
                Match your resume with job descriptions. See compatibility
                scores and missing skills.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon name="Zap" className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ATS Optimized</h3>
              <p className="text-muted-foreground">
                Ensure your resume passes Applicant Tracking Systems with our
                optimization suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground">
              Upload your resume now and get instant AI-powered feedback to help
              you stand out.
            </p>
            <Button size="lg" className="gap-2 px-8 h-12" asChild>
              <Link href={user ? "/upload" : "/sign-in"}>
                <Icon name="Upload" className="w-5 h-5" />
                Upload Your Resume
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
