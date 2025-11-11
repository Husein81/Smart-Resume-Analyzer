import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    const existedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existedUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: { id: user.id, name: user.name, email: user.email },
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to sign up user" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
