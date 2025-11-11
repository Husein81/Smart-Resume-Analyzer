"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import NavUser from "./NavUser";

// Dynamically import NavItems with no SSR to prevent hydration mismatch
const NavItems = dynamic(() => import("./NavItems"), {
  ssr: false,
  loading: () => <div className="h-9" />,
});

const Navbar = () => {
  return (
    <nav className="flex items-center z-50 justify-between mx-auto py-4 px-6 bg-white shadow-md opacity-90 sticky top-0">
      <Link href="/">
        <h1 className="text-xl font-bold">ResuAI</h1>
      </Link>
      <NavItems />
      <NavUser />
    </nav>
  );
};
export default Navbar;
