"use client";
import { signOut, useSession } from "next-auth/react";
import { Button, Shad } from "../ui";
import { useRouter } from "next/navigation";
import { Activity } from "react";
import Icon from "../icon";
import { useIsMobile } from "@/hooks/use-mobile";

const NavUser = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;
  const isMobile = useIsMobile();

  if (!user)
    return <Button onClick={() => router.push("/sign-in")}>Login</Button>;

  return (
    <div className="flex items-center gap-4">
      <Shad.DropdownMenu>
        <Shad.DropdownMenuTrigger asChild>
          <Shad.Avatar className="w-8 h-8 rounded-full cursor-pointer">
            <Shad.AvatarImage src={user?.avatar} alt="User Avatar" />
            <Shad.AvatarFallback>{user.name.charAt(0)}</Shad.AvatarFallback>
          </Shad.Avatar>
        </Shad.DropdownMenuTrigger>
        <Shad.DropdownMenuContent align="end" className="w-48">
          <Shad.DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/subscription")}
          >
            <Icon name="CreditCard" className="w-4 h-4 mr-2" />
            Subscription
          </Shad.DropdownMenuItem>
          <Shad.DropdownMenuItem className="cursor-pointer">
            <Icon name="User" className="w-4 h-4 mr-2" />
            Profile
          </Shad.DropdownMenuItem>
          <Shad.DropdownMenuItem className="cursor-pointer">
            <Icon name="Settings" className="w-4 h-4 mr-2" />
            Settings
          </Shad.DropdownMenuItem>
          <Shad.DropdownMenuSeparator />
          <Shad.DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-destructive"
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
