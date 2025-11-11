"use client";
// global imports
import { AnyFieldApi } from "@tanstack/react-form";
import { Activity, useState } from "react";

//  local imports
import { Input, Label } from "../ui";
import Icon from "../icon";
import FieldInfo from "./field-info";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  field: AnyFieldApi;
  placeholder?: string;
  subLabel?: string;
} & React.ComponentProps<"input">;

const InputField = ({
  label,
  field,
  subLabel,
  placeholder,
  type = "text",
  ...props
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name}>
        {label}
        <Activity mode={props.required ? "visible" : "hidden"}>
          <span className="text-red-500"> *</span>
        </Activity>
      </Label>
      <div className="relative">
        <Input
          name={field.name}
          type={isPassword && showPassword ? "text" : type}
          value={field.state.value ?? ""}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          {...props}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            field.handleChange(e.target.value)
          }
        />
        <Activity mode={isPassword ? "visible" : "hidden"}>
          <Icon
            name={showPassword ? "Eye" : "EyeOff"}
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              "cursor-pointer absolute right-2 top-1/2 -translate-y-1/2"
            )}
          />
        </Activity>
        <Activity mode={subLabel ? "visible" : "hidden"}>
          <p className="text-muted-foreground mt-2 text-xs">{subLabel}</p>
        </Activity>
      </div>
      <FieldInfo field={field} className={cn("text-destructive")} />
    </div>
  );
};

export default InputField;
