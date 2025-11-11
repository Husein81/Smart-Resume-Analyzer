"use client";
import { useForm } from "@tanstack/react-form";
import { InputField } from "../form-fields/";
import { signIn } from "next-auth/react";
import { Button } from "../ui";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SignUpForm = () => {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const res = await fetch(`${API_URL}/auth/sign-up`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: value.name,
            email: value.email,
            password: value.password,
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to sign up");
        }
        // Automatically sign in the user after successful sign-up
        await signIn("credentials", {
          email: value.email,
          password: value.password,
          redirect: true,
        });
      } catch (error) {
        console.error("Sign-up error:", error);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <form.Field name="name">
        {(field) => (
          <InputField
            label="Name"
            placeholder={"John Doe"}
            field={field}
            type="text"
            required
          />
        )}
      </form.Field>
      <form.Field name="email">
        {(field) => (
          <InputField
            label="Email"
            placeholder={"example@gmail.com"}
            field={field}
            type="email"
            required
          />
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <InputField
            label="Password"
            placeholder={"Enter your password"}
            field={field}
            type="password"
            required
          />
        )}
      </form.Field>

      <Button type="submit" className="mt-4 w-full">
        Sign In
      </Button>

      <span className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="hover:underline">
          Sign in
        </Link>
      </span>
    </form>
  );
};
export default SignUpForm;
