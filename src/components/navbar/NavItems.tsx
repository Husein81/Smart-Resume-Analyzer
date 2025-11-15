"use client";
import Link from "next/link";
import { Shad } from "../ui";
import { useIsMobile } from "@/hooks/use-mobile";
import Icon from "../icon";
import { Activity, useEffectEvent } from "react";
import { useEffect, useState } from "react";

const NavItems = () => {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

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
  const handleMounted = useEffectEvent(() => {
    setMounted(true);
  });

  useEffect(() => {
    handleMounted();
  }, []);
  if (!mounted) return null;

  return (
    <Activity mode={isMobile ? "hidden" : "visible"}>
      <Shad.NavigationMenu>
        <Shad.NavigationMenuList>
          {items.map((item) => (
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
