"use client";
// global imports
import { AnyFieldApi } from "@tanstack/react-form";
import { Activity } from "react";

//  local imports
import { cn } from "@/lib/utils";
import { Label } from "../ui";
import { Textarea } from "../ui/textarea";
import FieldInfo from "./field-info";

type Props = {
  label: string;
  field: AnyFieldApi;
  placeholder?: string;
  subLabel?: string;
} & React.ComponentProps<"textarea">;

const TextareaField = ({
  label,
  field,
  subLabel,
  placeholder,
  ...props
}: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name}>
        {label}
        <Activity mode={props.required ? "visible" : "hidden"}>
          <span className="text-red-500"> *</span>
        </Activity>
      </Label>
      <div className="relative">
        <Textarea
          name={field.name}
          value={field.state.value ?? ""}
          placeholder={placeholder}
          {...props}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            field.handleChange(e.target.value)
          }
        />
        <Activity mode={subLabel ? "visible" : "hidden"}>
          <p className="text-muted-foreground mt-2 text-xs">{subLabel}</p>
        </Activity>
      </div>
      <FieldInfo field={field} className={cn("text-destructive")} />
    </div>
  );
};

export default TextareaField;
