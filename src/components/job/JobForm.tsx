"use client";

import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import { useCreateJob } from "@/hooks/matches";
import { useForm } from "@tanstack/react-form";
import { InputField, TextareaField } from "../form-fields";
import { useState } from "react";
type JobFormProps = {
  onCancel?: () => void;
};

export default function JobForm({ onCancel }: JobFormProps) {
  const [skills, setSkills] = useState<string[]>([]);

  const createJob = useCreateJob();

  const form = useForm({
    defaultValues: {
      title: "",
      companyName: "",
      description: "",
      skills: [] as string[],
      skillInput: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createJob.mutateAsync({
          title: value.title,
          companyName: value.companyName,
          description: value.description,
          skills,
        });
      } catch (error) {
        console.error("Error creating job:", error);
      }
    },
  });

  const handleAddSkill = (skill: string) => {
    if (skills.includes(skill.trim()) || skill.trim() === "") return;
    setSkills((prev) => [...prev, skill]);
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <InputField
            label="Job Title"
            required
            field={field}
            placeholder="e.g., Software Engineer, Product Manager"
          />
        )}
      </form.Field>

      {/* Company Name */}
      <form.Field name="companyName">
        {(field) => (
          <InputField
            label="Company Name"
            required
            field={field}
            placeholder="e.g., Acme Corp, Tech Solutions"
          />
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <TextareaField
            label="Job Description"
            required
            field={field}
            placeholder="Enter the job description here..."
            className="min-h-[120px]"
          />
        )}
      </form.Field>

      {/* Skills */}
      <form.Field name="skillInput">
        {(field) => (
          <div className="flex flex-col gap-2">
            <div className="relative w-full">
              <InputField
                label="Required Skills"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && field.state.value) {
                    e.preventDefault();
                    const newSkill = field.state.value.trim();
                    handleAddSkill(newSkill);
                    field.handleChange("");
                  }
                }}
                field={field}
                className="w-full"
                placeholder="e.g., JavaScript, React, Node.js"
              />
              <Icon
                name="Plus"
                className="size-4 absolute top-1/2 mt-1 right-2"
              />
            </div>
            <div className="flex  gap-2 items-center">
              {skills?.map((skill: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-500/10 text-primary px-3 py-2  rounded-full text-sm"
                >
                  {skill}
                  <Icon
                    name="X"
                    className="size-3 ml-1 cursor-pointer"
                    onClick={() => handleRemoveSkill(skill)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createJob.isPending}>
          {createJob.isPending ? (
            <>
              <Icon name="Loader" className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Icon name="Plus" className="w-4 h-4 mr-2" />
              Create Job
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
