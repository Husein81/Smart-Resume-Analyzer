"use client";

import Link from "next/link";
import NavUser from "./NavUser";
import Image from "next/image";
import NavItems from "./NavItems";
import { useTheme } from "next-themes";

const Navbar = () => {
  const { theme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;

  const src =
    activeTheme === "dark" ? "/assets/logo.png" : "/assets/light-logo.png";

  return (
    <nav className="flex items-center z-50 justify-between mx-auto py-4 px-6 bg-background shadow-md opacity-90 sticky top-0">
      <Link href="/" className="flex items-center">
        <Image
          src={src}
          className=" w-10 h-10 mr-2"
          alt="logo"
          width={40}
          height={40}
        />
        <h1 className="text-xl font-bold">ResuAI</h1>
      </Link>
      <NavItems />

      <NavUser />
    </nav>
  );
};
export default Navbar;
