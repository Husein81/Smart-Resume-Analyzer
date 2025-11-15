import "next-auth";
import "next-auth/jwt";
import { Plan } from "@/app/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: Plan;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: User;
  }
}
