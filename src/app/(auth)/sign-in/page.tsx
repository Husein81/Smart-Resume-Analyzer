import { SignInForm } from "@/components/auth";
import Icon from "@/components/icon";
import { Button } from "@/components/ui";

export default function SignInPage() {
  return (
    <div className="bg-background w-2/3 border shadow-lg rounded-lg mx-auto mt-12 p-4 space-y-2">
      <h2 className="text-2xl font-medium text-center">Sign In</h2>
      <SignInForm />
      <div className="flex items-center gap-4 mt-6">
        <div className="h-px w-full bg-border" />
        <p className="text-center text-sm text-muted-foreground">OR</p>
        <div className="h-px w-full bg-border" />
      </div>
      <div className="flex justify-center">
        <Button variant={"secondary"} className="w-full">
          <Icon name="Google" className="inline-block size-5 mr-2" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
