"use client";
import { SignInForm } from "@/components/auth";
import Icon from "@/components/icon";
import { Button } from "@/components/ui";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="bg-background w-2/3 border shadow-lg rounded-lg mx-auto mt-12 p-6 space-y-2">
      <h2 className="text-2xl font-medium text-center">Sign In</h2>
      <div className="flex justify-center">
        <Button
          variant={"secondary"}
          data-slot="button"
          className="w-full"
          onClick={async () => signIn("google")}
        >
          <Icon name="Google" className="inline-block size-5 mr-2" />
          Sign in with Google
        </Button>
      </div>
      <div className="flex items-center gap-4 mt-6">
        <div className="h-px w-full bg-border" />
        <p className="text-center text-sm text-muted-foreground">OR</p>
        <div className="h-px w-full bg-border" />
      </div>
      <SignInForm />
    </div>
  );
}
