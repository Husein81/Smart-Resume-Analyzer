import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);
    if (!verifyPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error during sign-in:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
