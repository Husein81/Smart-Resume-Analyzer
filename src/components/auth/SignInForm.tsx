"use client";
import { useForm } from "@tanstack/react-form";
import { InputField } from "../form-fields/";
import { signIn } from "next-auth/react";
import { Button } from "../ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SignInForm = () => {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await signIn("credentials", {
          email: value.email,
          password: value.password,
          redirect: true,
        });
        router.push("/");
      } catch (error) {
        console.error("Sign-in error:", error);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="hover:underline">
          Sign up
        </Link>
      </span>
    </form>
  );
};
export default SignInForm;
