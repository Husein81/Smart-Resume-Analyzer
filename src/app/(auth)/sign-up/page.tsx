import { SignUpForm } from "@/components/auth";

export default function SignUpPage() {
  return (
    <div className="bg-background w-2/3 border shadow-lg rounded-lg mx-auto mt-12 p-4 space-y-2">
      <h2 className="text-2xl font-medium text-center">Sign Up</h2>
      <SignUpForm />
    </div>
  );
}
