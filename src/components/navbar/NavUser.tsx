"use client";
import { signOut, useSession } from "next-auth/react";
import { Button, Separator, Shad } from "../ui";
import { useRouter } from "next/navigation";
import { Activity } from "react";
import Icon from "../icon";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModeToggle } from "../ModeToggle";

const NavUser = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;
  const isMobile = useIsMobile();

  const items = [
    {
      label: "Upload Resume",
      href: "/upload",
      icon: "Upload",
    },
    {
      label: "My Resumes",
      href: "/resumes",
      icon: "FileText",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "Gauge",
    },
  ];

  if (!user)
    return <Button onClick={() => router.push("/sign-in")}>Login</Button>;

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-4">
      <ModeToggle />
      <Shad.DropdownMenu>
        <Shad.DropdownMenuTrigger asChild>
          <Shad.Avatar className="w-8 h-8 rounded-full cursor-pointer">
            <Shad.AvatarImage src={user?.avatar} alt="User Avatar" />
            <Shad.AvatarFallback>{user.name.charAt(0)}</Shad.AvatarFallback>
          </Shad.Avatar>
        </Shad.DropdownMenuTrigger>
        <Shad.DropdownMenuContent align="end" className="w-full">
          <Shad.DropdownMenuItem>
            <Shad.Avatar className="size-10 rounded-full mr-2">
              <Shad.AvatarImage src={user?.avatar} alt="User Avatar" />
              <Shad.AvatarFallback>{user.name.charAt(0)}</Shad.AvatarFallback>
            </Shad.Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </Shad.DropdownMenuItem>
          <Shad.DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/subscription")}
          >
            <Icon name="CreditCard" className="w-4 h-4 mr-2" />
            Subscription
          </Shad.DropdownMenuItem>

          <Activity mode={isMobile ? "visible" : "hidden"}>
            <Separator />
            {items.map((item) => (
              <Shad.DropdownMenuItem
                key={item.label}
                className="cursor-pointer"
                onClick={() => router.push(item.href)}
              >
                <Icon name={item.icon} className="w-4 h-4 mr-2" />
                {item.label}
              </Shad.DropdownMenuItem>
            ))}
          </Activity>

          <Separator />

          <Shad.DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer"
          >
            <Icon name="LogOut" className="w-4 h-4 mr-2" />
            Logout
          </Shad.DropdownMenuItem>
        </Shad.DropdownMenuContent>
      </Shad.DropdownMenu>

      <Activity mode={user.plan === "FREE" && !isMobile ? "visible" : "hidden"}>
        <Button onClick={() => router.push("/pricing")}>
          <Icon name="Crown" />
          Upgrade
        </Button>
      </Activity>
    </div>
  );
};
export default NavUser;
