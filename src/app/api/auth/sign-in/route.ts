import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const existedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existedUser) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const verifyPassword = await bcrypt.compare(password, existedUser.password);
    if (!verifyPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user: existedUser });
  } catch (error) {
    console.error("Error during sign-in:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
