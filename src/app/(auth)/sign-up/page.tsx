"use client";
import { SignUpForm } from "@/components/auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  return (
    <div className="bg-background w-2/3 border shadow-lg rounded-lg mx-auto mt-12 p-6 space-y-2">
      <h2 className="text-2xl font-medium text-center">Sign Up</h2>
      <SignUpForm />
    </div>
  );
}
