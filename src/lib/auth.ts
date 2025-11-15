import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { Prisma } from "@/app/generated/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password)
          throw new Error("Missing credentials");

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/sign-in`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );
          const user = await res.json();
          return user;
        } catch (error) {
          console.error("Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;

        let user = await prisma.user.findUnique({
          where: { email },
        });

        // Sign up with google
        if (!user) {
          // Generate a random strong password
          const randomPassword = crypto.randomBytes(32).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          const data: Prisma.UserCreateInput = {
            email,
            name: profile?.name ?? "",
            avatar: profile?.image,
            plan: "FREE",
            password: hashedPassword,
          };

          user = await prisma.user.create({
            data,
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        // Store user ID and basic info in token
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatar = user.avatar;
        token.plan = user.plan;
      }

      // Handle Google sign-in
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            plan: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.avatar = dbUser.avatar ?? "";
          token.plan = dbUser.plan;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          avatar: token.avatar as string | undefined,
          plan: token.plan as "FREE" | "PREMIUM",
        };
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/sign-in", // optional custom sign-in page
  },
};
