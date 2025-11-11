import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getServerSession();
  console.log(session?.user);

  if (!session?.user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
