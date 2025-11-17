"use client";
import Link from "next/link";
import { Shad } from "../ui";
import { useIsMobile } from "@/hooks/use-mobile";
import Icon from "../icon";
import { Activity, useEffectEvent } from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const NavItems = () => {
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  const [mounted, setMounted] = useState(false);

  const user = session?.user;

  const items = [
    {
      label: "Upload Resume",
      href: "/upload",
      description: "Upload your resume for AI-powered analysis.",
    },
    {
      label: "My Resumes",
      href: "/resumes",
      description: "View and manage all your uploaded resumes.",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      description: "View your analytics and performance insights.",
    },
    {
      label: "Profile",
      href: "/profile",
      description: "Manage your account settings and preferences.",
    },
  ];

  const guestItems = [
    {
      label: "Price Plans",
      href: "/pricing",
      description: "Explore our pricing plans and choose the best fit for you.",
    },
    {
      label: "Login to Access Dashboard",
      href: "/sign-in",
      description: "Sign in to view your analytics and saved resumes.",
    },
  ];

  const handleMounted = useEffectEvent(() => {
    setMounted(true);
  });

  useEffect(() => {
    handleMounted();
  }, []);
  if (!mounted) return null;

  const navItems = user ? items : guestItems;

  return (
    <Activity mode={isMobile ? "hidden" : "visible"}>
      <Shad.NavigationMenu>
        <Shad.NavigationMenuList>
          {navItems.map((item) => (
            <Shad.NavigationMenuItem key={item.label}>
              <Shad.NavigationMenuTrigger>
                {item.label}
              </Shad.NavigationMenuTrigger>

              <Shad.NavigationMenuContent className="p-4 w-[300px] sm:w-[400px] lg:w-[450px]">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="text-primary text-sm font-medium hover:underline mt-1"
                  >
                    Go to {item.label}{" "}
                    <Icon
                      name="ArrowRight"
                      className="inline-block size-4 ml-1"
                    />
                  </Link>
                </div>
              </Shad.NavigationMenuContent>
            </Shad.NavigationMenuItem>
          ))}
        </Shad.NavigationMenuList>
      </Shad.NavigationMenu>
    </Activity>
  );
};

export default NavItems;
