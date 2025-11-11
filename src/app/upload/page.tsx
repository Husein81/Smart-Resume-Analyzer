"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Icon from "@/components/icon";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload successful:", data);
        router.push(`/resumes/${data.id}`);
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Upload Your Resume</h1>
          <p className="text-muted-foreground text-lg">
            Upload your resume to get instant AI-powered analysis and feedback
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Resume File</CardTitle>
            <CardDescription>
              Supported formats: PDF, DOCX, DOC, TXT (Max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }
                ${selectedFile ? "bg-primary/5" : ""}
              `}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="FileText" className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Icon
                      name="Upload"
                      className="w-8 h-8 text-muted-foreground"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      Drag & drop your resume here
                    </p>
                    <p className="text-muted-foreground">or</p>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileSelect}
                    />
                    <Button asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Icon name="FileText" className="w-4 h-4 mr-2" />
                        Browse Files
                      </label>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            {selectedFile && (
              <Button
                size="lg"
                className="w-full"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Icon name="Loader" className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" className="w-5 h-5 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Icon name="Zap" className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">Instant Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI feedback in seconds
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Icon name="Shield" className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is protected
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Icon name="Target" className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">ATS Optimized</h3>
                <p className="text-sm text-muted-foreground">
                  Beat tracking systems
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
